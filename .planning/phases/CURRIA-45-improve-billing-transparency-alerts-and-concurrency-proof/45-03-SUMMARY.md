---
phase: CURRIA-45-improve-billing-transparency-alerts-and-concurrency-proof
plan: "03"
subsystem: payments
tags: [billing, concurrency, vitest, tsx, staging, alerts]
requires:
  - phase: 45-01
    provides: Shared billing anomaly thresholds and summary contract over reservation-backed export billing
provides:
  - Deterministic retry-job proof for nonce-less duplicate export retries
  - Repo-native export stress CLI for authenticated `/api/session/[id]/generate` load and job polling
  - Expanded staging billing snapshots with reservation, ledger, and anomaly evidence
  - Operator docs for export anomaly thresholds and staging validation commands
affects: [phase-45-billing-ops, export-billing-proof, staging-validation]
tech-stack:
  added: []
  patterns: [TDD task commits, deterministic retry idempotency, repo-native staging diagnostics]
key-files:
  created: [scripts/stress-export-generation.ts, scripts/stress-export-generation.test.ts]
  modified: [src/app/api/session/[id]/generate/route.ts, src/app/api/session/[id]/generate/route.test.ts, src/lib/db/credit-reservations.test.ts, src/lib/resume-generation/generate-billable-resume.test.ts, src/lib/asaas/reconciliation.test.ts, scripts/check-staging-billing-state.ts, docs/billing/MONITORING.md, docs/billing/OPS_RUNBOOK.md, docs/staging/VALIDATION_PLAN.md]
key-decisions:
  - "Nonce-less export retries now derive retry job idempotency from the failed durable job so duplicate retries collapse onto one retry path."
  - "The export stress harness treats 200/202 and 409 BILLING_RECONCILIATION_PENDING as safe outcomes, then polls `/api/jobs/[jobId]` to detect anomalous terminal states."
  - "The staging billing snapshot helper now lazy-loads server-only billing modules so `--help` and Node CLI usage stay usable outside Next.js server execution."
patterns-established:
  - "Export concurrency proof: add race-oriented repository/runtime/route tests before changing retry behavior."
  - "Staging diagnostics: pair generate-route stress artifacts with session-scoped billing snapshots and shared anomaly summaries."
requirements-completed: [BILL-ALERT-01, BILL-CONC-01]
duration: 17min
completed: 2026-04-20
---

# Phase 45 Plan 03: Improve billing transparency alerts and concurrency proof Summary

**Deterministic export retry proof, a repo-native staging stress harness, and reservation-backed anomaly snapshots for billing operators**

## Performance

- **Duration:** 17 min
- **Started:** 2026-04-20T13:35:00Z
- **Completed:** 2026-04-20T13:52:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added race-oriented billing tests that prove concurrent reserve attempts, retry reuse, and repeated reconciliation inspection stay safe.
- Fixed nonce-less duplicate export retries to reuse one durable retry job instead of forking with random retry keys.
- Shipped `scripts/stress-export-generation.ts`, expanded `scripts/check-staging-billing-state.ts`, and documented exact export anomaly thresholds plus staging commands.

## Task Commits

1. **Task 1: Add automated concurrency and retry-safety proof for reservation and reconciliation flows** - `93589f1` (test)
2. **Task 1: Add automated concurrency and retry-safety proof for reservation and reconciliation flows** - `75b2c66` (fix)
3. **Task 2: Add repo-native anomaly hooks, staging snapshots, and export stress proof** - `d9c4cba` (test)
4. **Task 2: Add repo-native anomaly hooks, staging snapshots, and export stress proof** - `8343e5e` (feat)

## Files Created/Modified

- `src/app/api/session/[id]/generate/route.ts` - makes retry idempotency deterministic from the failed durable job.
- `src/app/api/session/[id]/generate/route.test.ts` - proves duplicate nonce-less retries collapse onto the same retry job.
- `src/lib/db/credit-reservations.test.ts` - proves simultaneous reserve attempts collapse into one hold.
- `src/lib/resume-generation/generate-billable-resume.test.ts` - proves resumed pending generations reuse the same billing intent.
- `src/lib/asaas/reconciliation.test.ts` - proves repeated reconciliation inspection remains idempotent.
- `scripts/stress-export-generation.ts` - runs authenticated export stress traffic, polls durable jobs, and exits non-zero on anomalous runs.
- `scripts/stress-export-generation.test.ts` - covers CLI parsing, summaries, and anomalous exit behavior.
- `scripts/check-staging-billing-state.ts` - adds reservation, ledger, anomaly, and session-filter evidence to staging snapshots.
- `docs/billing/MONITORING.md` - documents export-specific thresholds and repo-native alert commands.
- `docs/billing/OPS_RUNBOOK.md` - adds export stress and snapshot commands to the operator recovery path.
- `docs/staging/VALIDATION_PLAN.md` - defines the staging concurrency-proof scenario and expected outcomes.

## Decisions Made

- Used the failed durable job id as retry-key input so duplicate retries stay safe without changing the route contract.
- Kept staging proof repo-native with `tsx` CLIs and `/api/jobs/[jobId]` polling instead of introducing a new load tool.
- Kept `check-staging-billing-state.ts` as the operator evidence source and extended it rather than creating a second export-only snapshot script.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made the staging snapshot helper Node-safe outside Next server runtime**
- **Found during:** Task 2 (Add repo-native anomaly hooks, staging snapshots, and export stress proof)
- **Issue:** `npx tsx scripts/check-staging-billing-state.ts --help` failed because top-level imports pulled `server-only` modules before any CLI logic ran.
- **Fix:** Moved Supabase-admin and anomaly-summary imports behind async loaders, preserving the same runtime behavior while unblocking help and local CLI execution.
- **Files modified:** `scripts/check-staging-billing-state.ts`
- **Verification:** `npx tsx scripts/check-staging-billing-state.ts --help`
- **Committed in:** `8343e5e`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for the documented CLI proof path to work locally. No scope creep.

## Issues Encountered

- Live staging stress execution was not run because the required staging credentials and authenticated session cookie/E2E secret were not available in this workspace. The plan landed the documented proof path and local verification instead.

## User Setup Required

- Staging-only proof still requires real environment access:
  - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` or `STAGING_DB_URL`
  - an authenticated cookie or local `--e2e-secret`
- Use the committed commands in `docs/staging/VALIDATION_PLAN.md` and `docs/billing/OPS_RUNBOOK.md`.

## Next Phase Readiness

- Operators now have committed commands to stress export generation, inspect billing anomalies, and capture reservation/ledger evidence without new infrastructure.
- Phase 45 is ready for staging verification with real credentials and for milestone closeout once that proof is captured.

## Deviations from Threat Model

None.

## Self-Check

PASSED

---
*Phase: CURRIA-45-improve-billing-transparency-alerts-and-concurrency-proof*
*Completed: 2026-04-20*
