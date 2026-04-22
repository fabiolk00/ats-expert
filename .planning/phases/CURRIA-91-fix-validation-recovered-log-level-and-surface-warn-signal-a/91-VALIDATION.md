# Phase 91 Validation

## Correction note

- `agent.ats_enhancement.validation_recovered` now emits at `info` from [src/lib/agent/ats-enhancement-pipeline.ts](/c:/CurrIA/src/lib/agent/ats-enhancement-pipeline.ts:423) because the pipeline still does not know the final ATS gate/score outcome at the recovery step.
- `agent.ats_enhancement.summary_clarity_outcome` now chooses its logger inside [src/lib/ats/scoring/observability.ts](/c:/CurrIA/src/lib/ats/scoring/observability.ts:195): it emits at `warn` only when `summaryRepairThenClarityFail === true`, and stays at `info` for all other paths.
- The exact `warn` condition remains the existing strict boolean from the Phase 90 payload:
  - `summaryValidationRecovered === true`
  - `summaryRecoveryWasSmartRepair === true`
  - `summaryClarityGateFailed === true`

## Monitoring-rule audit

Repo-wide search across `src/`, `docs/`, and `.planning/` found no local monitoring rule, alert configuration, or operator guide that depends on `agent.ats_enhancement.validation_recovered` specifically being emitted at `warn`.

The only direct references found were:

- the emit sites themselves
- focused tests
- Phase 90 planning/validation artifacts

That means the level correction did not require any downstream monitoring-rule update inside the repo.

## Verification

- `npx vitest run "src/lib/ats/scoring/observability.test.ts"`
- `npx vitest run "src/lib/agent/tools/pipeline.test.ts"`
- `npm run typecheck`

## Scope confirmation

- No payload fields were added, removed, or renamed.
- No pipeline behavior was changed.
- No smart-repair logic, gate logic, scoring policy, or UI behavior was changed.
- This phase was a log semantics correction only.
