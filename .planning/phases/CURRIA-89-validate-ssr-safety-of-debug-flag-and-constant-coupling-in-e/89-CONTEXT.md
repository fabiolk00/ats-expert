# Phase 89 Context

## Title

Validate SSR safety of debug flag and constant coupling in experience-entry surfacing layer

## Goal

Close the two residual risks left after Phase 88 by validating the real execution stack and test usage around the same-entry surfacing layer, then applying only the smallest confirmed fixes needed to keep the Phase 87/88 architecture safe and durable.

## Problem

Phase 88 made Layer 3 more explicit and debuggable, but two confirmation gaps remain:

1. `globalThis.__CURRIA_DEBUG_EXPERIENCE_HIGHLIGHT_SURFACING__` may be safe or unsafe depending on where the preview-highlighting pipeline actually runs in the Next.js request lifecycle.
2. Exporting `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY` is architecturally correct, but tests must not couple themselves to the constant internals instead of asserting observable behavior.

This phase is confirmation-first. If both risks are disproven by reading the real call chain and auditing the real tests, the correct outcome is a validation-only phase with no product-code changes.

## In Scope

- trace the real execution call chain into `buildOptimizedPreviewHighlights(...)` and `selectVisibleExperienceHighlightsForEntry(...)`
- confirm whether the surfacing layer runs in server context, client context, or both
- validate the intended semantics of the debug flag and harden/document `shouldTraceExperienceHighlightSurfacing()` only if needed
- search test files and shared test helpers for fixture coupling to `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY`
- replace any constant-internals assertions with observable behavior assertions if found
- document the safety outcome explicitly, including validation-only if no code changes are required

## Out Of Scope

- editorial priority changes
- selector logic changes
- span parsing or completion changes
- ATS gate changes
- summary, rewrite, PDF/export, or UI-tier behavior changes
- new user-facing debug controls

## Locked Decisions

- preserve the Phase 87 Layer 3 selector semantics
- preserve the Phase 88 exported policy constant and debug-only observability intent unless a confirmed safety risk requires a narrow guard/documentation change
- do not add defensive code for hypothetical SSR issues without confirming the real execution context first
- treat constant coupling as a test-quality issue only; do not refactor product code unless the audit shows a real need

## Deliverables

- `89-RESEARCH.md` documenting the real call chain, execution-context conclusion, and test-coupling audit
- `89-01-PLAN.md` with a confirmation-first executable plan
- code changes only if the SSR guard or tests need correction after validation
- `89-VALIDATION.md` summarizing the call chain, debug-flag semantics, coupling outcome, and whether the phase was validation-only or required a small fix
- green verification for the focused resume preview suites and typecheck

## Canonical References

- [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts)
- [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts)
- [src/lib/resume/optimized-preview-contracts.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-contracts.test.ts)
- [src/components/resume/resume-comparison-view.test.tsx](/c:/CurrIA/src/components/resume/resume-comparison-view.test.tsx)
- [88-VALIDATION.md](/c:/CurrIA/.planning/phases/CURRIA-88-harden-experience-entry-highlight-surfacing-with-explicit-po/88-VALIDATION.md)
- [88-REVIEW.md](/c:/CurrIA/.planning/phases/CURRIA-88-harden-experience-entry-highlight-surfacing-with-explicit-po/88-REVIEW.md)

## Acceptance Criteria

1. The real execution path into the same-entry surfacing layer is documented well enough to justify the SSR/debug-flag decision.
2. `shouldTraceExperienceHighlightSurfacing()` either gains the minimal required execution-context guard or is explicitly documented as safe for the confirmed context.
3. The intended semantics of the debug flag are documented clearly enough that maintainers do not assume unsupported client-driven SSR control behavior.
4. Every direct or indirect test usage of `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY` is reviewed.
5. No test asserts the constant internals as a fixture after this phase.
6. No selector logic, editorial policy, ATS gate, span completion, or UI-tier behavior is changed.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts"`
- `npx vitest run "src/lib/resume/optimized-preview-contracts.test.ts"`
- `npx vitest run "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`
