---
phase: 03-billing-settlement-validation
plan: "02"
subsystem: live-settlement-validation
tags: [asaas, billing, staging, live-proof, idempotency]
requires: [03-01]
provides:
  - Auditable live evidence for the full settlement scenario matrix
  - Structured request/response capture for every required billing scenario
  - Explicit pass/fail judgments for BILL-01, BILL-02, and BILL-03
affects: [billing-validation, launch-readiness]
tech-stack:
  added: []
  patterns:
    - Live webhook replay against the approved production endpoint with explicit fixture identifiers
    - Supabase-admin snapshot capture when psql is unavailable on the operator workstation
key-files:
  modified:
    - .planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md
    - .planning/phases/03-billing-settlement-validation/03-SCENARIO-RESPONSES.json
    - .planning/phases/03-billing-settlement-validation/03-STAGING-GAPS.md
key-decisions:
  - "Used a dedicated fixture user and explicit checkout identifiers so every live mutation remained attributable to a single Phase 3 slice."
  - "Validated both short and long v1 externalReference shapes instead of assuming the docs-only contract."
  - "Simulated mid-cycle usage before renewal to prove balance replacement instead of additive crediting."
patterns-established:
  - "Live billing evidence pairs every replay response with a committed post-run snapshot."
  - "Duplicate and reconcile proofs are recorded against the same economic event instead of separate synthetic stand-ins."
requirements-completed: [BILL-01, BILL-02, BILL-03]
duration: 94 min
completed: 2026-04-10
---

# Phase 3 Plan 2: Live Settlement Validation Summary

**Phase 3 now has real end-to-end billing proof, not just local tests. The live matrix passed across one-time settlement, recurring activation and renewal, cancellation, duplicate replay, and partial-success reconciliation.**

## Performance

- **Duration:** 94 min
- **Started:** 2026-04-10T05:31:00Z
- **Completed:** 2026-04-10T06:05:18Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Ran the committed preflight successfully through Git Bash on Windows.
- Switched the database proof path to the committed Supabase-admin fallback because `psql` was unavailable on this workstation.
- Provisioned a dedicated fixture user and three explicit checkout anchors for the live matrix.
- Executed and recorded all seven named settlement scenarios in the phase plan.
- Proved duplicate replay and partial-success reconciliation without double-granting credits.
- Proved that `user_quotas` display totals stayed aligned with `credit_accounts` runtime balances in the validated scenarios.

## Files Created/Modified

- `.planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md` - Narrative run log with scenario-by-scenario commands, responses, and state judgments.
- `.planning/phases/03-billing-settlement-validation/03-SCENARIO-RESPONSES.json` - Structured capture of baseline state plus replay and snapshot artifacts.
- `.planning/phases/03-billing-settlement-validation/03-STAGING-GAPS.md` - Closed the live phase with `No open gaps` and explicit resolved operator/tooling items.

## Decisions Made

- Use a dedicated fixture user `usr_phase320260410a` instead of the illustrative `usr_staging_001` sample id.
- Validate the long v1 `externalReference` shape in the inactive-snapshot scenario and the short v1 shape across the trust-anchor settlement path.
- Simulate a `7 / 7` mid-cycle balance before renewal so the live proof demonstrates replacement to `20 / 20`.

## Verification

- `bash scripts/verify-staging.sh`
- `npx tsx scripts/check-staging-billing-state.ts --healthcheck --preflight-user usr_phase320260410a --env-file .env.staging`
- Full live replay matrix recorded in `03-STAGING-EVIDENCE.md`

## User Setup Required

None for Phase 3 closure. The live matrix is complete and the evidence artifacts are committed.

## Next Phase Readiness

- Phase 3 is ready for closure because all billing requirements are now backed by live proof.
- Phase 4 can focus on observability and launch readiness rather than billing correctness uncertainty.
