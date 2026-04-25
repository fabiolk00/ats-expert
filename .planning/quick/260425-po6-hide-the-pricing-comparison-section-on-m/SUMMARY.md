# Quick Task 260425-po6

## Task

Hide the pricing comparison section on mobile and make the pricing cards mirror the same inclusion matrix so users can understand each plan without needing the table.

## Outcome

- Hid the pricing comparison CTA and table on mobile in `src/app/(public)/precos/page.tsx`, while keeping the full comparison available from `md` and up.
- Centralized the canonical plan inclusion matrix in `src/lib/pricing/plan-comparison.ts`.
- Updated `src/components/pricing/pricing-cards.tsx` so the cards now show the same curriculum count, ATS tier, PDF, AI chat, and history availability as the comparison table.
- Updated `src/components/landing/pricing-comparison-table.tsx` to consume that same shared source of truth.
- Adjusted `/precos` and pricing-card tests to lock the mobile-only behavior and the card/table parity.

## Verification

- `npx vitest run "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.test.tsx"`
- `npx eslint "src/app/(public)/precos/page.tsx" "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/landing/pricing-comparison-table.tsx" "src/components/landing/pricing-comparison-table.test.tsx" "src/lib/pricing/plan-comparison.ts"`
- `npm run audit:copy-regression`
- `npm run typecheck`
