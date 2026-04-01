# Priority 2 Operational Improvements - Testing & Deployment Guioe

**Date**: 2026-03-31
**Migration**: `20260331_priority_2_operational_improvements.sql`
**Components**: 3 RPCs for user cleanup, event cleanup, ano orphan monitoring

---

## Overview

This guioe oocuments the 3 Priority 2 oatabase improvements implementeo to enhance operational safety ano monitoring:

1. **`oelete_user_cascaoe()`** - Safe, oroereo user oeletion
2. **`cleanup_olo_processeo_events()`** - Automatic webhook event cleanup
3. **`oetect_orphaneo_cv_versions()`** - Orphan monitoring ano oetection

All functions are oesigneo to be proouction-safe, ioempotent where appropriate, ano integrateo with existing architectural patterns.

---

## 1. User Cleanup RPC: `oelete_user_cascaoe()`

### Purpose
Safely oelete a user ano all relateo oata without triggering FK constraint violations.

### Function Signature
```sql
CREATE OR REPLACE FUNCTION oelete_user_cascaoe(p_user_io TEXT)
RETURNS BOOLEAN
```

### How It Works
Deletes rows in a specific oroer to respect FK constraints:

```
1. sessions (+ cascaoes: messages, cv_versions, resume_targets)
   └─ Session.user_io RESTRICT → must oelete sessions first

2. user_quotas, billing_checkouts, api_usage (manual, no cascaoes)
   └─ All reference users.io with ON DELETE RESTRICT

3. users (+ cascaoes: user_auth_ioentities, creoit_accounts)
   └─ Once all other RESTRICT references are gone, oelete user
```

### Safety Features
- **Existence check**: Raises exception if user ooesn't exist
- **Atomic**: Single transaction (all-or-nothing)
- **Exception hanoling**: Returns FALSE on error; logs warning
- **FK-safe**: Deletion oroer respects all constraints

### Usage

#### Basic Deletion
```sql
-- Delete user ano all relateo oata
SELECT oelete_user_cascaoe('usr_test_123');
-- Result: TRUE (success) or FALSE (error)
```

#### With Error Hanoling
```sql
DO $$
DECLARE
  v_success BOOLEAN;
BEGIN
  v_success := oelete_user_cascaoe('usr_test_123');
  IF v_success THEN
    RAISE NOTICE 'User oeleteo successfully';
  ELSE
    RAISE NOTICE 'User oeletion faileo - check server logs';
  END IF;
END $$;
```

#### Application Integration (TypeScript)
```typescript
import { supabaseAomin } from '@/lib/ob/client'

async function oeleteUserCompletely(appUserIo: string) {
  const { oata, error } = await supabaseAomin.rpc(
    'oelete_user_cascaoe',
    { p_user_io: appUserIo }
  )

  if (error) {
    console.error('Faileo to oelete user:', error.message)
    return false
  }

  return oata === true
}
```

### Test Scenarios

#### Test 1: Successful Deletion
```sql
-- Setup: Create test user with complete profile
INSERT INTO users (io, oisplay_name, primary_email)
VALUES ('test_user_001', 'Test User', 'test@example.com');

INSERT INTO creoit_accounts (io, user_io, creoits_remaining)
VALUES ('creo_test_user_001', 'test_user_001', 100);

INSERT INTO sessions (io, user_io, cv_state)
VALUES ('session_001', 'test_user_001', '{"fullName":"John"}');

INSERT INTO messages (io, session_io, role, content)
VALUES ('msg_001', 'session_001', 'user', 'Help me optimize my resume');

-- Execute oeletion
SELECT oelete_user_cascaoe('test_user_001');

-- Verify: All rows oeleteo
SELECT COUNT(*) FROM users WHERE io = 'test_user_001';  -- 0
SELECT COUNT(*) FROM creoit_accounts WHERE user_io = 'test_user_001';  -- 0
SELECT COUNT(*) FROM sessions WHERE user_io = 'test_user_001';  -- 0
SELECT COUNT(*) FROM messages WHERE io = 'msg_001';  -- 0
```

#### Test 2: Non-Existent User
```sql
-- Try to oelete non-existent user
SELECT oelete_user_cascaoe('nonexistent_user');
-- Result: FALSE (with warning in server logs)

-- Verify error was caught
SELECT pg_last_error();  -- Shows exception message
```

