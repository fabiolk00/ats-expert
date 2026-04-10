---
phase: 01-contract-alignment-and-fail-fast-guards
plan: "03"
subsystem: infra
tags: [docs, runbooks, staging, billing, migrations, verification, ops]
requires:
  - phase: 01-01
    provides: Canonical env templates and operator setup contract
  - phase: 01-02
    provides: Hardened runtime env guard behavior and exact required secrets
provides:
  - Production checklist aligned to the current settlement billing contract
  - Staging setup and validation docs synchronized with the committed staging template
  - Explicit repo-local and live-staging proof commands for operators
affects: [phase-verification, phase-2, phase-3, launch-readiness]
tech-stack:
  added: []
  patterns:
    - Template-first staging setup with a single preflight script
    - Proof-set sections that separate repo-local checks from live staging checks
key-files:
  created: []
  modified:
    - docs/PRODUCTION-READINESS-CHECKLIST.md
    - docs/staging/SETUP_GUIDE.md
    - docs/staging/VALIDATION_PLAN.md
    - scripts/verify-staging.sh
    - scripts/README.md
key-decisions:
  - "Treat `.env.staging.example` plus `bash scripts/verify-staging.sh` as the single operator entry point for staging preflight."
  - "Document the proof commands explicitly instead of leaving operators to infer them from planning files."
patterns-established:
  - "Production and staging runbooks must name the exact migration files and internal billing event names."
  - "Operator docs should expose copy-pastable proof commands under explicit repo-local and live-staging labels."
requirements-completed: [OPS-03]
duration: 6 min
completed: 2026-04-10
---

# Phase 1 Plan 3: Staging and Production Runbook Summary

**Production and staging operators now have one synchronized runbook flow for the hardened billing contract and its proof commands.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-10T03:34:42Z
- **Completed:** 2026-04-10T03:41:10Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Rewrote the production readiness checklist around the live settlement migrations and internal event names.
- Replaced the staging setup flow with a template-first, preflight-first operator path centered on `.env.staging.example` and `bash scripts/verify-staging.sh`.
- Added explicit `Repo-local proof` and `Live staging proof` sections so operators can see the exact Phase 1 validation commands without reading planning docs.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refresh the production readiness checklist to the live settlement contract** - `c347279` (`docs`)
2. **Task 2: Align staging setup docs and the verification script around one operator flow** - `1c979dd` (`docs`)
3. **Task 3: Make the Phase 1 proof set explicit in operator-facing docs** - `0f8aa4e` (`docs`)

## Files Created/Modified

- `docs/PRODUCTION-READINESS-CHECKLIST.md` - Production rollout checklist now names the exact migrations, internal billing event names, and proof commands.
- `docs/staging/SETUP_GUIDE.md` - Staging setup now starts from `.env.staging.example` and points operators to the preflight script before any scenario work.
- `docs/staging/VALIDATION_PLAN.md` - Billing scenarios now share the same migration list, template assumptions, and proof commands as the rest of the runbooks.
- `scripts/verify-staging.sh` - Preflight script now expects both Asaas sandbox credentials and points failures back to the committed template and migration guidance.
- `scripts/README.md` - Script catalog now exposes the Phase 1 proof commands directly.

## Decisions Made

- Use `.env.staging.example` as the single documented starting point for staging setup.
- Separate repo-local proof from live staging proof in the docs so operators know which commands require real infrastructure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A local `bash` binary was not available in this Windows environment, so `verify-staging.sh` was validated through the plan's required grep checks and a plain shell review rather than an actual `bash -n` syntax run.

## User Setup Required

None - no additional setup file was required beyond the existing `01-USER-SETUP.md` created in Plan 1.

## Next Phase Readiness

- Phase 1 is ready for phase-level verification because code, tests, and operator docs now point at the same contract.
- Phase 3 billing settlement validation can reuse the staging guide and preflight script directly instead of rebuilding its operator steps.

---
*Phase: 01-contract-alignment-and-fail-fast-guards*
*Completed: 2026-04-10*
