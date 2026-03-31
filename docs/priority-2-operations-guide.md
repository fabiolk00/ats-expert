# Priority 2 Operational Improvements - Testing & Deployment Guide

**Date**: 2026-03-31
**Migration**: `20260331_priority_2_operational_improvements.sql`
**Components**: 3 RPCs for user cleanup, event cleanup, and orphan monitoring

---

## Overview

This guide documents the 3 Priority 2 database improvements implemented to enhance operational safety and monitoring:

1. **`delete_user_cascade()`** - Safe, ordered user deletion
2. **`cleanup_old_processed_events()`** - Automatic webhook event cleanup
3. **`detect_orphaned_cv_versions()`** - Orphan monitoring and detection

All functions are designed to be production-safe, idempotent where appropriate, and integrated with existing architectural patterns.

---

## 1. User Cleanup RPC: `delete_user_cascade()`

### Purpose
Safely delete a user and all related data without triggering FK constraint violations.

### Function Signature
```sql
CREATE OR REPLACE FUNCTION delete_user_cascade(p_user_id TEXT)
RETURNS BOOLEAN
```

### How It Works
Deletes rows in a specific order to respect FK constraints:

```
1. sessions (+ cascades: messages, cv_versions, resume_targets)
   └─ Session.user_id RESTRICT → must delete sessions first

2. user_quotas, billing_checkouts, api_usage (manual, no cascades)
   └─ All reference users.id with ON DELETE RESTRICT

3. users (+ cascades: user_auth_identities, credit_accounts)
   └─ Once all other RESTRICT references are gone, delete user
```

### Safety Features
- **Existence check**: Raises exception if user doesn't exist
- **Atomic**: Single transaction (all-or-nothing)
- **Exception handling**: Returns FALSE on error; logs warning
- **FK-safe**: Deletion order respects all constraints

### Usage

#### Basic Deletion
```sql
-- Delete user and all related data
SELECT delete_user_cascade('usr_test_123');
-- Result: TRUE (success) or FALSE (error)
```

#### With Error Handling
```sql
DO $$
DECLARE
  v_success BOOLEAN;
BEGIN
  v_success := delete_user_cascade('usr_test_123');
  IF v_success THEN
    RAISE NOTICE 'User deleted successfully';
  ELSE
    RAISE NOTICE 'User deletion failed - check server logs';
  END IF;
END $$;
```

#### Application Integration (TypeScript)
```typescript
import { supabaseAdmin } from '@/lib/db/client'

async function deleteUserCompletely(appUserId: string) {
  const { data, error } = await supabaseAdmin.rpc(
    'delete_user_cascade',
    { p_user_id: appUserId }
  )

  if (error) {
    console.error('Failed to delete user:', error.message)
    return false
  }

  return data === true
}
```

### Test Scenarios

#### Test 1: Successful Deletion
```sql
-- Setup: Create test user with complete profile
INSERT INTO users (id, display_name, primary_email)
VALUES ('test_user_001', 'Test User', 'test@example.com');

INSERT INTO credit_accounts (id, user_id, credits_remaining)
VALUES ('cred_test_user_001', 'test_user_001', 100);

INSERT INTO sessions (id, user_id, cv_state)
VALUES ('session_001', 'test_user_001', '{"fullName":"John"}');

INSERT INTO messages (id, session_id, role, content)
VALUES ('msg_001', 'session_001', 'user', 'Help me optimize my resume');

-- Execute deletion
SELECT delete_user_cascade('test_user_001');

-- Verify: All rows deleted
SELECT COUNT(*) FROM users WHERE id = 'test_user_001';  -- 0
SELECT COUNT(*) FROM credit_accounts WHERE user_id = 'test_user_001';  -- 0
SELECT COUNT(*) FROM sessions WHERE user_id = 'test_user_001';  -- 0
SELECT COUNT(*) FROM messages WHERE id = 'msg_001';  -- 0
```

#### Test 2: Non-Existent User
```sql
-- Try to delete non-existent user
SELECT delete_user_cascade('nonexistent_user');
-- Result: FALSE (with warning in server logs)

-- Verify error was caught
SELECT pg_last_error();  -- Shows exception message
```

