# Phase 90 Validation

## Implementation note

- The new session-level event is emitted from [src/lib/agent/ats-enhancement-pipeline.ts](/c:/CurrIA/src/lib/agent/ats-enhancement-pipeline.ts:544), immediately after the pipeline builds the canonical ATS readiness contract and before it persists or returns the final state.
- There was no single pre-existing helper where summary recovery semantics and final score outcome already converged. The phase therefore uses the latest safe convergence point inside the ATS enhancement pipeline, where local recovery metadata and the final ATS readiness contract are both available at once.
- The payload builder lives in [src/lib/ats/scoring/observability.ts](/c:/CurrIA/src/lib/ats/scoring/observability.ts:71), and the summary-clarity withhold reason is normalized through [src/lib/ats/scoring/quality-gates.ts](/c:/CurrIA/src/lib/ats/scoring/quality-gates.ts:7) so the log stays stable and queryable.

## Queryable fields

The event `agent.ats_enhancement.summary_clarity_outcome` now includes explicit booleans for:

- `summaryValidationRecovered`
- `summaryRecoveryWasSmartRepair`
- `summaryClarityGateFailed`
- `summaryRepairThenClarityFail`
- `withheldForSummaryClarity`
- `estimatedRangeOutcome`
- `usedExactScore`

It also carries final ATS outcome fields already known at emit time:

- `scoreStatus`
- `confidence`
- `contractVersion`
- `evaluationStage`
- serialized `withholdReasons`

## Healthy vs problematic sessions

- Healthy comparison path:
  - `summaryValidationRecovered = false`
  - `summaryClarityGateFailed = false`
  - `summaryRepairThenClarityFail = false`
- Problematic smart-repair path:
  - `summaryValidationRecovered = true`
  - `summaryRecoveryWasSmartRepair = true`
  - `summaryClarityGateFailed = true`
  - `summaryRepairThenClarityFail = true`
  - often paired with `estimatedRangeOutcome = true`
- Non-smart-repair summary recovery path:
  - the current runtime already contains `conservative_fallback` and `original_cv_fallback`
  - these paths now emit `summaryValidationRecovered = true` and `summaryRecoveryWasSmartRepair = false`
  - `summaryRepairThenClarityFail` stays false unless the recovery was specifically `smart_repair`

## Verification

- `npx vitest run "src/lib/ats/scoring/observability.test.ts"`
- `npx vitest run "src/lib/agent/tools/pipeline.test.ts"`
- `npx vitest run "src/lib/ats/scoring/index.test.ts"`
- `npx vitest run "src/lib/ats/scoring/observability.test.ts" "src/lib/agent/tools/pipeline.test.ts" "src/lib/ats/scoring/index.test.ts"`
- `npm run typecheck`

## Scope confirmation

- No summary rewrite behavior was changed.
- No smart-repair behavior was changed.
- No summary clarity threshold was changed.
- No ATS score decision policy was changed.
- This phase only made the summary recovery-to-score path measurable.
