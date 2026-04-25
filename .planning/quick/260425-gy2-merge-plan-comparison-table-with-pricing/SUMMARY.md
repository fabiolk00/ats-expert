# Quick Task 260425-gy2

## Task

Merge the pricing comparison table with the pricing cards into a continuous hybrid layout that keeps the card-first overview while smoothly leading users into the detailed feature comparison below.

## Outcome

- Reworked `/precos` to render a single `PricingHybridShowcase` instead of two disconnected pricing sections.
- Added an `overview` variant to `src/components/pricing/pricing-cards.tsx` so the top section can stay compact and card-driven.
- Added an `embedded` variant to `src/components/landing/pricing-comparison-table.tsx` so the detailed comparison can live inside the same visual shell without a hard section break.
- Added `src/components/pricing/pricing-hybrid-showcase.tsx` with a shared container, gradient transition, and scroll cue that points to the detailed comparison block.
- Added focused tests covering the new overview cards, embedded comparison table variant, and the new hybrid pricing showcase flow.

## Verification

- `npx vitest run "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.test.tsx" "src/components/pricing/pricing-hybrid-showcase.test.tsx"`
- `npm run typecheck`
- `npx eslint src/components/pricing/pricing-cards.tsx src/components/landing/pricing-comparison-table.tsx src/components/pricing/pricing-hybrid-showcase.tsx "src/app/(public)/precos/page.tsx" src/components/pricing/pricing-cards.test.tsx src/components/landing/pricing-comparison-table.test.tsx src/components/pricing/pricing-hybrid-showcase.test.tsx`
- `npm run build`
