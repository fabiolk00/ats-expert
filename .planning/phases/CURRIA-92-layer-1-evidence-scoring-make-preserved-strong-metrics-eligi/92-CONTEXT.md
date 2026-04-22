# Phase 92 Context

## Title

Layer 1 evidence scoring: make preserved strong metrics eligible for highlight

## Goal

Make Layer 1 highlight eligibility depend on the editorial evidence present in the optimized bullet, so preserved strong metrics remain eligible even when original-vs-optimized improvement delta is minimal.

## Problem

In the ATS enhancement comparison preview, a same-entry `scope_scale` bullet was being surfaced while stronger preserved metric bullets such as `40%` and `15%` were not. The current Layer 3 policy is already correct: Tier 1 metric evidence should beat scope/scale, and Tier 1 should beat Tier 2 under the per-entry cap.

The root cause is earlier in Layer 1:

1. `evaluateExperienceBulletImprovement(...)` compares original versus optimized bullet text.
2. Highlight eligibility is driven mainly by the resulting `improvementScore`.
3. When the rewrite preserves already-strong metrics from the original resume, the diff is small.
4. The preserved metric bullet therefore receives a low improvement score and can lose eligibility to a weaker bullet that changed more textually.

That means the system is rewarding rewrite delta instead of the optimized bullet's editorial strength.

## In Scope

- add `evidenceScore` to the Layer 1 return shape from `evaluateExperienceBulletImprovement(...)`
- calculate `evidenceScore` from the optimized bullet itself, not from the original bullet
- redefine eligibility to use two independent paths:
  - `evidenceScore >= EVIDENCE_THRESHOLD`
  - `improvementScore >= IMPROVEMENT_THRESHOLD`
- keep `improvementScore` as a separate Layer 2 signal
- allow only minimal plumbing in Layer 2 so it can consume `evidenceScore` as an additional signal
- add direct unit coverage for the Layer 1 cases and focused integration coverage for same-entry surfacing

## Out Of Scope

- introducing a combined `rankingScore` in Layer 1
- changing Layer 2 editorial policy or moving ranking ownership out of Layer 2 / Layer 3
- changing Layer 3 visible-slot policy
- changing span completion, ATS gates, scoring, UI, export, or rewrite pipeline behavior
- adding domain-aware technology relevance logic

## Locked Decisions

- preserved strong evidence in the optimized bullet must remain eligible even when improvement delta is minimal
- `evidenceScore` must be explicit and numeric so tests can assert its scale and threshold
- technology mention alone must not open eligibility without measurable or scope-anchored evidence
- Layer 1 returns signals only; it must not decide which same-entry bullet wins visible surfacing
- Layer 2 remains responsible for candidate comparison and Layer 3 remains responsible for visible editorial surfacing

## Deliverables

- `92-RESEARCH.md` describing the current Layer 1/2/3 seam and the recommended evidence-score shape
- `92-01-PLAN.md` with a narrow execution plan limited to Layer 1 signal changes, minimal Layer 2 plumbing, and tests
- code changes in `src/lib/resume/optimized-preview-highlights.ts` plus focused tests
- `92-VALIDATION.md` confirming the numeric evidence-score scale, thresholds, preserved-metric recovery, and non-goals
- `92-REVIEW.md` and `92-REVIEW-FIX.md`

## Canonical References

- [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts)
- [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts)
- [\.planning/ROADMAP.md](/c:/CurrIA/.planning/ROADMAP.md)
- [\.planning/REQUIREMENTS.md](/c:/CurrIA/.planning/REQUIREMENTS.md)
- [\.planning/phases/CURRIA-87-formalize-experience-entry-highlight-surfacing-policy-as-an-/87-RESEARCH.md](/c:/CurrIA/.planning/phases/CURRIA-87-formalize-experience-entry-highlight-surfacing-policy-as-an-/87-RESEARCH.md)
- [\.planning/phases/CURRIA-88-harden-experience-entry-highlight-surfacing-with-explicit-po/88-RESEARCH.md](/c:/CurrIA/.planning/phases/CURRIA-88-harden-experience-entry-highlight-surfacing-with-explicit-po/88-RESEARCH.md)
- [\.planning/phases/CURRIA-89-validate-ssr-safety-of-debug-flag-and-constant-coupling-in-e/89-RESEARCH.md](/c:/CurrIA/.planning/phases/CURRIA-89-validate-ssr-safety-of-debug-flag-and-constant-coupling-in-e/89-RESEARCH.md)

## Acceptance Criteria

1. A bullet with preserved explicit metrics from the original resume is eligible even when `improvementScore` is low.
2. `evaluateExperienceBulletImprovement(...)` returns `evidenceScore` separately from `improvementScore`.
3. Eligibility uses `evidenceScore >= threshold || improvementScore >= threshold`.
4. Layer 1 does not introduce a combined `rankingScore`.
5. Layer 2 receives `evidenceScore` and `improvementScore` as separate signals.
6. Strong quantified evidence produces a high `evidenceScore`.
7. Stack-only bullets without measurable context do not receive a high `evidenceScore`.
8. Preserved metric evidence reaches Layer 3 as Tier 1 and beats same-entry scope/scale under cap.
9. Existing happy-path metric and scope/scale selections do not regress.
10. Typecheck and the focused highlight test suite pass.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts"`
- `npm run typecheck`
