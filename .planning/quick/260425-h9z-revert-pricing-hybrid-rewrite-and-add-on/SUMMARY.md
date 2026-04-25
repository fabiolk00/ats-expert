# Quick Task 260425-h9z

## Task

Revert the pricing hybrid rewrite and keep the original pricing cards, adding only a frontend scroll cue that points the user down to the comparison table.

## Outcome

- Restored `src/components/pricing/pricing-cards.tsx` to the original full cards layout.
- Restored `src/components/landing/pricing-comparison-table.tsx` to the original standalone comparison table.
- Removed the hybrid pricing showcase component and its test.
- Updated `/precos` to render the normal pricing cards first, then a small arrow/CTA link that scrolls to the table below.
- Added a focused page test to verify the scroll cue on `/precos`.

## Verification

- `npx vitest run "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.test.tsx"`
- `npm run audit:copy-regression`
- `npx eslint "src/app/(public)/precos/page.tsx" "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.tsx" "src/components/landing/pricing-comparison-table.test.tsx"`
