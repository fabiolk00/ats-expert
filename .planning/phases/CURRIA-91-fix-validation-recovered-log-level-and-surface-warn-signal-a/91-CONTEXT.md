# Phase 91 Context

## Title

Fix validation_recovered log level and surface warn signal at summary_clarity_outcome

## Goal

Correct the ATS enhancement log semantics so healthy validation recoveries emit informational logs, while the confirmed problematic smart-repair-to-clarity-fail path emits the warning-level signal that monitoring should care about.

## Problem

Phase 90 added the event that can distinguish healthy and problematic summary recovery outcomes:

- `agent.ats_enhancement.validation_recovered` still emits at `warn`
- `agent.ats_enhancement.summary_clarity_outcome` currently emits only at `info`

That means healthy recoveries and problematic recoveries both look noisy in warning-filtered monitoring, while the real problematic path does not get its own warning-level emphasis.

## In Scope

- change `agent.ats_enhancement.validation_recovered` from `warn` to `info`
- emit `agent.ats_enhancement.summary_clarity_outcome` at `warn` only when `summaryRepairThenClarityFail === true`
- keep `summary_clarity_outcome` at `info` for all other cases
- update unit and pipeline tests to assert the actual log level
- confirm there is no local monitoring rule in the repo that depends on `validation_recovered` remaining at `warn`

## Out Of Scope

- pipeline behavior changes
- smart-repair behavior changes
- quality-gate threshold changes
- ATS score-decision policy changes
- UI, export, or payload-shape changes
- changes to unrelated log events

## Locked Decisions

- payloads stay identical; this phase is level-only
- the `warn` condition for `summary_clarity_outcome` must align exactly with `summaryRepairThenClarityFail`
- healthy recovery remains a normal informational pipeline behavior
- no new monitoring framework is introduced

## Deliverables

- `91-RESEARCH.md` documenting the local alert/monitoring audit and the exact log seams
- `91-01-PLAN.md` with a local, level-only implementation plan
- code changes limited to log-level selection and test updates
- `91-VALIDATION.md` confirming the warn semantics are now aligned to the problematic path only
- green verification for ATS pipeline tests, ATS observability tests, and typecheck

## Canonical References

- [src/lib/agent/ats-enhancement-pipeline.ts](/c:/CurrIA/src/lib/agent/ats-enhancement-pipeline.ts)
- [src/lib/ats/scoring/observability.ts](/c:/CurrIA/src/lib/ats/scoring/observability.ts)
- [src/lib/agent/tools/pipeline.test.ts](/c:/CurrIA/src/lib/agent/tools/pipeline.test.ts)
- [src/lib/ats/scoring/observability.test.ts](/c:/CurrIA/src/lib/ats/scoring/observability.test.ts)
- [90-VALIDATION.md](/c:/CurrIA/.planning/phases/CURRIA-90-instrument-and-aggregate-summary-clarity-recovery-paths-that/90-VALIDATION.md)

## Acceptance Criteria

1. `agent.ats_enhancement.validation_recovered` emits at `info` in all cases.
2. `agent.ats_enhancement.summary_clarity_outcome` emits at `warn` when `summaryRepairThenClarityFail === true`.
3. `agent.ats_enhancement.summary_clarity_outcome` emits at `info` when `summaryRepairThenClarityFail === false`.
4. No payload fields are added, removed, or renamed.
5. No pipeline behavior, gate logic, scoring policy, or UI behavior changes in this phase.

## Verification

- `npx vitest run "src/lib/ats/scoring/observability.test.ts"`
- `npx vitest run "src/lib/agent/tools/pipeline.test.ts"`
- `npm run typecheck`