#### Test 3: Cascade Verification
```sql
-- Create complex user with multiple sessions, versions, targets
INSERT INTO users (id) VALUES ('test_user_002');
INSERT INTO credit_accounts (id, user_id, credits_remaining)
VALUES ('cred_test_user_002', 'test_user_002', 50);

INSERT INTO sessions (id, user_id, cv_state)
VALUES ('s1', 'test_user_002', '{"fullName":"Alice"}'),
       ('s2', 'test_user_002', '{"fullName":"Bob"}');

INSERT INTO messages (id, session_id, role, content)
VALUES ('m1', 's1', 'user', 'msg1'),
       ('m2', 's1', 'assistant', 'resp1'),
       ('m3', 's2', 'user', 'msg2');

INSERT INTO cv_versions (id, session_id, snapshot, source)
VALUES ('cv1', 's1', '{"fullName":"Alice"}', 'ingestion'),
       ('cv2', 's1', '{"fullName":"Alice Updated"}', 'rewrite'),
       ('cv3', 's2', '{"fullName":"Bob"}', 'ingestion');

INSERT INTO resume_targets (id, session_id, target_job_description, derived_cv_state)
VALUES ('rt1', 's1', 'Senior Software Engineer', '{"fullName":"Alice"}');

INSERT INTO cv_versions (id, session_id, target_resume_id, snapshot, source)
VALUES ('cv4', 's1', 'rt1', '{"fullName":"Alice - Target"}', 'target-derived');

-- Count pre-deletion
SELECT 'users' AS table_name, COUNT(*) as count FROM users WHERE id = 'test_user_002'
UNION ALL
SELECT 'credit_accounts', COUNT(*) FROM credit_accounts WHERE user_id = 'test_user_002'
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions WHERE user_id = 'test_user_002'
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE session_id IN ('s1', 's2')
UNION ALL
SELECT 'cv_versions', COUNT(*) FROM cv_versions WHERE session_id IN ('s1', 's2')
UNION ALL
SELECT 'resume_targets', COUNT(*) FROM resume_targets WHERE id IN ('rt1')
UNION ALL
SELECT 'user_quotas', COUNT(*) FROM user_quotas WHERE user_id = 'test_user_002';

-- Delete user
SELECT delete_user_cascade('test_user_002');

-- Verify all cascade-deleted
SELECT 'users' AS table_name, COUNT(*) as count FROM users WHERE id = 'test_user_002'
UNION ALL
SELECT 'credit_accounts', COUNT(*) FROM credit_accounts WHERE user_id = 'test_user_002'
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions WHERE user_id = 'test_user_002'
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE session_id IN ('s1', 's2')
UNION ALL
SELECT 'cv_versions', COUNT(*) FROM cv_versions WHERE session_id IN ('s1', 's2')
UNION ALL
SELECT 'resume_targets', COUNT(*) FROM resume_targets WHERE id IN ('rt1')
UNION ALL
SELECT 'user_quotas', COUNT(*) FROM user_quotas WHERE user_id = 'test_user_002';
-- All should be 0
```

### Deployment Notes

- **Timing**: Can deploy immediately; no dependencies
- **Performance**: O(n) where n = total rows for that user
- **Backup**: Ensure database backups exist before production testing
- **Audit**: Consider logging calls to this RPC for compliance

---

## 2. Processed Events Cleanup: `cleanup_old_processed_events()`

### Purpose
Automatically remove webhook event records older than a specified age to prevent unbounded table growth.

### Function Signature
```sql
CREATE OR REPLACE FUNCTION cleanup_old_processed_events(p_days_old INT DEFAULT 30)
RETURNS TABLE (deleted_count INT)
```

### Design Rationale

**Why cleanup is safe**:
- `processed_events` is used for webhook idempotency (dedup)
- Retries happen immediately (within minutes)
- Events older than 30 days are extremely unlikely to be retried
- Deleting old events does NOT affect active dedup (new events have different timestamps)

**Table size impact** (estimated):
```
Production assumptions:
- ~100-200 webhook events/day (billing events, cancellations)
- ~30KB per event record (payload JSONB)
- Monthly growth: ~3GB without cleanup
- 1-year accumulation: ~36GB

With 30-day cleanup:
- Steady state: ~1.8GB
- Annual cleanup: ~36GB deleted
```

