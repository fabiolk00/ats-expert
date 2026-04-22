# Phase 93 Context

## Title

Summary editorial hardening: reduce repetition and increase information density in ATS enhancement preview

## Goal

Harden the ATS enhancement summary rewrite so the optimized summary is less repetitive, more information-dense, and more strongly positioned in its opening line without changing ATS gates, score policy, or downstream product behavior.

## Problem

The current ATS enhancement summary is structurally valid but editorially weak. It tends to:

1. Repeat the same lexical or semantic domain multiple times, especially around BI / experience / professional positioning.
2. Spend space on near-duplicate ideas instead of introducing new information.
3. Use safe but soft openings that delay seniority, focus, and stack positioning.
4. Underuse the available summary space for core stack, scope, and impact signals.

The result is a summary that is safe and coherent, but not as sharp or dense as the best optimized experience bullets.

## In Scope

- harden the summary rewrite/editorial cleanup logic to reduce lexical and semantic repetition
- introduce explicit anti-repetition / information-density rules for ATS summary rewrites
- reinforce stronger first-line positioning for seniority and main functional focus
- keep the summary to at most two sentences with distinct roles when possible
- add narrow editorial tests plus compatibility tests that prove the current pipeline remains safe

## Out Of Scope

- changing ATS gates or score decision policy
- changing clarity thresholds
- rewriting experience logic
- changing preview layout, export, or PDF structure
- changing smart-repair pipeline behavior outside summary editorial shaping
- adding deep domain-aware role intelligence

## Locked Decisions

- summary quality is judged by editorial density and clarity, not only structural safety
- the final optimized summary must avoid repeated domain phrasing unless repetition is necessary for clarity
- the first sentence should position identity, seniority, and main focus earlier and more assertively
- the summary should use at most two sentences with clearly different functions
- technical stack may reinforce positioning, but the summary must not degrade into buzzword stuffing
- this phase is editorial-only and must not alter ATS scoring or validation policy

## Deliverables

- `93-RESEARCH.md` describing the current summary rewrite seam and the strongest low-risk editorial hardening path
- `93-01-PLAN.md` with a narrow plan for summary editorial logic and tests
- code changes limited to summary rewrite / polish helpers and focused tests
- `93-VALIDATION.md`, `93-REVIEW.md`, `93-REVIEW-FIX.md`, and `93-01-SUMMARY.md`

## Canonical References

- [src/lib/agent/tools/rewrite-resume-full.ts](/c:/CurrIA/src/lib/agent/tools/rewrite-resume-full.ts)
- [src/lib/agent/tools/rewrite-section.ts](/c:/CurrIA/src/lib/agent/tools/rewrite-section.ts)
- [src/lib/agent/tools/pipeline.test.ts](/c:/CurrIA/src/lib/agent/tools/pipeline.test.ts)
- [src/lib/agent/tools/rewrite-section.test.ts](/c:/CurrIA/src/lib/agent/tools/rewrite-section.test.ts)
- [src/lib/ats/scoring/index.test.ts](/c:/CurrIA/src/lib/ats/scoring/index.test.ts)
- [src/components/resume/resume-comparison-view.test.tsx](/c:/CurrIA/src/components/resume/resume-comparison-view.test.tsx)
- [\.planning/ROADMAP.md](/c:/CurrIA/.planning/ROADMAP.md)
- [\.planning/REQUIREMENTS.md](/c:/CurrIA/.planning/REQUIREMENTS.md)

## Acceptance Criteria

1. The optimized summary reduces unnecessary lexical and semantic repetition.
2. The first sentence positions seniority and main focus more strongly than the current safe phrasing.
3. The summary gains information density without becoming a list of keywords.
4. Core stack can appear as editorial reinforcement when grounded.
5. The summary remains structurally safe and compatible with the existing rewrite pipeline.
6. ATS gates, score rules, preview layout, and export behavior remain unchanged.
7. Focused editorial tests cover redundancy reduction and density / positioning improvements.
8. Typecheck and the relevant ATS enhancement tests pass.

## Verification

- `npx vitest run "src/lib/agent/tools/pipeline.test.ts" "src/lib/agent/tools/rewrite-section.test.ts" "src/lib/ats/scoring/index.test.ts"`
- `npm run typecheck`
