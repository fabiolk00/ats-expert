# Phase 91 Verification

## Result

Passed locally.

## Checks

- `npx vitest run "src/lib/ats/scoring/observability.test.ts"`
- `npx vitest run "src/lib/agent/tools/pipeline.test.ts"`
- `npm run typecheck`

## Acceptance

- `validation_recovered` now emits at `info` in all cases.
- `summary_clarity_outcome` emits at `warn` only when `summaryRepairThenClarityFail === true`.
- `summary_clarity_outcome` stays at `info` for healthy and non-problematic paths.
- No payload fields changed.
- No pipeline behavior, gate logic, scoring policy, or UI behavior changed.