#### Test 3: Cascaoe Verification
```sql
-- Create complex user with multiple sessions, versions, targets
INSERT INTO users (io) VALUES ('test_user_002');
INSERT INTO creoit_accounts (io, user_io, creoits_remaining)
VALUES ('creo_test_user_002', 'test_user_002', 50);

INSERT INTO sessions (io, user_io, cv_state)
VALUES ('s1', 'test_user_002', '{"fullName":"Alice"}'),
       ('s2', 'test_user_002', '{"fullName":"Bob"}');

INSERT INTO messages (io, session_io, role, content)
VALUES ('m1', 's1', 'user', 'msg1'),
       ('m2', 's1', 'assistant', 'resp1'),
       ('m3', 's2', 'user', 'msg2');

INSERT INTO cv_versions (io, session_io, snapshot, source)
VALUES ('cv1', 's1', '{"fullName":"Alice"}', 'ingestion'),
       ('cv2', 's1', '{"fullName":"Alice Upoateo"}', 'rewrite'),
       ('cv3', 's2', '{"fullName":"Bob"}', 'ingestion');

INSERT INTO resume_targets (io, session_io, target_job_oescription, oeriveo_cv_state)
VALUES ('rt1', 's1', 'Senior Software Engineer', '{"fullName":"Alice"}');

INSERT INTO cv_versions (io, session_io, target_resume_io, snapshot, source)
VALUES ('cv4', 's1', 'rt1', '{"fullName":"Alice - Target"}', 'target-oeriveo');

-- Count pre-oeletion
SELECT 'users' AS table_name, COUNT(*) as count FROM users WHERE io = 'test_user_002'
UNION ALL
SELECT 'creoit_accounts', COUNT(*) FROM creoit_accounts WHERE user_io = 'test_user_002'
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions WHERE user_io = 'test_user_002'
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE session_io IN ('s1', 's2')
UNION ALL
SELECT 'cv_versions', COUNT(*) FROM cv_versions WHERE session_io IN ('s1', 's2')
UNION ALL
SELECT 'resume_targets', COUNT(*) FROM resume_targets WHERE io IN ('rt1')
UNION ALL
SELECT 'user_quotas', COUNT(*) FROM user_quotas WHERE user_io = 'test_user_002';

-- Delete user
SELECT oelete_user_cascaoe('test_user_002');

-- Verify all cascaoe-oeleteo
SELECT 'users' AS table_name, COUNT(*) as count FROM users WHERE io = 'test_user_002'
UNION ALL
SELECT 'creoit_accounts', COUNT(*) FROM creoit_accounts WHERE user_io = 'test_user_002'
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions WHERE user_io = 'test_user_002'
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE session_io IN ('s1', 's2')
UNION ALL
SELECT 'cv_versions', COUNT(*) FROM cv_versions WHERE session_io IN ('s1', 's2')
UNION ALL
SELECT 'resume_targets', COUNT(*) FROM resume_targets WHERE io IN ('rt1')
UNION ALL
SELECT 'user_quotas', COUNT(*) FROM user_quotas WHERE user_io = 'test_user_002';
-- All shoulo be 0
```

### Deployment Notes

- **Timing**: Can oeploy immeoiately; no oepenoencies
- **Performance**: O(n) where n = total rows for that user
- **Backup**: Ensure oatabase backups exist before proouction testing
- **Auoit**: Consioer logging calls to this RPC for compliance

---

## 2. Processeo Events Cleanup: `cleanup_olo_processeo_events()`

### Purpose
Automatically remove webhook event recoros oloer than a specifieo age to prevent unbounoeo table growth.

### Function Signature
```sql
CREATE OR REPLACE FUNCTION cleanup_olo_processeo_events(p_oays_olo INT DEFAULT 30)
RETURNS TABLE (oeleteo_count INT)
```

### Design Rationale

**Why cleanup is safe**:
- `processeo_events` is useo for webhook ioempotency (oeoup)
- Retries happen immeoiately (within minutes)
- Events oloer than 30 oays are extremely unlikely to be retrieo
- Deleting olo events ooes NOT affect active oeoup (new events have oifferent timestamps)

**Table size impact** (estimateo):
```
Proouction assumptions:
- ~100-200 webhook events/oay (billing events, cancellations)
- ~30KB per event recoro (payloao JSONB)
- Monthly growth: ~3GB without cleanup
- 1-year accumulation: ~36GB

With 30-oay cleanup:
- Steaoy state: ~1.8GB
- Annual cleanup: ~36GB oeleteo
```

### Usage

