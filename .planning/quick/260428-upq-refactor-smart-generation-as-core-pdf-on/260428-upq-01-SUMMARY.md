---
phase: 260428-upq
plan: "01"
subsystem: api-ui-testing
tags: [smart-generation, ats-enhancement, job-targeting, idempotency, start-lock, nextjs, vitest, playwright]

requires:
  - phase: 260428-upq
    provides: "Smart Generation canonical route decision and start-lock refactor plan"
provides:
  - "Workflow-aware Smart Generation start locks for ATS enhancement and job targeting"
  - "Stable start-lock idempotency boundary for artifact dispatch"
  - "Legacy ATS endpoint compatibility wrapper around Smart Generation"
  - "Profile setup callers routed through /api/profile/smart-generation"
affects: [smart-generation, ats-enhancement, job-targeting, profile-setup, artifact-generation]

tech-stack:
  added: []
  patterns:
    - "Use workflow-aware durable start locks before guided Smart Generation session and pipeline starts"
    - "Keep deprecated route handlers as thin compatibility wrappers around canonical routes"

key-files:
  created:
    - ".planning/quick/260428-upq-refactor-smart-generation-as-core-pdf-on/260428-upq-01-SUMMARY.md"
  modified:
    - "src/lib/agent/job-targeting-start-lock.ts"
    - "src/lib/agent/job-targeting-start-lock.test.ts"
    - "src/lib/routes/smart-generation/decision.ts"
    - "src/lib/routes/smart-generation/session-bootstrap.ts"
    - "src/app/api/profile/smart-generation/route.test.ts"
    - "src/app/api/profile/ats-enhancement/route.ts"
    - "src/app/api/profile/ats-enhancement/route.test.ts"
    - "src/components/resume/user-data-page.tsx"
    - "src/components/resume/user-data-page.test.tsx"
    - "tests/e2e/profile-setup.spec.ts"

key-decisions:
  - "Smart Generation is the canonical guided generation start route for ATS enhancement and job targeting."
  - "The legacy /api/profile/ats-enhancement endpoint remains temporarily as a compatibility wrapper only."
  - "Artifact idempotency for ATS and job targeting uses the stable start-lock idempotency key before falling back to session identity."

patterns-established:
  - "Duplicate guided starts return normalized lock status without creating a second session, pipeline, or generation."
  - "Start-lock logs expose ids, statuses, and hashes only, not raw resume or job text."

requirements-completed: []

duration: "21 min measured from first task commit to summary creation"
completed: 2026-04-29
---

# Phase 260428-upq Plan 01: Smart Generation Canonical Route And Start Lock Summary

**Smart Generation now owns guided ATS and job-targeting starts through workflow-aware start locks, with the old ATS route reduced to compatibility only.**

## Performance

- **Duration:** 21 min measured from first task commit to summary creation
- **Started:** 2026-04-29T02:04:24Z
- **Completed:** 2026-04-29T02:25:12Z
- **Tasks:** 3 completed
- **Files modified:** 10 source/test files plus this summary

## Accomplishments

- Generalized `job-targeting-start-lock` into workflow-aware Smart Generation lock helpers while preserving job-targeting compatibility exports and key prefix behavior.
- Routed Smart Generation ATS and job-targeting starts through the durable lock for acquire, running-session mark, completed mark, and failed mark.
- Changed artifact dispatch idempotency to use the stable start-lock idempotency boundary for ATS/job targeting instead of relying only on session id.
- Replaced the old ATS route implementation with a deprecated compatibility wrapper around Smart Generation.
- Switched profile setup ATS and job-targeting submissions to `/api/profile/smart-generation` and added tests that fail if product code calls the old ATS route.

## Task Commits

Each task was committed atomically:

1. **Task 1: Generalize the durable start lock without leaking raw inputs** - `6f7b1cb` (feat)
2. **Task 2: Route both guided workflows through Smart Generation and wrap old ATS** - `7ef5539` (feat)
3. **Task 3: Switch profile setup callers and guard against old ATS route usage** - `73303e9` (feat)

