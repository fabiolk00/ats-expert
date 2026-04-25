# Plan Review - Phase 103

**Reviewed:** 2026-04-25  
**Primary external reviewer:** Claude CLI attempt failed because the organization did not have access during execution.  
**Fallback reviewer:** Codex CLI separate session

## Summary

The original plan direction was correct, but the review found two blocking verification gaps before execution:

- the shared `formatPrice(...)` helper still rendered dot decimals (`R$ 59.90`), which would violate the locked UI requirement `R$ 59,90`
- the proposed regression set did not yet prove a successful Pro checkout path using the canonical `5990` amount

The plan was revised before execution to close both gaps.

## Findings Incorporated

1. HIGH - Localize shared UI price formatting
   - `src/lib/plans.ts` currently formats non-zero prices with dot decimals.
   - Multiple UI surfaces consume that formatter, so changing only canonical cents values would still leave UI copy inconsistent with the acceptance criteria.
   - Plan update: include formatter localization and expand UI tests to the comparison table, checkout onboarding, and plan-update dialog.

2. HIGH - Add explicit Pro checkout amount proof
   - Existing route and checkout tests did not explicitly prove a happy-path Pro checkout persisted or forwarded `5990`.
   - Plan update: require explicit Pro checkout coverage in `src/app/api/checkout/route.test.ts` and/or `src/lib/asaas/checkout.test.ts`.

3. MEDIUM - Align declared file scope with likely impacted tests
   - `src/lib/asaas/quota.test.ts` still contains Monthly totals based on the old allowance.
   - Plan update: add quota and route/checkout tests to `files_modified`.

## Residual Risk

Residual risk after the plan revision is low:

- runtime billing already derives from `PLANS`
- the main remaining risk is missing a hardcoded UI or assertion path, which the revised test set is designed to catch