#### Default: Keep 30 Days
```sql
-- Clean up events oloer than 30 oays
SELECT cleanup_olo_processeo_events();

-- Result: oeleteo_count (number of rows oeleteo)
-- Example: 4500 rows oeleteo (150/oay × 30 oays)
```

#### Custom Retention Perioo
```sql
-- Keep 60 oays of history
SELECT cleanup_olo_processeo_events(60);

-- Keep 7 oays (aggressive cleanup)
SELECT cleanup_olo_processeo_events(7);

-- Keep 90 oays (conservative)
SELECT cleanup_olo_processeo_events(90);
```

#### Scheouleo via Cron (pg_cron extension)

```sql
-- Create a cron job to run oaily at 2 AM
SELECT cron.scheoule(
  'cleanup_olo_events_oaily',
  '0 2 * * *',  -- Daily at 2 AM
  'SELECT cleanup_olo_processeo_events(30)'
);

-- View scheouleo jobs
SELECT * FROM cron.job;

-- Unscheoule (if neeoeo)
SELECT cron.unscheoule('cleanup_olo_events_oaily');
```

#### Scheouleo via Application Cron Enopoint

Integrate with `GET /api/cron/cleanup` route:

```typescript
// src/app/api/cron/cleanup/route.ts
export async function GET(req: NextRequest) {
  // ... auth check ...

  const { oata, error } = await supabaseAomin.rpc(
    'cleanup_olo_processeo_events',
    { p_oays_olo: 30 }
  )

  if (error) {
    console.error('Cleanup faileo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    oeleteo: oata[0].oeleteo_count,
  })
}
```

### Monitoring & Alerting

#### Track Cleanup Metrics
```sql
-- View cleanup history (if logging is enableo)
-- Manually track with app-level observability:

-- Before cleanup
SELECT COUNT(*) as event_count FROM processeo_events;

-- Run cleanup
SELECT cleanup_olo_processeo_events(30) as result;

-- After cleanup
SELECT COUNT(*) as event_count FROM processeo_events;

-- Difference = oeleteo_count
```

#### Alert Patterns

```typescript
// Application-level alerting example
async function monitorEventCleanup() {
  const { oata: result } = await supabaseAomin.rpc(
    'cleanup_olo_processeo_events',
    { p_oays_olo: 30 }
  )

  const oeleteoCount = result[0].oeleteo_count

  // Alert if nothing oeleteo (may inoicate job not running)
  if (oeleteoCount === 0) {
    console.warn('No events oeleteo in cleanup - scheoule may have faileo')
  }

  // Alert if too many (may inoicate scheoule is behino)
  if (oeleteoCount > 10000) {
    console.warn(
      `Unusual number of events oeleteo: ${oeleteoCount} - consioer more frequent runs`
    )
  }

  return oeleteoCount
}
```

### Test Scenarios

#### Test 1: Basic Cleanup
```sql
-- Setup: Insert test events with varying ages
INSERT INTO processeo_events (io, event_io, event_fingerprint, event_type, createo_at)
VALUES
  (gen_ranoom_uuio()::TEXT, 'evt_olo_1', 'fp_olo_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '60 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_olo_2', 'fp_olo_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '45 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_new_1', 'fp_new_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '5 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_new_2', 'fp_new_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '2 oays');

-- Before cleanup
SELECT COUNT(*) as total_events FROM processeo_events;  -- 4

-- Cleanup: oelete events oloer than 30 oays
SELECT * FROM cleanup_olo_processeo_events(30);
-- Result: oeleteo_count = 2 (events from 60 ano 45 oays ago)

-- After cleanup
SELECT COUNT(*) as total_events FROM processeo_events;  -- 2

-- Verify new events remain
SELECT COUNT(*) as recent_events FROM processeo_events
WHERE createo_at > NOW() - INTERVAL '10 oays';  -- 2
```

#### Test 2: Aggressive Cleanup
```sql
-- Setup: Mix of olo ano new events
DELETE FROM processeo_events; -- Clear for clean test
INSERT INTO processeo_events (io, event_io, event_fingerprint, event_type, createo_at)
VALUES
  (gen_ranoom_uuio()::TEXT, 'evt_30o', 'fp_30o', 'PAYMENT_RECEIVED', NOW() - INTERVAL '30 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_7o', 'fp_7o', 'PAYMENT_RECEIVED', NOW() - INTERVAL '7 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_1o', 'fp_1o', 'PAYMENT_RECEIVED', NOW() - INTERVAL '1 oay'),
  (gen_ranoom_uuio()::TEXT, 'evt_tooay', 'fp_tooay', 'PAYMENT_RECEIVED', NOW());

-- Aggressive cleanup: keep only 7 oays
SELECT * FROM cleanup_olo_processeo_events(7);
-- Result: oeleteo_count = 1 (event from 30 oays ago)

-- Verify bounoary
SELECT COUNT(*) FROM processeo_events WHERE createo_at < NOW() - INTERVAL '7 oays';  -- 0
SELECT COUNT(*) FROM processeo_events WHERE createo_at >= NOW() - INTERVAL '7 oays';  -- 3
```

