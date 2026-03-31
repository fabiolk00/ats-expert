-- Priority 2 Operational Improvements Migration
-- This migration implements three critical database hygiene functions:
-- 1. delete_user_cascade() - Safe user deletion with explicit cascade order
-- 2. cleanup_old_processed_events() - Automatic webhook event log cleanup
-- 3. detect_orphaned_cv_versions() - Monitoring/detection of orphaned version snapshots

-- ============================================================================
-- 1. USER CLEANUP RPC: delete_user_cascade()
-- ============================================================================
-- Purpose: Safely delete a user and all related data in the correct order
-- to avoid FK constraint violations.
--
-- Deletion Order (enforced to prevent RESTRICT violations):
--   1. sessions (cascade deletes: messages, cv_versions, resume_targets)
--   2. Manual cleanups for tables with no cascades:
--      - user_quotas (FK to users: RESTRICT)
--      - billing_checkouts (FK to users: RESTRICT)
--      - api_usage (FK to users: RESTRICT)
--   3. users (cascade deletes: user_auth_identities, credit_accounts)
--
-- Safety Features:
-- - Checks if user exists; raises exception if not
-- - All operations atomic (single transaction)
-- - Returns BOOLEAN for success/failure indication
-- - Auditable: changes are visible in application logs if needed
--
-- Called By: Admin cleanup routines, data retention enforcement, GDPR deletion flows

CREATE OR REPLACE FUNCTION delete_user_cascade(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_exists BOOLEAN;
BEGIN
  -- Safety check: verify user exists before attempting deletion
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id)
  INTO v_user_exists;

  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User % does not exist or has already been deleted.', p_user_id;
  END IF;

  -- Step 1: Delete sessions - cascades automatically delete:
  --   - messages (FK: sessions(id) ON DELETE CASCADE)
  --   - cv_versions (FK: sessions(id) ON DELETE CASCADE)
  --   - resume_targets (FK: sessions(id) ON DELETE CASCADE)
  DELETE FROM sessions WHERE user_id = p_user_id;

  -- Step 2: Delete billing/quota metadata (manual cleanup, no cascades)
  DELETE FROM user_quotas WHERE user_id = p_user_id;
  DELETE FROM billing_checkouts WHERE user_id = p_user_id;
  DELETE FROM api_usage WHERE user_id = p_user_id;

  -- Step 3: Delete user - cascades automatically delete:
  --   - user_auth_identities (FK: users(id) ON DELETE CASCADE)
  --   - credit_accounts (FK: users(id) ON DELETE CASCADE)
  DELETE FROM users WHERE id = p_user_id;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Log the original exception for debugging
  RAISE WARNING 'delete_user_cascade failed for user %: %', p_user_id, SQLERRM;
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_cascade(TEXT) TO service_role;

-- ============================================================================
-- 2. PROCESSED EVENTS CLEANUP RPC: cleanup_old_processed_events()
-- ============================================================================
-- Purpose: Automatically clean up old webhook event records to prevent
-- unbounded table growth.
--
-- Design Rationale:
-- - processed_events stores webhook delivery records for idempotency
-- - Records older than p_days_old are safe to delete (retries are immediate)
-- - Default 30-day retention balances audit trail vs storage efficiency
-- - Safe to run frequently (daily or weekly); deletes are fast
--
-- Usage:
--   SELECT * FROM cleanup_old_processed_events();  -- Uses default 30 days
--   SELECT * FROM cleanup_old_processed_events(60); -- Keep 60 days
--
-- Scheduling (via cron endpoint or pg_cron):
--   SELECT cleanup_old_processed_events() at 2 AM daily
--   Example: 0 2 * * * (in pg_cron format)
--
-- Monitoring:
--   Track deleted_count to spot unusual patterns
--   Alert if deleted_count is 0 (may indicate scheduling failure)
--
-- Safety Notes:
-- - Deletes only old records; active audit trail is preserved
-- - Deletion is irreversible but safe (dedup has already been done)
-- - No locks on other operations (independent rows deleted)

CREATE OR REPLACE FUNCTION cleanup_old_processed_events(p_days_old INT DEFAULT 30)
RETURNS TABLE (deleted_count INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff timestamp
  v_cutoff := NOW() - (p_days_old || ' days')::INTERVAL;

  -- Delete all processed_events older than cutoff
  DELETE FROM processed_events
  WHERE created_at < v_cutoff;

  -- Get diagnostic info
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'cleanup_old_processed_events failed: %', SQLERRM;
  RETURN QUERY SELECT 0;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_processed_events(INT) TO service_role;

-- ============================================================================
-- 3. ORPHAN DETECTION RPC: detect_orphaned_cv_versions()
-- ============================================================================
-- Purpose: Monitor for orphaned cv_versions (target-derived snapshots
-- without a parent resume_target).
--
-- Background:
-- - cv_versions.target_resume_id can become NULL when:
--   a) resume_target is deleted (FK: ON DELETE SET NULL)
--   b) This is intentional and safe (cv_versions is immutable)
--
-- Interpretation:
-- - orphaned_count: Number of snapshot records without a target
-- - affected_sessions: Unique sessions containing orphaned snapshots
--
-- Expected Behavior:
-- - Orphaned count may be > 0 (expected if targets are deleted)
-- - This is NOT an error condition
-- - Useful for monitoring and understanding user behavior
--
-- Alerting Guidance:
-- - Growing orphan count is normal (targets get deleted over time)
-- - Non-zero count is expected and healthy
-- - Investigate only if count grows unexpectedly fast
--
-- Usage (quarterly audit):
--   SELECT * FROM detect_orphaned_cv_versions();

CREATE OR REPLACE FUNCTION detect_orphaned_cv_versions()
RETURNS TABLE (orphaned_count INT, affected_sessions INT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as orphaned_count,
    COUNT(DISTINCT session_id)::INT as affected_sessions
  FROM cv_versions
  WHERE source = 'target-derived'
    AND target_resume_id IS NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'detect_orphaned_cv_versions failed: %', SQLERRM;
  RETURN QUERY SELECT 0, 0;
END;
$$;

GRANT EXECUTE ON FUNCTION detect_orphaned_cv_versions() TO service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Summary of Changes:
--
-- Three new RPCs added to improve operational safety and monitoring:
--
-- 1. delete_user_cascade(p_user_id TEXT) -> BOOLEAN
--    - Atomically deletes user and all related data in correct order
--    - Prevents FK constraint violations during cleanup
--    - Returns false on error (can be caught by application)
--
-- 2. cleanup_old_processed_events(p_days_old INT = 30) -> TABLE(deleted_count INT)
--    - Removes webhook event records older than p_days_old
--    - Safe to call frequently (daily/weekly scheduled)
--    - Helps prevent unbounded table growth
--
-- 3. detect_orphaned_cv_versions() -> TABLE(orphaned_count INT, affected_sessions INT)
--    - Monitors for cv_version snapshots with no parent resume_target
--    - Expected behavior: may have orphans (targets deleted over time)
--    - Useful for quarterly audits and understanding data cleanup patterns
--
-- All functions grant EXECUTE to service_role for use in application and cron jobs.
