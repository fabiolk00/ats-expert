# Phase 103: Alinhar preco e creditos dos planos Mensal e Pro entre UI, billing e testes - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Source:** User request

<domain>
## Phase Boundary

Adjust the existing plan configuration so the product consistently reflects the new Monthly and Pro limits without creating a new plan or changing unrelated business rules.

This phase covers:
- plan cards
- pricing comparison table
- any UI text that exposes Monthly or Pro price/credit totals
- checkout and subscription billing values for Pro
- monthly credit grants for Monthly and Pro
- impacted unit/integration tests

This phase does not cover:
- new plans
- new billing rules beyond the requested price and credit totals
- onboarding expansion or other roadmap changes

</domain>

<decisions>
## Implementation Decisions

### Locked decisions
- Monthly must grant 12 resumes/credits per month.
- Pro must cost R$ 59,90 per month.
- Pro must grant 30 resumes/credits per month.
- UI and backend billing must use the same values with no drift.
- The change must stay minimal and objective.
- Naming and project conventions must be preserved.
- Do not create a new plan.
- Do not alter unrelated business logic.

### the agent's Discretion
- Reuse the existing canonical plan source if one already exists.
- Remove hardcoded UI drift where a surface no longer follows the canonical plan data.
- Choose the smallest reasonable test set that proves UI/billing consistency and update any affected expectations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan source of truth
- `src/lib/plans.ts` - Canonical plan names, prices, credits, billing cadence, and feature copy.

### UI pricing surfaces
- `src/components/pricing/pricing-cards.tsx` - Public pricing cards built from canonical plan data.
- `src/components/landing/pricing-section.tsx` - Landing pricing section that reuses plan configuration.
- `src/components/landing/pricing-comparison-table.tsx` - Comparison table with Monthly and Pro values currently rendered separately.
- `src/components/pricing/checkout-onboarding-form.tsx` - Checkout onboarding surface that renders selected plan pricing.
- `src/app/(auth)/settings/page.tsx` - Authenticated billing/settings copy that exposes monthly credit totals.

### Billing surfaces
- `src/app/api/checkout/route.ts` - Checkout route that resolves paid plans through `getPlan(...)`.
- `src/lib/asaas/checkout.ts` - Asaas checkout payload builder that uses plan price/description.
- `src/lib/asaas/credit-grants.ts` - Billing event credit grants that use plan credits and amount.
- `src/lib/asaas/quota.ts` - Credit grant and user billing view model based on plan configuration.

### Impacted tests
- `src/lib/plans.test.ts` - Canonical plan value expectations.
- `src/lib/asaas/checkout.test.ts` - Checkout payload expectations for recurring plans.
- `src/lib/asaas/credit-grants.test.ts` - Billing RPC payload expectations.
- `src/lib/asaas/event-handlers.test.ts` - Webhook/billing amount assertions for Pro and recurring flows.
- `src/lib/asaas/quota.test.ts` - Billing info and grant expectations derived from plan credits.
- `src/app/api/checkout/route.test.ts` - Checkout route sequencing around monthly/pro flows.
- `src/components/pricing/pricing-cards.test.tsx` - Pricing cards UI behavior.

</canonical_refs>

<specifics>
## Specific Ideas

- Prefer updating `src/lib/plans.ts` first, then only fix remaining surfaces that still hardcode price or resume totals.
- If the comparison table is hardcoded, align it to the canonical plan values so future pricing changes do not drift again.
- Preserve existing billing cadence: Monthly and Pro remain recurring monthly plans.

</specifics>

<deferred>
## Deferred Ideas

- Any new tiering model or feature matrix redesign.
- Any copy/design refresh unrelated to the requested numbers.

</deferred>

---

*Phase: 103-alinhar-preco-e-creditos-dos-planos-mensal-e-pro-entre-ui-billing-e-testes*
*Context gathered: 2026-04-25 via user request*