### Usage

#### Default: Keep 30 Days
```sql
-- Clean up events older than 30 days
SELECT cleanup_old_processed_events();

-- Result: deleted_count (number of rows deleted)
-- Example: 4500 rows deleted (150/day × 30 days)
```

#### Custom Retention Period
```sql
-- Keep 60 days of history
SELECT cleanup_old_processed_events(60);

-- Keep 7 days (aggressive cleanup)
SELECT cleanup_old_processed_events(7);

-- Keep 90 days (conservative)
SELECT cleanup_old_processed_events(90);
```

#### Scheduled via Cron (pg_cron extension)

```sql
-- Create a cron job to run daily at 2 AM
SELECT cron.schedule(
  'cleanup_old_events_daily',
  '0 2 * * *',  -- Daily at 2 AM
  'SELECT cleanup_old_processed_events(30)'
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule (if needed)
SELECT cron.unschedule('cleanup_old_events_daily');
```

#### Scheduled via Application Cron Endpoint

Integrate with `GET /api/cron/cleanup` route:

```typescript
// src/app/api/cron/cleanup/route.ts
export async function GET(req: NextRequest) {
  // ... auth check ...

  const { data, error } = await supabaseAdmin.rpc(
    'cleanup_old_processed_events',
    { p_days_old: 30 }
  )

  if (error) {
    console.error('Cleanup failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    deleted: data[0].deleted_count,
  })
}
```

### Monitoring & Alerting

#### Track Cleanup Metrics
```sql
-- View cleanup history (if logging is enabled)
-- Manually track with app-level observability:

-- Before cleanup
SELECT COUNT(*) as event_count FROM processed_events;

-- Run cleanup
SELECT cleanup_old_processed_events(30) as result;

-- After cleanup
SELECT COUNT(*) as event_count FROM processed_events;

-- Difference = deleted_count
```

#### Alert Patterns

```typescript
// Application-level alerting example
async function monitorEventCleanup() {
  const { data: result } = await supabaseAdmin.rpc(
    'cleanup_old_processed_events',
    { p_days_old: 30 }
  )

  const deletedCount = result[0].deleted_count

  // Alert if nothing deleted (may indicate job not running)
  if (deletedCount === 0) {
    console.warn('No events deleted in cleanup - schedule may have failed')
  }

  // Alert if too many (may indicate schedule is behind)
  if (deletedCount > 10000) {
    console.warn(
      `Unusual number of events deleted: ${deletedCount} - consider more frequent runs`
    )
  }

  return deletedCount
}
```

### Test Scenarios

#### Test 1: Basic Cleanup
```sql
-- Setup: Insert test events with varying ages
INSERT INTO processed_events (id, event_id, event_fingerprint, event_type, created_at)
VALUES
  (gen_random_uuid()::TEXT, 'evt_old_1', 'fp_old_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '60 days'),
  (gen_random_uuid()::TEXT, 'evt_old_2', 'fp_old_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '45 days'),
  (gen_random_uuid()::TEXT, 'evt_new_1', 'fp_new_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '5 days'),
  (gen_random_uuid()::TEXT, 'evt_new_2', 'fp_new_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '2 days');

-- Before cleanup
SELECT COUNT(*) as total_events FROM processed_events;  -- 4

-- Cleanup: delete events older than 30 days
SELECT * FROM cleanup_old_processed_events(30);
-- Result: deleted_count = 2 (events from 60 and 45 days ago)

-- After cleanup
SELECT COUNT(*) as total_events FROM processed_events;  -- 2

-- Verify new events remain
SELECT COUNT(*) as recent_events FROM processed_events
WHERE created_at > NOW() - INTERVAL '10 days';  -- 2
```

