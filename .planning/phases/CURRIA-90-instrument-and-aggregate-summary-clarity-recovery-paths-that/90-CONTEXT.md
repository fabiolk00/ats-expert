# Phase 90 Context

## Title

Instrument and aggregate summary-clarity recovery paths that fall back to estimated_range

## Goal

Make the ATS enhancement summary recovery path explicitly measurable by emitting one self-contained session-level event that ties summary recovery semantics, summary clarity gating, and the final ATS score outcome together without changing rewrite, gate, or scoring behavior.

## Problem

Recent ATS enhancement evidence suggests a specific path is hard to diagnose from existing logs alone:

1. summary rewrite enters `validation_recovered`
2. recovery kind is often `smart_repair`
3. structural validity is restored
4. `gateImprovedSummaryClarity` still remains false
5. the session ends with `scoreStatus: estimated_range`

Today the ingredients for that story are split across multiple seams:

- recovery logs live in the ATS enhancement pipeline
- quality gates and withhold reasons live in the ATS readiness contract
- final score outcome lives in ATS readiness scoring observability

That fragmentation makes it expensive to answer how often this path happens, whether it is summary-specific, and how strongly it correlates with `estimated_range`.

## In Scope

- confirm the latest safe convergence point where summary recovery semantics and the final ATS readiness decision are both known
- emit one structured event per ATS enhancement session with explicit booleans for the summary recovery path
- tie summary recovery and summary clarity outcomes directly to `scoreStatus`, confidence, and withhold reasons
- keep the event intentionally queryable from logs without timeline reconstruction
- add focused unit or narrow integration coverage for healthy, recovered, and failed summary-clarity paths

## Out Of Scope

- changing summary rewrite prompts or policy
- changing smart-repair behavior
- changing summary clarity thresholds
- changing ATS readiness scoring policy
- changing UI rendering, persistence behavior, billing, or artifact export
- adding dashboard infrastructure beyond logs

## Locked Decisions

- preserve current ATS enhancement behavior and score-decision policy
- prefer the latest safe convergence point near ATS enhancement finalization over fragmented multi-event reconstruction
- keep summary-path booleans semantically strict, especially `summaryRepairThenClarityFail`
- do not introduce a broad analytics framework for this phase

## Deliverables

- `90-RESEARCH.md` documenting where summary recovery, quality-gate evaluation, and final score decision converge
- `90-01-PLAN.md` with an execution plan focused on one self-contained structured event
- code changes limited to payload assembly, event emission, and tests
- `90-VALIDATION.md` describing the final emit point, queryable booleans, and confirmation that behavior remained unchanged
- green verification for relevant ATS enhancement and observability tests plus typecheck

## Canonical References

- [src/lib/agent/ats-enhancement-pipeline.ts](/c:/CurrIA/src/lib/agent/ats-enhancement-pipeline.ts)
- [src/lib/ats/scoring/index.ts](/c:/CurrIA/src/lib/ats/scoring/index.ts)
- [src/lib/ats/scoring/observability.ts](/c:/CurrIA/src/lib/ats/scoring/observability.ts)
- [src/lib/ats/scoring/quality-gates.ts](/c:/CurrIA/src/lib/ats/scoring/quality-gates.ts)
- [src/lib/agent/tools/pipeline.test.ts](/c:/CurrIA/src/lib/agent/tools/pipeline.test.ts)
- [src/lib/ats/scoring/observability.test.ts](/c:/CurrIA/src/lib/ats/scoring/observability.test.ts)

## Acceptance Criteria

1. A single structured ATS enhancement event exists that captures summary recovery semantics and final score outcome together.
2. The event includes explicit booleans for `summaryValidationRecovered`, `summaryRecoveryWasSmartRepair`, `summaryClarityGateFailed`, `summaryRepairThenClarityFail`, and `estimatedRangeOutcome`.
3. The event is emitted only after the final ATS score decision is known.
4. The event distinguishes healthy sessions from problematic recovery paths without requiring joins to later render events.
5. Tests cover healthy, recovered, failed-clarity, and non-summary or non-smart-repair branches.
6. No summary rewrite behavior, clarity thresholds, ATS scoring policy, or UI behavior changes in this phase.

## Verification

- `npx vitest run "src/lib/ats/scoring/observability.test.ts"`
- `npx vitest run "src/lib/agent/tools/pipeline.test.ts"`
- `npx vitest run "src/lib/ats/scoring/index.test.ts"`
- `npm run typecheck`
