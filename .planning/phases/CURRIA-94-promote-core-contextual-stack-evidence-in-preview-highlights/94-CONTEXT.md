# Phase 94 Context

## Title

Promote core contextual stack evidence in preview highlights without reopening Phase 92

## Goal

Improve preview highlight competitiveness for strong contextual stack bullets so real execution-centric stack evidence can surface when editorially central, while keeping preserved metrics dominant and preserving the Phase 92 fix.

## Problem

Phase 92 fixed preserved metric eligibility, but it also exposed a remaining gap:

1. Explicit metrics now surface correctly.
2. Generic scope/scale no longer steals space from stronger metrics.
3. But core stack bullets that describe real execution with technologies like Azure Databricks and PySpark still underperform in the preview.

Today the system treats technology mostly as a weak complementary signal. That avoids stack-only false positives, but it also under-values bullets where named technology is central to actual delivery work.

The missing category is not technology-only and not explicit metric. It is contextual stack evidence: technology plus execution verb plus concrete delivery context.

## In Scope

- explicitly distinguish `technologyOnly`, `contextualStack`, and stronger `coreContextualStack` evidence
- improve Layer 1 / Layer 2 signal competitiveness for core contextual stack bullets
- keep technology-only mentions weak and ineligible on their own
- add focused tests for contextual stack strength, same-entry competition, and Phase 92 stability

## Out Of Scope

- reopening preserved-metric eligibility behavior from Phase 92
- reducing metric priority
- changing Layer 3 editorial policy
- adding role-specific domain awareness
- changing ATS gates, ATS score policy, UI, export, or rewrite pipeline behavior

## Locked Decisions

- technology mention alone must not open high-priority highlight eligibility
- strong contextual stack means named technology plus execution verb plus concrete delivery context
- preserved metric dominance from Phase 92 remains intact
- Layer 2 may compare stronger signals, but no opaque combined ranking score should be introduced
- Layer 3 policy and ATS behavior remain unchanged

## Deliverables

- `94-RESEARCH.md` describing how to distinguish contextual stack from stack-only noise using the current preview highlight seams
- `94-01-PLAN.md` with a narrow implementation plan and regression coverage
- code changes limited to preview-highlight evidence detection / competitiveness and focused tests
- `94-VALIDATION.md`, `94-REVIEW.md`, `94-REVIEW-FIX.md`, and `94-01-SUMMARY.md`

## Canonical References

- [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts)
- [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts)
- [src/lib/resume/optimized-preview-contracts.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-contracts.test.ts)
- [src/components/resume/resume-comparison-view.test.tsx](/c:/CurrIA/src/components/resume/resume-comparison-view.test.tsx)
- [\.planning/phases/CURRIA-92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi/92-VALIDATION.md](/c:/CurrIA/.planning/phases/CURRIA-92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi/92-VALIDATION.md)
- [\.planning/ROADMAP.md](/c:/CurrIA/.planning/ROADMAP.md)
- [\.planning/REQUIREMENTS.md](/c:/CurrIA/.planning/REQUIREMENTS.md)

## Acceptance Criteria

1. The system distinguishes superficial stack mention from strong contextual stack evidence.
2. Bullets with core contextual stack evidence become genuinely more competitive in the preview.
3. Technology-only bullets remain weak and do not gain undue eligibility.
4. Strong metrics still beat contextual stack when the existing editorial policy says they should.
5. Core contextual stack can beat weaker generic scope/scale where appropriate.
6. Phase 92 preserved-metric behavior remains stable.
7. Layer 3 policy, ATS gates, and ATS score policy remain unchanged.
8. Typecheck and the relevant highlight tests pass.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`
