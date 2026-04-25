## Research Complete

### Standard Stack

- Keep `src/lib/plans.ts` as the single source of truth for plan names, prices, credit totals, billing cadence, and feature copy.
- Reuse existing plan readers instead of introducing a second config layer:
  - `getPlan(...)` for route validation and checkout
  - `PLANS[...]` for UI and billing internals
- Keep checkout and billing flows on the current Asaas integration:
  - `src/app/api/checkout/route.ts` resolves the paid plan through `getPlan(...)`
  - `src/lib/asaas/checkout.ts` derives the recurring amount from `PLANS[plan].price`
  - `src/lib/asaas/credit-grants.ts` and `src/lib/asaas/quota.ts` derive credits from the same canonical object
- Keep test coverage in Vitest and update only the impacted assertions around plan price/credits and UI drift.

### Architecture Patterns

- Canonical plan data should flow outward from `src/lib/plans.ts`:
  - UI cards and checkout onboarding render `PLANS`
  - checkout validation resolves `getPlan(...)`
  - Asaas payloads derive amount from `PLANS[plan].price`
  - webhook credit grants derive monthly credits from `plan.credits`
- Brownfield-safe change order:
  1. update the canonical plan object
  2. update any UI surface that still hardcodes price or resume totals
  3. update billing tests that assert Pro amounts directly
  4. run the focused impacted suite
- Prefer removing drift over adding translation layers:
  - if a comparison surface manually duplicates plan values, align it to `PLANS` instead of maintaining a second price matrix

### Don't Hand-Roll

- Do not add a new pricing config file or feature-flag layer for this change.
- Do not special-case Pro pricing in checkout or webhook handlers; use the existing canonical plan lookup.
- Do not change billing cadence, subscription state handling, or quota business rules beyond the requested totals.
- Do not rewrite the pricing UI shell when the task is only value alignment.

### Common Pitfalls

- `src/components/landing/pricing-comparison-table.tsx` currently hardcodes Monthly and Pro display values, so changing only `src/lib/plans.ts` would still leave UI drift.
- `src/lib/plans.ts` currently still advertises Monthly as 20 resumes/month and Pro as 50 resumes/month at `6990`, so billing and most UI surfaces are still on the old numbers.
- `src/lib/asaas/event-handlers.test.ts` asserts the old Pro amount directly (`6990` / `69.9`) for subscription-start flows; this will fail even if runtime code is correct.
- `src/app/(auth)/settings/page.tsx` derives credits from `PLANS`, so copy there will fix itself only if the canonical values change first.
- `src/components/dashboard/plan-update-dialog.tsx` and `src/components/pricing/checkout-onboarding-form.tsx` also render from `PLANS`, so partial fixes inside only public pricing pages would leave authenticated upgrade/checkout surfaces inconsistent.

### Code Examples

- Canonical plan resolution already exists:
  - `src/lib/plans.ts`
  - `src/app/api/checkout/route.ts`
- Billing amount derivation already follows the canonical source:
  - `src/lib/asaas/checkout.ts`
  - `src/lib/asaas/credit-grants.ts`
- UI drift is isolated in one comparison surface that duplicates values instead of reading `PLANS`:
  - `src/components/landing/pricing-comparison-table.tsx`

### Recommended Change Surface

1. Update `src/lib/plans.ts`
   - Monthly credits: `20 -> 12`
   - Monthly feature copy: `20 curriculos por mes -> 12 curriculos por mes`
   - Pro price: `6990 -> 5990`
   - Pro credits: `50 -> 30`
   - Pro feature copy: `50 curriculos por mes -> 30 curriculos por mes`
2. Align `src/components/landing/pricing-comparison-table.tsx`
   - Remove the hardcoded Pro price drift (`R$ 69,90`)
   - Prefer deriving Monthly and Pro name/price/period/curriculos from `PLANS`
3. Update focused expectations in:
   - `src/lib/plans.test.ts`
   - `src/lib/asaas/event-handlers.test.ts`
4. Keep the rest of the runtime on the existing canonical reads and verify through targeted tests.

### Test Impact

- Must update direct value assertions in `src/lib/plans.test.ts`.
- Must update Pro recurring billing assertions in `src/lib/asaas/event-handlers.test.ts`.
- Billing flow tests in `src/lib/asaas/checkout.test.ts`, `src/lib/asaas/credit-grants.test.ts`, `src/lib/asaas/quota.test.ts`, and `src/app/api/checkout/route.test.ts` are still worth running because they derive values from `PLANS` and guard against UI/backend drift.
- UI behavior tests in `src/components/pricing/pricing-cards.test.tsx` should keep passing, but they belong in the impacted regression set because the component renders canonical prices/features.

### Validation Architecture

| Property | Value |
|---|---|
| Framework | Vitest |
| Quick run command | `npx vitest run src/lib/plans.test.ts src/lib/asaas/event-handlers.test.ts src/lib/asaas/checkout.test.ts src/lib/asaas/credit-grants.test.ts src/lib/asaas/quota.test.ts src/app/api/checkout/route.test.ts src/components/pricing/pricing-cards.test.tsx` |
| Full confidence add-on | `npm run typecheck` |

### Recommended Plan Shape

- One plan is enough.
- Keep execution in a single wave because the change set is tightly coupled around one canonical data source and one drifted comparison table.
- Success should be defined by a single invariant: Monthly and Pro numbers match everywhere the product or billing layer reads them.
