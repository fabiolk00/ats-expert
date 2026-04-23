# Quick Task 260422-wgg - Review Fix

## Review Findings Addressed

### 1. Broad comma-separated prepositional tails could over-expand

- Tightened `startsWithAttachedContinuation(...)` so comma continuation keeps only gerund-led and coordinated same-idea continuations.
- This prevents cases like `Improved store operations, in partnership with finance and logistics across LATAM` from being treated as one compact phrase.
- Added regression: `does not absorb broad comma-separated prepositional tails that start a new support context`.

### 2. Broad whitespace prepositional tails could over-expand after metric/action fragments

- Added `isLikelyTightPrepositionalClosure(...)` to allow only short, locally attached direct prepositional closures.
- The helper rejects broader chained tails such as `in batch pipelines across LATAM`.
- Wired `shouldPreferPhraseClosure(...)` to use the tighter closure classifier instead of broad prepositional acceptance.
- Added regression: `does not absorb broad whitespace prepositional tails after a metric fragment`.

## Verification

- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`
- `npm run typecheck`

## Result

- Phrase-closure behavior stays more complete for short semantic continuations.
- Compactness is preserved against the two review-identified over-expansion paths.
- Pipe-list containment and detector contract behavior remain unchanged.
