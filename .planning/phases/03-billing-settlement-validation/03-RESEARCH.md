# Phase 3 Research: Billing Settlement Validation

**Date:** 2026-04-10
**Phase:** 03-billing-settlement-validation

## Goal

Verify that CurrIA's settlement-based billing contract behaves correctly in staging, remains idempotent under duplicate or replayed webhook deliveries, and keeps dashboard credit displays aligned with runtime balances.

## Evidence Collected

### The billing contract is already explicit in code and docs

- `docs/billing/IMPLEMENTATION.md` describes the current settlement contract, including one-time payments, recurring activation and renewal behavior, and the intent behind metadata reconciliation.
- `src/lib/asaas/event-handlers.ts` is the core settlement engine for `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, subscription activation, renewal, and cancellation side effects.
- `src/lib/asaas/credit-grants.ts` defines the idempotent credit grant path and links grants to stable event references.
- `src/lib/asaas/quota.ts` computes the display-facing totals that Phase 3 must compare against runtime balances.

This means Phase 3 does not need discovery of business rules from scratch. It needs proof that the current contract behaves the same way in staging.

### Local billing test coverage is already strong

The repo already has focused tests for the major billing behaviors:

- `src/app/api/webhook/asaas/route.test.ts`
- `src/lib/asaas/event-handlers.test.ts`
- `src/lib/asaas/credit-grants.test.ts`
- `src/lib/asaas/quota.test.ts`
- `src/app/api/checkout/route.test.ts`

These tests reduce the risk of shipping undocumented billing logic, but they do not replace staging evidence for `BILL-01`, `BILL-02`, and `BILL-03`.

### Staging preflight exists, but staged scenario execution is still mostly manual

- `scripts/verify-staging.sh` checks environment variables, service reachability, database access, webhook authentication prerequisites, and required billing migrations.
- `docs/staging/SETUP_GUIDE.md`, `docs/staging/VALIDATION_PLAN.md`, and `docs/billing/OPS_RUNBOOK.md` describe pieces of the operator workflow.

What is still missing is a committed, repeatable scenario runner that can replay named billing events against staging and pair each run with a database snapshot plus auditable evidence output.

### The existing stress script is not the right Phase 3 proof path

`scripts/stress-test-setup.sh` is interactive, localhost-oriented, and blends session stress setup with billing concerns. It is useful as a historical script, but it is not a clean fit for the current Phase 3 requirement set because:

- it is not organized around named settlement scenarios
- it assumes local auth and local endpoints
- it does not produce structured evidence artifacts for replay or audit

Phase 3 should add narrower staging validation helpers instead of extending this script.

### There is a concrete contract drift around `externalReference`

Current documentation and runtime code do not fully agree on the outgoing checkout reference shape:

- `docs/billing/IMPLEMENTATION.md` and related staging notes describe the v1 contract as `curria:v1:c:<checkoutReference>`
- `src/lib/asaas/external-reference.ts`, `src/app/api/checkout/route.ts`, and related tests still use a user-prefixed shape such as `curria:v1:u:<appUserId>:c:<checkoutReference>`

This is exactly the kind of live-contract inconsistency Phase 3 should validate in staging and then either confirm or reconcile in `03-03`.

### Shell and operator prerequisites are part of the real work

Phase 1 standardized `.env.staging.example` and `bash scripts/verify-staging.sh` as the staging preflight entry point, but Phase 3 still depends on tooling that may not exist on every workstation:

- `bash` or a compatible shell
- `curl`
- `psql`
- staging API and database access
- Asaas sandbox credentials and webhook token
- a known staging test user or resettable billing fixture

These must be treated as first-class validation inputs, not hidden assumptions.

### Dashboard display correctness must be validated alongside billing state

`BILL-03` is not satisfied by proving credit grants alone. The dashboard and auth-layout billing reads must also stay consistent with the runtime balance during staging scenarios.

This matters because the Phase 2 browser lane still logged caught billing metadata fetch failures from server components. Even if those logs are non-blocking, Phase 3 should explicitly compare:

- runtime balances from `credit_accounts`
- display-oriented totals from `user_quotas`
- any checkout or subscription metadata surfaced during staged validation

## Recommended Plan Split

### Wave 1

- `03-01`: Add staging replay and state-snapshot helpers, then reconcile staging docs and runbooks around the real settlement contract.

This makes Phase 3 runnable by operators instead of relying on ad hoc shell work.

### Wave 2

- `03-02`: Execute the live staging billing matrix and capture auditable evidence plus a structured gaps register.

This is the plan that actually proves or disproves `BILL-01`, `BILL-02`, and `BILL-03`.

### Wave 3

- `03-03`: Patch only the inconsistencies surfaced by staging, add or tighten regressions, update the docs to match validated behavior, and rerun affected scenarios.

This keeps remediation tightly coupled to live findings instead of speculative refactors.

## Risks and Constraints

- Staging validation can mutate real billing rows, so scenario selection and replay safety need explicit operator guardrails.
- Webhook replays can become misleading if the tool cannot tie response data to resulting database state. Evidence capture must pair request identifiers with snapshots.
- A documentation-only fix would be insufficient if staging disproves the current code path; likewise, a code-only fix would be insufficient if operators still cannot verify it repeatably.
- The `externalReference` drift may affect idempotency, event routing, or post-settlement lookup behavior. It should be treated as a live contract question, not a cosmetic naming issue.
- Phase 3 depends on actual staging access. Unlike Phase 2, the final proof cannot stay entirely local.

## Validation Architecture

### Local automated proof

1. Keep the existing billing Vitest suite green while adding any new helper scripts.
2. Add repo-local commands for listing staging scenarios and checking billing state snapshots.
3. Use `npm run typecheck` before declaring any plan complete.

### Live staging proof

1. Start from `bash scripts/verify-staging.sh` as the required preflight.
2. Replay a named staging scenario against `/api/webhook/asaas` with explicit tokens and identifiers.
3. Capture resulting rows from `billing_checkouts`, `credit_accounts`, `user_quotas`, and `processed_events`.
4. Record each scenario's evidence and whether it satisfied `BILL-01`, `BILL-02`, and `BILL-03`.

### Success signal for Phase 3

Phase 3 can be considered complete only when all of the following are true:

- the team can rerun named settlement scenarios against staging using committed repo tooling
- staged one-time, activation, renewal, cancellation, partial-success, and duplicate-delivery cases are evidenced against the current contract
- idempotency is proven by state snapshots instead of inferred from webhook responses alone
- dashboard-facing totals do not contradict runtime balance in the validated scenarios
- any staging-found inconsistency is either fixed with regression coverage or documented as an explicit remaining gap
