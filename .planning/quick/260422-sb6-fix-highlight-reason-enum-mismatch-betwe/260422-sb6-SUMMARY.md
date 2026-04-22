# Quick Task 260422-sb6 - Fix highlight reason enum mismatch between model output and parser contract

## What changed

- Tightened the highlight detector prompt to explicitly restrict `reason` to:
  - `metric_impact`
  - `business_impact`
  - `action_result`
  - `ats_strength`
  - `tool_context`
- Added a small controlled alias normalization map in `src/lib/agent/tools/detect-cv-highlights.ts` for known model outputs:
  - `action_impact` -> `action_result`
  - `optimization_impact` -> `business_impact`
  - `role_and_experience` -> `ats_strength`
  - `measurable_result` -> `metric_impact`
  - `measurable_impact` -> `metric_impact`
- Preserved fail-close behavior for unknown labels and now include the offending `reasonValue` in invalid-payload log details.
- Added regression tests covering alias success, unchanged valid enum values, and unknown-reason rejection.

## Validation

- `npx vitest run src/lib/agent/tools/detect-cv-highlights.test.ts`
- `npm run typecheck`

## Reproduced case

- Session: `a7c863cf-eee7-4b6a-9b12-7e423f59bd71`
- Before: `highlightCount = 0` with `parseFailureReason = invalid_shape_ranges`
- After: `highlightCount = 9`

The reproduced local snapshot no longer collapses to zero highlights because of reason enum mismatch.