#### Test 2: Aggressive Cleanup
```sql
-- Setup: Mix of old and new events
DELETE FROM processed_events; -- Clear for clean test
INSERT INTO processed_events (id, event_id, event_fingerprint, event_type, created_at)
VALUES
  (gen_random_uuid()::TEXT, 'evt_30d', 'fp_30d', 'PAYMENT_RECEIVED', NOW() - INTERVAL '30 days'),
  (gen_random_uuid()::TEXT, 'evt_7d', 'fp_7d', 'PAYMENT_RECEIVED', NOW() - INTERVAL '7 days'),
  (gen_random_uuid()::TEXT, 'evt_1d', 'fp_1d', 'PAYMENT_RECEIVED', NOW() - INTERVAL '1 day'),
  (gen_random_uuid()::TEXT, 'evt_today', 'fp_today', 'PAYMENT_RECEIVED', NOW());

-- Aggressive cleanup: keep only 7 days
SELECT * FROM cleanup_old_processed_events(7);
-- Result: deleted_count = 1 (event from 30 days ago)

-- Verify boundary
SELECT COUNT(*) FROM processed_events WHERE created_at < NOW() - INTERVAL '7 days';  -- 0
SELECT COUNT(*) FROM processed_events WHERE created_at >= NOW() - INTERVAL '7 days';  -- 3
```

#### Test 3: No Deletion When All Recent
```sql
-- Setup: Only new events
DELETE FROM processed_events;
INSERT INTO processed_events (id, event_id, event_fingerprint, event_type, created_at)
VALUES
  (gen_random_uuid()::TEXT, 'evt_1', 'fp_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '5 days'),
  (gen_random_uuid()::TEXT, 'evt_2', 'fp_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '2 days'),
  (gen_random_uuid()::TEXT, 'evt_3', 'fp_3', 'PAYMENT_RECEIVED', NOW());

-- Cleanup with 30-day retention
SELECT * FROM cleanup_old_processed_events(30);
-- Result: deleted_count = 0 (all events are recent)

-- Verify nothing deleted
SELECT COUNT(*) FROM processed_events;  -- 3
```

### Performance Considerations

- **Runtime**: ~50-100ms for typical 30-day cleanup (1000s of rows)
- **Locking**: Minimal impact (row-level locks only, not table-level)
- **Index usage**: Uses `created_at` index for efficient range scan
- **Safe frequency**: Can run hourly without performance impact

---

## 3. Orphan Detection: `detect_orphaned_cv_versions()`

### Purpose
Monitor and detect orphaned cv_versions records (target-derived snapshots without a parent resume_target).

### Function Signature
```sql
CREATE OR REPLACE FUNCTION detect_orphaned_cv_versions()
RETURNS TABLE (orphaned_count INT, affected_sessions INT)
```

### Background

**What are orphaned cv_versions?**

```
Normal flow:
  resume_target (id: rt1)
    └─ cv_versions (target_resume_id: rt1, source: 'target-derived')
       [snapshot of derived CV for that specific job]

After target deletion:
  resume_target deleted
    └─ cv_versions (target_resume_id: NULL, source: 'target-derived')
       [orphaned but preserved - immutable snapshot remains]
```

**FK constraint design**:
```sql
cv_versions.target_resume_id
  → resume_targets.id
  ON DELETE SET NULL  ← allows orphans, preserves history
```

**Is this a problem?**
- **No, this is intentional**
- Orphaned snapshots don't affect functionality
- Immutable history is preserved (audit trail)
- Safe to clean up manually if needed later

### Usage

#### Quarterly Audit
```sql
-- Run quarterly to check orphan status
SELECT * FROM detect_orphaned_cv_versions();

-- Expected output:
-- orphaned_count | affected_sessions
-- --------------|------------------
--        1542    |      847
```

#### Interpret Results

| Scenario | Meaning | Action |
|----------|---------|--------|
| `0, 0` | No orphans exist | Normal (targets never deleted) |
| `100+, 50+` | Expected orphans | Normal (users delete targets) |
| Growing rapidly | High target deletion rate | Normal (user behavior) |
| Same every run | Stable orphan count | Normal and healthy |

#### Application Integration

```typescript
// src/lib/db/monitoring.ts
export async function detectOrphanedVersions() {
  const { data, error } = await supabaseAdmin.rpc(
    'detect_orphaned_cv_versions'
  )

  if (error) {
    console.error('Orphan detection failed:', error)
    return null
  }

  const { orphaned_count, affected_sessions } = data[0]

  // Log for monitoring
  console.info('Orphaned CV versions detected', {
    orphaned_count,
    affected_sessions,
    timestamp: new Date().toISOString(),
  })

  return { orphaned_count, affected_sessions }
}

// Call quarterly
setInterval(detectOrphanedVersions, 7 * 24 * 60 * 60 * 1000) // Weekly (overkill)
```

