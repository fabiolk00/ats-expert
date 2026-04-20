# Phase 44 Context - Implement credit reservation, ledger, and billing reconciliation

## Decisions

- This phase upgrades the current post-render credit consumption model into a reservation-backed billing flow for resume export generation.
- The scope includes three tightly related concerns that should be designed together:
  1. credit reservation before expensive render work
  2. durable ledger/audit records for credit movements
  3. reconciliation and observability for degraded or partially failed billing paths
- Reservation should use an explicit state machine rather than one long database transaction. The expected model is short atomic steps such as `reserve`, `finalize`, and `release`.
- Existing brownfield product behavior should remain as stable as possible: users still request generation through the current route and job surfaces, and the meaning of a paid export should stay "1 credit = 1 export".
- `credit_accounts` can remain the fast balance view if needed, but a ledger trail must become the auditable record of billing movements and reservation lifecycle.
- Billing correctness is more important than breadth. If the full user-facing credits dashboard cannot be landed safely in the same phase, backend reservation, ledger, and operator visibility take priority.
- Reservation, finalization, release, and reconciliation must all be idempotent and keyed to the generation intent so retries do not duplicate holds, consumption, or refunds.
- The design must not rely on `resume_generations` as the sole financial source of truth. Billing must remain diagnosable even when generation-history persistence is degraded.
- Logs and metrics should become explicit enough to distinguish reservation failures, render failures after reservation, finalize failures, release failures, and reconciliation gaps.

## Claude's Discretion

- Choose the narrowest brownfield-safe schema and service surface that achieves reservation plus ledger correctness.
- Decide whether ledger records live in one table or a minimal pair of tables as long as the model stays auditable and easy to reconcile.
- Decide whether reconciliation starts as an in-app periodic worker, an admin command, or a lightweight repair routine, as long as the path is testable and operationally useful.
- Add only the user-facing credit transparency that can be supported safely by the backend model landed in this phase.

## Deferred Ideas

- Full billing analytics dashboards beyond the minimum user/operator credit history needed for trust and debugging.
- Replacing Asaas or redesigning subscription plan semantics.
- Broader monetization changes unrelated to export reservation and auditability.