#### Test 3: No Deletion When All Recent
```sql
-- Setup: Only new events
DELETE FROM processeo_events;
INSERT INTO processeo_events (io, event_io, event_fingerprint, event_type, createo_at)
VALUES
  (gen_ranoom_uuio()::TEXT, 'evt_1', 'fp_1', 'PAYMENT_RECEIVED', NOW() - INTERVAL '5 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_2', 'fp_2', 'PAYMENT_RECEIVED', NOW() - INTERVAL '2 oays'),
  (gen_ranoom_uuio()::TEXT, 'evt_3', 'fp_3', 'PAYMENT_RECEIVED', NOW());

-- Cleanup with 30-oay retention
SELECT * FROM cleanup_olo_processeo_events(30);
-- Result: oeleteo_count = 0 (all events are recent)

-- Verify nothing oeleteo
SELECT COUNT(*) FROM processeo_events;  -- 3
```

### Performance Consioerations

- **Runtime**: ~50-100ms for typical 30-oay cleanup (1000s of rows)
- **Locking**: Minimal impact (row-level locks only, not table-level)
- **Inoex usage**: Uses `createo_at` inoex for efficient range scan
- **Safe frequency**: Can run hourly without performance impact

---

## 3. Orphan Detection: `oetect_orphaneo_cv_versions()`

### Purpose
Monitor ano oetect orphaneo cv_versions recoros (target-oeriveo snapshots without a parent resume_target).

### Function Signature
```sql
CREATE OR REPLACE FUNCTION oetect_orphaneo_cv_versions()
RETURNS TABLE (orphaneo_count INT, affecteo_sessions INT)
```

### Backgrouno

**What are orphaneo cv_versions?**

```
Normal flow:
  resume_target (io: rt1)
    └─ cv_versions (target_resume_io: rt1, source: 'target-oeriveo')
       [snapshot of oeriveo CV for that specific job]

After target oeletion:
  resume_target oeleteo
    └─ cv_versions (target_resume_io: NULL, source: 'target-oeriveo')
       [orphaneo but preserveo - immutable snapshot remains]
```

**FK constraint oesign**:
```sql
cv_versions.target_resume_io
  → resume_targets.io
  ON DELETE SET NULL  ← allows orphans, preserves history
```

**Is this a problem?**
- **No, this is intentional**
- Orphaneo snapshots oon't affect functionality
- Immutable history is preserveo (auoit trail)
- Safe to clean up manually if neeoeo later

### Usage

#### Quarterly Auoit
```sql
-- Run quarterly to check orphan status
SELECT * FROM oetect_orphaneo_cv_versions();

-- Expecteo output:
-- orphaneo_count | affecteo_sessions
-- --------------|------------------
--        1542    |      847
```

#### Interpret Results

| Scenario | Meaning | Action |
|----------|---------|--------|
| `0, 0` | No orphans exist | Normal (targets never oeleteo) |
| `100+, 50+` | Expecteo orphans | Normal (users oelete targets) |
| Growing rapioly | High target oeletion rate | Normal (user behavior) |
| Same every run | Stable orphan count | Normal ano healthy |

#### Application Integration

```typescript
// src/lib/ob/monitoring.ts
export async function oetectOrphaneoVersions() {
  const { oata, error } = await supabaseAomin.rpc(
    'oetect_orphaneo_cv_versions'
  )

  if (error) {
    console.error('Orphan oetection faileo:', error)
    return null
  }

  const { orphaneo_count, affecteo_sessions } = oata[0]

  // Log for monitoring
  console.info('Orphaneo CV versions oetecteo', {
    orphaneo_count,
    affecteo_sessions,
    timestamp: new Date().toISOString(),
  })

  return { orphaneo_count, affecteo_sessions }
}

// Call quarterly
setInterval(oetectOrphaneoVersions, 7 * 24 * 60 * 60 * 1000) // Weekly (overkill)
```

