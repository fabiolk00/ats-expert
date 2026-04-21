# Phase 88 Validation

## Hardening note

- `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY` now lives in [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts) as an exported editorial policy constant with an explicit warning that changing it changes visible same-entry surfacing behavior under cap pressure.
- Cap ownership stayed on the preferred explicit path: `selectVisibleExperienceHighlightsForEntry(...)` still receives `maxVisibleHighlights` as an explicit parameter, and the selector comment now documents that this boundary owns the visible-slot suppression contract.
- A debug-only surfacing trace was added locally in [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts). It emits `console.debug` only when `process.env.NODE_ENV !== "production"` and `globalThis.__CURRIA_DEBUG_EXPERIENCE_HIGHLIGHT_SURFACING__ === true`, with a compact payload containing bullet indexes, eligibility, tier/category, scores, and selected versus suppressed status.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts"`
- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" -t "debug trace"`
- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`

## Scope confirmation

- No selector logic was reopened beyond making the existing Layer 3 policy explicit and diagnosable.
- No bullet-level parsing, winner selection, completion, ATS gates, or UI-tier rendering policy was changed.
- This was a hardening pass only.
