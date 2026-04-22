# REVIEW-FIX

Applied the warning from `92-REVIEW.md`.

## Fixed

- `WR-01`: stack-only rewrites phrased with a strong verb could still cross the improvement path with `evidenceScore = 0`

## Change

- tightened `qualifiesByImprovement` in [src/lib/resume/optimized-preview-highlights.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:1184) so the improvement path now also requires `evidenceScore > 0`
- added a direct regression in [src/lib/resume/optimized-preview-highlights.test.ts](/c:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts:427) covering `Implementei SQL e Python para o time.`

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`
