# Phase 90 Research

## Current observability split

The current ATS enhancement flow already exposes the needed ingredients, but not at a single existing emit point:

- `src/lib/agent/ats-enhancement-pipeline.ts`
  - owns validation recovery behavior
  - logs `agent.ats_enhancement.validation_recovered`
  - knows recovery kinds such as `smart_repair`, `conservative_fallback`, and `original_cv_fallback`
- `src/lib/ats/scoring/index.ts`
  - builds the canonical ATS readiness contract
  - computes `scoreStatus`, `rawInternalConfidence`, `qualityGates`, and `withholdReasons`
- `src/lib/ats/scoring/observability.ts`
  - logs the canonical scoring decision via `ats_readiness.decision`
  - already exposes `gateImprovedSummaryClarity`, `scoreStatus`, `confidence`, and serialized withhold reasons

## Convergence check

There is **not** a single existing helper today where all of the following are already available together:

- summary validation recovery outcome
- summary recovery kind
- `gateImprovedSummaryClarity`
- `withholdReasons`
- final `scoreStatus`
- final confidence

The closest existing seams are split:

1. ATS enhancement pipeline
   - knows whether the summary participated in a recovered validation path
   - knows which recovery kind succeeded
   - does **not** itself compute the final ATS score outcome until it calls ATS scoring
2. ATS scoring contract builder
   - knows the final score outcome and all gates
   - does **not** know which summary-specific recovery path produced the valid rewrite because `RewriteValidationResult` does not persist recovery metadata

## Safe convergence point

The latest safe convergence point is inside `runAtsEnhancementPipeline(...)` in `src/lib/agent/ats-enhancement-pipeline.ts`, immediately after `buildAtsReadinessContractForEnhancement(...)` returns and before the pipeline persists or returns the final state.

At that point the code can access, in one local scope:

- original validation result
- final validation result
- recovery kind chosen by the pipeline
- optimization summary and changed sections
- canonical ATS readiness contract with
  - `qualityGates.improvedSummaryClarity`
  - `withholdReasons`
  - `scoreStatus`
  - `rawInternalConfidence`
  - `contractVersion`

This is the right place to emit a self-contained event because downstream consumers no longer need to join recovery logs with later scoring logs.

## Field-assembly implications

Because there is no pre-existing all-in-one helper, the event must assemble data from two local sources at the convergence point:

- pipeline-local state
  - whether the original invalid validation included the summary section
  - which recovery kind succeeded
  - whether the summary was touched by rewrite
- ATS readiness contract
  - `scoreStatus`
  - confidence
  - `withholdReasons`
  - `qualityGates.improvedSummaryClarity`
  - contract version and evaluation stage

This is still low-coupling because the pipeline already owns the recovery semantics and already calls the ATS readiness builder in the same function.

## Recovery-kind edge case

Alternative recovery kinds for the summary path **do exist** in the current code:

- `conservative_fallback`
- `original_cv_fallback`

That means the new payload should explicitly distinguish:

- `summaryValidationRecovered = true`
- `summaryRecoveryWasSmartRepair = false`

when a summary issue is recovered through a non-smart-repair path.

`summaryRepairThenClarityFail` should stay strict:

- true only when summary recovery happened
- the recovery kind was `smart_repair`
- the summary clarity gate still failed

## Recommended implementation shape

1. Add a narrow summary-clarity outcome log builder/recorder in `src/lib/ats/scoring/observability.ts`.
2. Keep the event emission in `runAtsEnhancementPipeline(...)`, where summary recovery semantics and the final ATS readiness contract converge.
3. Reuse canonical ATS readiness fields and naming instead of inventing parallel names.
4. Add unit coverage for payload assembly in `observability.test.ts`.
5. Add narrow pipeline assertions in `pipeline.test.ts` that the event is emitted once per ATS enhancement session with correct booleans.
