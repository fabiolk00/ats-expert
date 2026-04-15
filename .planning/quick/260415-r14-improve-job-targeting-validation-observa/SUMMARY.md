# Quick Task 260415-r14 Summary

## What changed

- `src/lib/agent/job-targeting-pipeline.ts` now records exact validation issue messages and sections in the `agent.job_targeting.validation_failed` log, and stores the first issue in `lastFailureReason`.
- `src/lib/agent/tools/build-targeting-plan.ts` now rejects weak explicit roles like `BI.` and falls back to richer role text when available.
- Added focused regression coverage in:
  - `src/lib/agent/tools/build-targeting-plan.test.ts`
  - `src/lib/agent/tools/pipeline.test.ts`

## Verification

- `npm test -- src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/pipeline.test.ts src/lib/agent/tools/validate-rewrite.test.ts`