### Test Scenarios

#### Test 1: Detect Orphans After Target Deletion
```sql
-- Setup: Create session with target-derived versions
INSERT INTO users (id) VALUES ('test_user_orphan_1');
INSERT INTO sessions (id, user_id, cv_state)
VALUES ('sess_orphan', 'test_user_orphan_1', '{"fullName":"Test"}');

INSERT INTO resume_targets (id, session_id, target_job_description, derived_cv_state)
VALUES ('target_orphan', 'sess_orphan', 'Software Engineer', '{"fullName":"Test"}');

INSERT INTO cv_versions (id, session_id, target_resume_id, snapshot, source)
VALUES ('cv_orphan', 'sess_orphan', 'target_orphan', '{"fullName":"Test - Target"}', 'target-derived');

-- Before deletion
SELECT * FROM detect_orphaned_cv_versions();
-- Result: orphaned_count = 0, affected_sessions = 0

-- Delete the target
DELETE FROM resume_targets WHERE id = 'target_orphan';

-- After deletion
SELECT * FROM detect_orphaned_cv_versions();
-- Result: orphaned_count = 1, affected_sessions = 1
-- (cv_versions.target_resume_id = NULL but row still exists)

-- Verify orphaned record exists
SELECT id, session_id, target_resume_id, source FROM cv_versions
WHERE id = 'cv_orphan';
-- Result: cv_orphan | sess_orphan | NULL | target-derived
```

#### Test 2: Multiple Orphans From Multiple Targets
```sql
-- Setup: Create multiple targets for same session
INSERT INTO users (id) VALUES ('test_user_orphan_2');
INSERT INTO sessions (id, user_id, cv_state)
VALUES ('sess_multi', 'test_user_orphan_2', '{"fullName":"Alice"}');

INSERT INTO resume_targets (id, session_id, target_job_description, derived_cv_state)
VALUES
  ('target_1', 'sess_multi', 'Job 1', '{"fullName":"Alice - Job1"}'),
  ('target_2', 'sess_multi', 'Job 2', '{"fullName":"Alice - Job2"}'),
  ('target_3', 'sess_multi', 'Job 3', '{"fullName":"Alice - Job3"}');

INSERT INTO cv_versions (id, session_id, target_resume_id, snapshot, source)
VALUES
  ('cv_t1', 'sess_multi', 'target_1', '{"fullName":"Alice - Job1"}', 'target-derived'),
  ('cv_t2', 'sess_multi', 'target_2', '{"fullName":"Alice - Job2"}', 'target-derived'),
  ('cv_t3', 'sess_multi', 'target_3', '{"fullName":"Alice - Job3"}', 'target-derived');

-- Delete 2 out of 3 targets
DELETE FROM resume_targets WHERE id IN ('target_1', 'target_3');

-- Check orphans
SELECT * FROM detect_orphaned_cv_versions();
-- Result: orphaned_count = 2, affected_sessions = 1

-- Verify 2 versions are orphaned, 1 still has parent
SELECT COUNT(*) FROM cv_versions
WHERE session_id = 'sess_multi' AND target_resume_id IS NULL;  -- 2
SELECT COUNT(*) FROM cv_versions
WHERE session_id = 'sess_multi' AND target_resume_id IS NOT NULL;  -- 1
```

#### Test 3: Multiple Sessions With Orphans
```sql
-- Setup: Multiple sessions, each with targets
INSERT INTO users (id) VALUES ('test_user_orphan_3');

INSERT INTO sessions (id, user_id, cv_state)
VALUES
  ('sess_a', 'test_user_orphan_3', '{"fullName":"User A"}'),
  ('sess_b', 'test_user_orphan_3', '{"fullName":"User B"}'),
  ('sess_c', 'test_user_orphan_3', '{"fullName":"User C"}');

INSERT INTO resume_targets (id, session_id, target_job_description, derived_cv_state)
VALUES
  ('target_a1', 'sess_a', 'Job A1', '{}'),
  ('target_a2', 'sess_a', 'Job A2', '{}'),
  ('target_b1', 'sess_b', 'Job B1', '{}'),
  ('target_c1', 'sess_c', 'Job C1', '{}');

INSERT INTO cv_versions (id, session_id, target_resume_id, snapshot, source)
VALUES
  ('cv_a1', 'sess_a', 'target_a1', '{}', 'target-derived'),
  ('cv_a2', 'sess_a', 'target_a2', '{}', 'target-derived'),
  ('cv_b1', 'sess_b', 'target_b1', '{}', 'target-derived'),
  ('cv_c1', 'sess_c', 'target_c1', '{}', 'target-derived');

-- Delete some targets
DELETE FROM resume_targets WHERE id IN ('target_a1', 'target_b1');

-- Check orphans
SELECT * FROM detect_orphaned_cv_versions();
-- Result: orphaned_count = 2, affected_sessions = 2
-- (sessions a and b both have orphans)
```