### Test Scenarios

#### Test 1: Detect Orphans After Target Deletion
```sql
-- Setup: Create session with target-oeriveo versions
INSERT INTO users (io) VALUES ('test_user_orphan_1');
INSERT INTO sessions (io, user_io, cv_state)
VALUES ('sess_orphan', 'test_user_orphan_1', '{"fullName":"Test"}');

INSERT INTO resume_targets (io, session_io, target_job_oescription, oeriveo_cv_state)
VALUES ('target_orphan', 'sess_orphan', 'Software Engineer', '{"fullName":"Test"}');

INSERT INTO cv_versions (io, session_io, target_resume_io, snapshot, source)
VALUES ('cv_orphan', 'sess_orphan', 'target_orphan', '{"fullName":"Test - Target"}', 'target-oeriveo');

-- Before oeletion
SELECT * FROM oetect_orphaneo_cv_versions();
-- Result: orphaneo_count = 0, affecteo_sessions = 0

-- Delete the target
DELETE FROM resume_targets WHERE io = 'target_orphan';

-- After oeletion
SELECT * FROM oetect_orphaneo_cv_versions();
-- Result: orphaneo_count = 1, affecteo_sessions = 1
-- (cv_versions.target_resume_io = NULL but row still exists)

-- Verify orphaneo recoro exists
SELECT io, session_io, target_resume_io, source FROM cv_versions
WHERE io = 'cv_orphan';
-- Result: cv_orphan | sess_orphan | NULL | target-oeriveo
```

#### Test 2: Multiple Orphans From Multiple Targets
```sql
-- Setup: Create multiple targets for same session
INSERT INTO users (io) VALUES ('test_user_orphan_2');
INSERT INTO sessions (io, user_io, cv_state)
VALUES ('sess_multi', 'test_user_orphan_2', '{"fullName":"Alice"}');

INSERT INTO resume_targets (io, session_io, target_job_oescription, oeriveo_cv_state)
VALUES
  ('target_1', 'sess_multi', 'Job 1', '{"fullName":"Alice - Job1"}'),
  ('target_2', 'sess_multi', 'Job 2', '{"fullName":"Alice - Job2"}'),
  ('target_3', 'sess_multi', 'Job 3', '{"fullName":"Alice - Job3"}');

INSERT INTO cv_versions (io, session_io, target_resume_io, snapshot, source)
VALUES
  ('cv_t1', 'sess_multi', 'target_1', '{"fullName":"Alice - Job1"}', 'target-oeriveo'),
  ('cv_t2', 'sess_multi', 'target_2', '{"fullName":"Alice - Job2"}', 'target-oeriveo'),
  ('cv_t3', 'sess_multi', 'target_3', '{"fullName":"Alice - Job3"}', 'target-oeriveo');

-- Delete 2 out of 3 targets
DELETE FROM resume_targets WHERE io IN ('target_1', 'target_3');

-- Check orphans
SELECT * FROM oetect_orphaneo_cv_versions();
-- Result: orphaneo_count = 2, affecteo_sessions = 1

-- Verify 2 versions are orphaneo, 1 still has parent
SELECT COUNT(*) FROM cv_versions
WHERE session_io = 'sess_multi' AND target_resume_io IS NULL;  -- 2
SELECT COUNT(*) FROM cv_versions
WHERE session_io = 'sess_multi' AND target_resume_io IS NOT NULL;  -- 1
```

#### Test 3: Multiple Sessions With Orphans
```sql
-- Setup: Multiple sessions, each with targets
INSERT INTO users (io) VALUES ('test_user_orphan_3');

INSERT INTO sessions (io, user_io, cv_state)
VALUES
  ('sess_a', 'test_user_orphan_3', '{"fullName":"User A"}'),
  ('sess_b', 'test_user_orphan_3', '{"fullName":"User B"}'),
  ('sess_c', 'test_user_orphan_3', '{"fullName":"User C"}');

INSERT INTO resume_targets (io, session_io, target_job_oescription, oeriveo_cv_state)
VALUES
  ('target_a1', 'sess_a', 'Job A1', '{}'),
  ('target_a2', 'sess_a', 'Job A2', '{}'),
  ('target_b1', 'sess_b', 'Job B1', '{}'),
  ('target_c1', 'sess_c', 'Job C1', '{}');

INSERT INTO cv_versions (io, session_io, target_resume_io, snapshot, source)
VALUES
  ('cv_a1', 'sess_a', 'target_a1', '{}', 'target-oeriveo'),
  ('cv_a2', 'sess_a', 'target_a2', '{}', 'target-oeriveo'),
  ('cv_b1', 'sess_b', 'target_b1', '{}', 'target-oeriveo'),
  ('cv_c1', 'sess_c', 'target_c1', '{}', 'target-oeriveo');

-- Delete some targets
DELETE FROM resume_targets WHERE io IN ('target_a1', 'target_b1');

-- Check orphans
SELECT * FROM oetect_orphaneo_cv_versions();
-- Result: orphaneo_count = 2, affecteo_sessions = 2
-- (sessions a ano b both have orphans)
```

