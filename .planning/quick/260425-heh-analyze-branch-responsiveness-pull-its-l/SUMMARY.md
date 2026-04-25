# Quick Task 260425-heh

## Task

Analyze the `landing-page-responsiveness` branch, pull its landing responsiveness ideas into the current branch, and adapt those improvements to the pricing work that was just adjusted.

## Outcome

- Pulled the responsiveness direction from `landing-page-responsiveness` and applied it to the landing hero.
- Added `src/components/landing/floating-decorations.tsx` and updated `src/components/landing/hero-section.tsx` with the responsive spacing, stacked mobile CTAs, and scroll cue pattern from that branch.
- Kept the pricing cards in their original layout and removed the hybrid pricing rewrite.
- Adapted `/precos` to use the same responsive spacing language while keeping only a lightweight scroll arrow/CTA down to the comparison table.
- Preserved the copy-audit fixes and the pricing revert already pending in the working tree.

## Verification

- `npx vitest run "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.test.tsx"`
- `npm run audit:copy-regression`
- `npx eslint "src/app/(public)/precos/page.tsx" "src/app/(public)/precos/page.test.tsx" "src/components/landing/hero-section.tsx" "src/components/landing/floating-decorations.tsx" "src/components/pricing/pricing-cards.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.tsx" "src/components/landing/pricing-comparison-table.test.tsx"`
- `npm run typecheck`
