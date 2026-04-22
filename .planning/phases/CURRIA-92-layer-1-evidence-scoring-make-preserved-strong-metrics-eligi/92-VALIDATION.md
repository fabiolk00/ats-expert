# Phase 92 Validation

## Layer 1 contract

- [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:30) now defines `EXPERIENCE_BULLET_IMPROVEMENT_THRESHOLD = 5`.
- [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:37) now defines `EXPERIENCE_BULLET_EVIDENCE_THRESHOLD = 90`.
- [evaluateExperienceBulletImprovement(...)](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:1150) now returns:
  - `eligible`
  - `improvementScore`
  - `evidenceScore`

The numeric evidence scale intentionally reuses the existing editorial candidate score:

- metric evidence lands around `100+`
- strong scope/scale evidence lands around `90+`
- contextual stack evidence typically remains below `80`

## Eligibility rule

Layer 1 eligibility now follows two independent paths:

- `evidenceScore >= EXPERIENCE_BULLET_EVIDENCE_THRESHOLD`
- `improvementScore >= EXPERIENCE_BULLET_IMPROVEMENT_THRESHOLD`, with a guard against superficial tech-only additions

That means preserved strong evidence no longer needs any minimum rewrite delta once the optimized bullet already contains strong objective evidence.

## Recovered regression

- Direct proof lives in [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts:373), where a preserved `40%` bullet with `improvementScore = 0` still remains eligible through `evidenceScore`.
- Real preview proof lives in [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts:858), where preserved same-entry metric bullets surface while a competing same-entry `scope_scale` bullet is suppressed under the existing cap.

## Threshold calibration

The threshold was re-checked against the real runtime output of `evaluateExperienceBulletImprovement(...)` in final state, using preserved CNH-style metric bullets flowing through the same scoring path used by Phase 92:

- preserved `40%` case: `evidenceScore = 115`
- preserved `15%` case: `evidenceScore = 117`
- configured threshold: `EXPERIENCE_BULLET_EVIDENCE_THRESHOLD = 90`

That means the current threshold is empirically justified for the motivating preserved-metric cases, with meaningful headroom rather than a barely-passing calibration.

## Guardrail against noise

- [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts:418) proves that a superficial `SQL e Python` mention does not become eligible.
- [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts:903) proves the same stack-only bullet stays suppressed in the real preview pipeline.

## Review-fix integrity

The change recorded in [92-REVIEW-FIX.md](/c:/CurrIA/.planning/phases/CURRIA-92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi/92-REVIEW-FIX.md) was logic-affecting, not just structural:

- it tightened `qualifiesByImprovement` so the improvement path now also requires `evidenceScore > 0`
- that directly changed Layer 1 eligibility behavior for strong-verb stack-only rewrites such as `Implementei SQL e Python para o time.`

Focused tests were re-run after that logic fix in the final state:

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`

## Architectural follow-up

`evidenceScore` is currently derived from the best result of `collectRankedExperienceHighlightCandidates(optimized)`.

Classification: coupled but acceptable for now.

- This reuse is safe enough for Phase 92 because it keeps eligibility and rendered evidence anchored to the same optimized-bullet evidence vocabulary, and the threshold has now been validated against the real motivating cases.
- It is still a maintenance coupling point because future Layer 2 candidate-scoring changes can silently alter Layer 1 evidence calibration.
- No refactor was required for this follow-up. The current reuse is documented in code, and if Layer 1 / Layer 2 needs diverge later the smallest cleanup path is to extract a neutral single-bullet evidence helper shared by both layers.

## Scope confirmation

- No combined `rankingScore` was introduced in Layer 1.
- Layer 2 still owns candidate comparison through the existing winner score flow.
- Layer 3 same-entry tier/category ordering and cap behavior were not changed semantically.
- No ATS gates, render-tier policy, rewrite pipeline behavior, UI, export, or domain-awareness logic changed in this phase.
- This validation pass changed no product behavior; it only added validation coverage and documentation.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts"`
- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`

## Commit readiness

Phase 92 is safe to commit as-is.

- `EXPERIENCE_BULLET_EVIDENCE_THRESHOLD = 90` is validated by measured runtime outputs for the motivating preserved `40%` and `15%` cases.
- The post-review fix was logic-affecting, and the focused final-state tests were re-run after that fix.
- No Layer 3 policy, ATS behavior, UI behavior, export behavior, or rewrite behavior changed during this validation pass.
