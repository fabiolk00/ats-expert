# Summary

Implemented credit-aware recoverable-validation override hardening.

## Delivered

- Added shared CTA resolution for `Gerar mesmo assim` vs `Adicionar créditos`.
- Reused `PlanUpdateDialog` in both profile setup and workspace.
- Added structured `insufficient_credits` backend response with `openPricing`.
- Moved credit validation ahead of draft consumption in the override route.
- Added frontend fallback to open pricing when backend detects insufficient credits.
- Added analytics for pricing exposure/click and insufficient-credit fallback.
- Covered route, profile setup, and workspace with automated tests.

## Verification

- `npm run typecheck`
- `npx vitest run src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx`
- `npx playwright test tests/e2e/recoverable-validation-credit-refresh.spec.ts --project=chromium`

## Visual Validation

- Added browser-level validation in `tests/e2e/recoverable-validation-credit-refresh.spec.ts`.
- Captured evidence in `test-results/` for both profile setup and workspace:
  - `profile-setup-pricing-open.png/.json`
  - `profile-setup-override-success.png/.json`
  - `workspace-pricing-open.png/.json`
  - `workspace-override-success.png/.json`
- Verified that the CTA flips from `Adicionar créditos` to `Gerar mesmo assim (1 crédito)` after the billing summary refreshes on focus.
- Verified that the same `overrideToken` is reused after the credit refresh and that only the override route is called after the transition.
- Verified analytics emission for `agent.job_targeting.validation_override_credit_added` in both consumers.

## Notes

- In profile setup, a brand-new recoverable block still requires an initial generation attempt, so the browser validation starts with one available credit, opens the recoverable modal, simulates the credit balance dropping to zero, then refreshes back to one credit after pricing. This still validates the production-critical path: the blocked draft is preserved, the CTA updates without rerunning targeting, and the same override token is used after the user regains credit.
