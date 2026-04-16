---
phase: 37-freeze-async-execution-contracts-and-durable-job-foundations
plan: "01"
subsystem: database
tags: [prisma, supabase, jobs, async, vitest]

requires: []
provides:
  - shared async execution contracts for chat-vs-durable action routing
  - generic durable jobs schema and Supabase repository helpers
  - source-of-truth helpers for canonical, optimized, and target-derived resume snapshots
  - regression coverage for idempotent dispatch, claim fencing, and status DTO mapping
affects: [api-agent, polling, sse, workers, artifact-generation]

tech-stack:
  added: []
  patterns:
    - DB-backed claim-and-lease job lifecycle with claimed_at fencing
    - canonical JobStatusSnapshot DTO for polling and SSE readers
    - explicit source-of-truth helpers for base, optimized, and target-derived CV snapshots

key-files:
  created:
    - prisma/migrations/20260416_generic_jobs_foundation.sql
    - src/types/jobs.ts
    - src/lib/jobs/source-of-truth.ts
    - src/lib/jobs/repository.ts
    - src/lib/jobs/contracts.test.ts
    - src/lib/jobs/repository.test.ts
    - src/lib/jobs/source-of-truth.test.ts
  modified:
    - prisma/schema.prisma
    - src/types/agent.ts
    - src/lib/agent/tools/index.ts

key-decisions:
  - "Freeze durable job state as string contracts in TypeScript plus SQL check constraints instead of introducing another queue abstraction."
  - "Keep cvState as canonical truth while routing async-capable actions through explicit effective-source helpers."
  - "Return one JobStatusSnapshot DTO from the repository instead of leaking raw jobs rows to later polling and SSE consumers."

patterns-established:
  - "Durable job create paths require a non-empty user-scoped idempotency key and dedupe by (user_id, type, idempotency_key)."
  - "Claim and terminal writes reuse optimistic status transitions plus claimed_at ownership fencing."

requirements-completed: [JOB-01]

duration: 8min
completed: 2026-04-16
---

# Phase 37: Freeze Async Execution Contracts and Durable Job Foundations Summary

**Shared async execution contracts, generic durable jobs persistence, and fenced Supabase job helpers now anchor later worker, polling, and SSE phases.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-16T19:11:00-03:00
- **Completed:** 2026-04-16T19:19:23-03:00
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments
- Added `src/types/jobs.ts` to freeze the shared action, execution-mode, durable-job, ref, and status-read contracts.
- Added `src/lib/jobs/source-of-truth.ts` and routed existing generation/target creation flows through the same effective resume source logic.
- Added the generic `jobs` schema plus `src/lib/jobs/repository.ts` with idempotent create, user-scoped reads, lease reclaim, and fenced terminal writes.
- Added regression coverage for contract shape, source selection, idempotency, user scoping, and claim ownership fencing.

## Task Commits

1. **Task 1: Freeze the shared action, lifecycle, status-read, and source-of-truth contracts** - `cbb286e` (`feat`)
2. **Task 2: Add the generic durable jobs table and repository helpers** - `894a5e7` (`feat`)
3. **Task 3: Apply the committed migration and push the aligned schema before verification** - verified live during execution after `894a5e7` (no code-only commit)
4. **Task 4: Add regression proof for contract shape, claim fencing, and source selection** - `c78fadc` (`test`)

**Plan metadata:** `657978c` (`docs: execution-ready review verdict`)

## Files Created/Modified
- `prisma/schema.prisma` - Added the generic `Job` model, ownership relations, durable indexes, and restored `UserProfile.cvState` mapping to `cv_state`.
- `prisma/migrations/20260416_generic_jobs_foundation.sql` - Created the committed SQL artifact for the `jobs` table and its unique/index/check constraints.
- `src/types/jobs.ts` - Defined shared async execution and durable-job contracts.
- `src/lib/jobs/source-of-truth.ts` - Encoded canonical/effective resume source selection and artifact result refs.
- `src/lib/jobs/repository.ts` - Implemented Supabase-backed durable job create/read/list/claim/complete/fail/cancel/reset helpers.
- `src/lib/jobs/contracts.test.ts`, `src/lib/jobs/repository.test.ts`, `src/lib/jobs/source-of-truth.test.ts` - Added regression proof for the frozen foundation.
- `src/types/agent.ts`, `src/lib/agent/tools/index.ts` - Re-exported the new contracts and aligned existing synchronous flows with the shared source helper.

## Decisions Made

- Used one generic `jobs` table instead of adding a separate queue service so later async work stays aligned with existing serverless-safe Supabase claim patterns.
- Kept durable job rows operational only and pointed artifact result refs at immutable snapshot metadata or `resumeGenerationId`, never signed URLs.
- Preserved current brownfield behavior by reusing the new source-of-truth helper inside existing synchronous generation flows instead of changing external API contracts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored missing Prisma mapping for `UserProfile.cvState`**
- **Found during:** Task 3 (blocking schema alignment)
- **Issue:** `npx prisma db push` tried to add a new required `cvState` column because `prisma/schema.prisma` had drifted and no longer mapped `UserProfile.cvState` to the live `cv_state` column.
- **Fix:** Restored `@map("cv_state")` on `UserProfile.cvState` in `prisma/schema.prisma`.
- **Files modified:** `prisma/schema.prisma`
- **Verification:** `npx prisma db push --skip-generate`
- **Committed in:** `894a5e7` (part of Task 2 foundation commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to complete the blocking live-schema gate and did not expand Phase 37 beyond the planned persistence foundation.

## Issues Encountered

- `npx prisma db push` initially reported an incompatible `user_profiles.cvState` change; investigation showed the drift was in the local Prisma mapping, not in the live database.
- The first successful `npx prisma db push` still exited nonzero because Prisma attempted a local client generate/install step and hit a path issue afterward. Re-running `npx prisma db push --skip-generate` provided the clean schema-alignment proof the phase needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 38 can build on the frozen `AgentActionType`, `JobType`, `JobStatusSnapshot`, and repository/source-of-truth helpers without reopening Phase 37 contracts.
- The live database already has the committed `jobs` table shape and aligns with `schema.prisma`.
- If a later phase needs Prisma client generation in this environment, run it as a separate explicit step rather than relying on `db push` post-generate behavior.

---
*Phase: 37-freeze-async-execution-contracts-and-durable-job-foundations*
*Completed: 2026-04-16*