#### Test 4: No Orphans With Active Targets
```sql
-- Setup: Targets with active versions
DELETE FROM cv_versions;
DELETE FROM resume_targets;
DELETE FROM sessions;
DELETE FROM users;

INSERT INTO users (id) VALUES ('test_user_orphan_4');
INSERT INTO sessions (id, user_id, cv_state)
VALUES ('sess_clean', 'test_user_orphan_4', '{"fullName":"Clean"}');

INSERT INTO resume_targets (id, session_id, target_job_description, derived_cv_state)
VALUES ('target_clean', 'sess_clean', 'Job', '{}');

INSERT INTO cv_versions (id, session_id, target_resume_id, snapshot, source)
VALUES ('cv_clean', 'sess_clean', 'target_clean', '{}', 'target-derived');

-- Check orphans
SELECT * FROM detect_orphaned_cv_versions();
-- Result: orphaned_count = 0, affected_sessions = 0
```

### Monitoring Strategy

#### Weekly Report
```sql
-- Track orphan trend over time
CREATE TABLE orphan_audit_log (
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  orphaned_count INT,
  affected_sessions INT
);

-- Run weekly
INSERT INTO orphan_audit_log (orphaned_count, affected_sessions)
SELECT orphaned_count, affected_sessions FROM detect_orphaned_cv_versions();

-- View trend
SELECT checked_at, orphaned_count, affected_sessions FROM orphan_audit_log
ORDER BY checked_at DESC
LIMIT 52;  -- Last year
```

#### Dashboard Query
```sql
-- For ops dashboard: latest orphan status
SELECT
  (SELECT orphaned_count FROM detect_orphaned_cv_versions()) as orphaned_cv_versions,
  (SELECT affected_sessions FROM detect_orphaned_cv_versions()) as sessions_with_orphans,
  (SELECT COUNT(*) FROM resume_targets) as active_targets,
  (SELECT COUNT(*) FROM cv_versions WHERE source = 'target-derived') as target_derived_versions
;
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Read and understand all 3 functions
- [ ] Review SCHEMA_REVIEW.md Priority 2 section
- [ ] Verify database backups exist
- [ ] Plan for cron scheduling (if using cleanup)

### During Deployment
- [ ] Apply migration: `20260331_priority_2_operational_improvements.sql`
- [ ] Verify functions created: `\df` in psql
- [ ] Run quick sanity test on each function

### Post-Deployment
- [ ] Test `delete_user_cascade()` on non-production user
- [ ] Schedule `cleanup_old_processed_events()` (weekly or daily)
- [ ] Set up quarterly `detect_orphaned_cv_versions()` monitoring
- [ ] Document cron job in runbooks

### Monitoring
- [ ] Track `cleanup_old_processed_events()` deleted_count
- [ ] Review `detect_orphaned_cv_versions()` monthly
- [ ] Alert if cleanup deleted_count = 0 or > expected

---

## Quick Reference

| Function | Purpose | Frequency | Impact |
|----------|---------|-----------|--------|
| `delete_user_cascade()` | Safe user deletion | On-demand | High (deletes all user data) |
| `cleanup_old_processed_events(30)` | Remove old webhook logs | Daily/Weekly | Low (cleanup only) |
| `detect_orphaned_cv_versions()` | Monitor orphans | Quarterly | None (read-only) |

---

## References
- SCHEMA_REVIEW.md - Full database architecture review
- CLAUDE.md - System architecture and invariants
- docs/billing-implementation.md - Billing data flow