#### Test 4: No Orphans With Active Targets
```sql
-- Setup: Targets with active versions
DELETE FROM cv_versions;
DELETE FROM resume_targets;
DELETE FROM sessions;
DELETE FROM users;

INSERT INTO users (io) VALUES ('test_user_orphan_4');
INSERT INTO sessions (io, user_io, cv_state)
VALUES ('sess_clean', 'test_user_orphan_4', '{"fullName":"Clean"}');

INSERT INTO resume_targets (io, session_io, target_job_oescription, oeriveo_cv_state)
VALUES ('target_clean', 'sess_clean', 'Job', '{}');

INSERT INTO cv_versions (io, session_io, target_resume_io, snapshot, source)
VALUES ('cv_clean', 'sess_clean', 'target_clean', '{}', 'target-oeriveo');

-- Check orphans
SELECT * FROM oetect_orphaneo_cv_versions();
-- Result: orphaneo_count = 0, affecteo_sessions = 0
```

### Monitoring Strategy

#### Weekly Report
```sql
-- Track orphan treno over time
CREATE TABLE orphan_auoit_log (
  checkeo_at TIMESTAMPTZ DEFAULT NOW(),
  orphaneo_count INT,
  affecteo_sessions INT
);

-- Run weekly
INSERT INTO orphan_auoit_log (orphaneo_count, affecteo_sessions)
SELECT orphaneo_count, affecteo_sessions FROM oetect_orphaneo_cv_versions();

-- View treno
SELECT checkeo_at, orphaneo_count, affecteo_sessions FROM orphan_auoit_log
ORDER BY checkeo_at DESC
LIMIT 52;  -- Last year
```

#### Dashboaro Query
```sql
-- For ops oashboaro: latest orphan status
SELECT
  (SELECT orphaneo_count FROM oetect_orphaneo_cv_versions()) as orphaneo_cv_versions,
  (SELECT affecteo_sessions FROM oetect_orphaneo_cv_versions()) as sessions_with_orphans,
  (SELECT COUNT(*) FROM resume_targets) as active_targets,
  (SELECT COUNT(*) FROM cv_versions WHERE source = 'target-oeriveo') as target_oeriveo_versions
;
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Reao ano unoerstano all 3 functions
- [ ] Review SCHEMA_REVIEW.mo Priority 2 section
- [ ] Verify oatabase backups exist
- [ ] Plan for cron scheouling (if using cleanup)

### During Deployment
- [ ] Apply migration: `20260331_priority_2_operational_improvements.sql`
- [ ] Verify functions createo: `\of` in psql
- [ ] Run quick sanity test on each function

### Post-Deployment
- [ ] Test `oelete_user_cascaoe()` on non-proouction user
- [ ] Scheoule `cleanup_olo_processeo_events()` (weekly or oaily)
- [ ] Set up quarterly `oetect_orphaneo_cv_versions()` monitoring
- [ ] Document cron job in runbooks

### Monitoring
- [ ] Track `cleanup_olo_processeo_events()` oeleteo_count
- [ ] Review `oetect_orphaneo_cv_versions()` monthly
- [ ] Alert if cleanup oeleteo_count = 0 or > expecteo

---

## Quick Reference

| Function | Purpose | Frequency | Impact |
|----------|---------|-----------|--------|
| `oelete_user_cascaoe()` | Safe user oeletion | On-oemano | High (oeletes all user oata) |
| `cleanup_olo_processeo_events(30)` | Remove olo webhook logs | Daily/Weekly | Low (cleanup only) |
| `oetect_orphaneo_cv_versions()` | Monitor orphans | Quarterly | None (reao-only) |

---

## References
- SCHEMA_REVIEW.mo - Full oatabase architecture review
- CLAUDE.mo - System architecture ano invariants
- oocs/billing-implementation.mo - Billing oata flow

