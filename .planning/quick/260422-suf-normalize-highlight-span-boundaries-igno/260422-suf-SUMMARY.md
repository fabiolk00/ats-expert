# Quick Task 260422-suf - Summary

## Outcome

Normalized highlight span boundaries now refine punctuation-heavy ranges in the artifact layer before persistence, so inline highlights stay closer to complete meaningful phrases instead of dying around separators or mid-token.

## What Changed

- Added separator-aware span refinement in [src/lib/resume/cv-highlight-artifact.ts](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.ts:1).
- Added a centralized boundary policy for light separators while preserving `$`, `%`, digits, and fail-close safety.
- Kept pipe-heavy stack bullets constrained by explicit fail-closed segment handling instead of broad grouped highlighting.
- Preserved balanced wrapper continuations when a refined span expands across `(` or `[`.
- Kept final acceptance under the existing overlap and editorial coverage guardrails.

## Regression Coverage

- [src/lib/resume/cv-highlight-artifact.test.ts](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.test.ts:1)
  Added coverage for slash terms, currency prefixes, comma continuation, clause-break rejection, colon continuation, parenthetical continuity, punctuation-gap merges, flat pipe-list suppression, mixed alphanumeric pipe-list suppression, and constrained contextual pipe segments.

- [src/lib/agent/tools/detect-cv-highlights.test.ts](/C:/CurrIA/src/lib/agent/tools/detect-cv-highlights.test.ts:1)
  Updated expectations so detector-contract tests still validate the existing single-call + fail-close flow after range refinement.

## Verification

- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`
- `npx vitest run src/components/resume/resume-comparison-view.test.tsx`
- `npm run typecheck`

All checks passed.
