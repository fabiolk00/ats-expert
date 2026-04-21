# 60-01 Summary

Phase 60 narrowed the pending resume-generation persistence hotspot identified after Phase 59.

## What Changed

- `createPendingResumeGeneration(...)` now throws a dedicated persistence error that preserves:
  - branch (`create` vs `reuse`)
  - DB code/details/hint
  - underlying cause
- The billable flow now logs raw pending-generation persistence failures with:
  - `latestVersionId`
  - `sourceScope`
  - `generationIntentKey`
  - branch and DB diagnostics
- The billable flow now emits narrower pending-generation failure codes:
  - `GENERATE_RESUME_PENDING_GENERATION_REUSE_FAILED`
  - `GENERATE_RESUME_PENDING_GENERATION_CREATE_FAILED`
  - `GENERATE_RESUME_PENDING_GENERATION_CONSTRAINT_FAILED`
- Regression tests now cover create failure, reuse failure, helper-level reuse fallback failure, and top-level tool-log propagation.

## Outcome

The pending-generation hotspot no longer collapses into one broad persistence failure. The next live recurrence should make it immediately clear whether the failure came from create or reuse, and whether a DB constraint is involved.