The summary and state update are committed separately from task implementation commits.

## Files Created/Modified

- `src/lib/agent/job-targeting-start-lock.ts` - Adds workflow-aware Smart Generation lock helpers and keeps job-targeting compatibility wrappers.
- `src/lib/agent/job-targeting-start-lock.test.ts` - Covers ATS/job-target fingerprints, compatibility semantics, and raw-input log privacy.
- `src/lib/routes/smart-generation/decision.ts` - Acquires workflow-aware locks and uses the lock idempotency key for artifact dispatch.
- `src/lib/routes/smart-generation/session-bootstrap.ts` - Marks running sessions through workflow-aware locks for both guided modes.
- `src/app/api/profile/smart-generation/route.test.ts` - Covers ATS/job-target duplicate starts, failure marking, credits, and PDF-only response shape.
- `src/app/api/profile/ats-enhancement/route.ts` - Delegates legacy ATS requests to Smart Generation.
- `src/app/api/profile/ats-enhancement/route.test.ts` - Proves wrapper delegation and trust behavior.
- `src/components/resume/user-data-page.tsx` - Posts both guided generation modes to `/api/profile/smart-generation`.
- `src/components/resume/user-data-page.test.tsx` - Verifies ATS profile setup uses Smart Generation and omits target-job payload.
- `tests/e2e/profile-setup.spec.ts` - Routes ATS happy path through Smart Generation and fails if the legacy ATS route is called.

## Decisions Made

- Smart Generation is the single implementation path for guided ATS and job-targeting generation.
- `/api/profile/ats-enhancement` remains as a deprecated compatibility wrapper so external or stale callers do not break during the transition.
- Start-lock logging continues to be hash/id/status-only; raw resume fields, raw CV JSON, and raw target job text are guarded by tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first static guard run used nested PowerShell quoting and failed before executing the actual search because `$null` was stripped. The guard was rerun directly in PowerShell and passed.
- Playwright removed tracked `test-results` artifacts during e2e execution. Those generated side effects were restored from `HEAD`; no plan implementation files were reverted.

## Verification

- `npx vitest run src/lib/agent/job-targeting-start-lock.test.ts` - passed in Task 1.
- `npx vitest run src/app/api/profile/smart-generation/route.test.ts src/app/api/profile/ats-enhancement/route.test.ts src/lib/agent/job-targeting-start-lock.test.ts` - passed in Task 2.
- `npx vitest run src/components/resume/user-data-page.test.tsx` - passed in Task 3.
- `npm run test:e2e -- --project=chromium tests/e2e/profile-setup.spec.ts` - passed in Task 3.
- Plan gate: `npx vitest run src/app/api/profile/smart-generation/route.test.ts src/app/api/profile/ats-enhancement/route.test.ts src/lib/agent/job-targeting-start-lock.test.ts src/components/resume/user-data-page.test.tsx` - 4 files, 59 tests passed.
- Plan gate: `npm run test:e2e -- --project=chromium tests/e2e/profile-setup.spec.ts` - 13 tests passed.
- Plan gate: static `rg` guard for non-test product references to `/api/profile/ats-enhancement` - passed with no matches.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None. The touched network surface is the planned legacy route wrapper and the existing Smart Generation route; no new endpoint, auth path, file access path, or schema boundary was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01 is complete. Follow-up plans can assume `/api/profile/smart-generation` is the canonical guided start path and `/api/profile/ats-enhancement` is compatibility-only.

## Self-Check: PASSED

- Summary file exists at `.planning/quick/260428-upq-refactor-smart-generation-as-core-pdf-on/260428-upq-01-SUMMARY.md`.
- Task commits exist in git history: `6f7b1cb`, `7ef5539`, `73303e9`.

---
*Phase: 260428-upq*
*Completed: 2026-04-29*
