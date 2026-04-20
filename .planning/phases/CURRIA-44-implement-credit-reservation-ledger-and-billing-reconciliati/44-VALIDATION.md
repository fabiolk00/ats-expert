# Phase 44 Validation

## Goal

Prove that reservation-backed export billing preserves the current generate and polling surfaces while adding an auditable ledger, idempotent reserve/finalize/release transitions, and operator-visible reconciliation diagnostics.

## Validation Architecture

### Wave 1: Reservation and ledger foundation

- `npx vitest run src/lib/db/credit-reservations.test.ts src/lib/db/schema-guardrails.test.ts`
  - proves reservation lifecycle semantics are idempotent
  - proves the new billing tables are classified in the repo's migration audit guardrail
- `npx vitest run src/lib/db/credit-reservations.test.ts src/lib/asaas/quota.test.ts && npm run typecheck`
  - proves reserve/finalize/release wrappers stay fail-closed and keep `credit_accounts` as the fast balance view

### Wave 2: Runtime integration, reconciliation, and observability

- `npx vitest run src/lib/resume-generation/generate-billable-resume.test.ts src/lib/jobs/processors/artifact-generation.test.ts "src/app/api/session/[id]/generate/route.test.ts"`
  - proves reserve before render, finalize on success, release on failure, and idempotent retry behavior
- `npx vitest run src/lib/asaas/reconciliation.test.ts src/lib/jobs/runtime.test.ts`
  - proves stuck or contradictory reservation states reconcile safely without double-adjustment
- `npx vitest run "src/app/api/file/[sessionId]/route.test.ts" "src/app/api/jobs/[jobId]/route.test.ts" src/hooks/use-session-documents.test.tsx src/components/dashboard/session-documents-panel.test.tsx`
  - proves existing polling and dashboard consumer paths surface the new billing stages without contract drift
- `npm run typecheck`
  - proves the expanded billing and status surfaces remain type-safe

## Requirement Mapping

| Requirement | Evidence |
|-------------|----------|
| `BILL-RES-01` | `src/lib/db/credit-reservations.test.ts`, `src/lib/asaas/quota.test.ts`, `src/lib/resume-generation/generate-billable-resume.test.ts` |
| `BILL-LEDGER-01` | `src/lib/db/credit-reservations.test.ts`, `src/lib/db/schema-guardrails.test.ts`, docs updates in `docs/billing/IMPLEMENTATION.md` and `docs/billing/OPS_RUNBOOK.md` |
| `BILL-OBS-01` | `src/app/api/file/[sessionId]/route.test.ts`, `src/app/api/jobs/[jobId]/route.test.ts`, `src/hooks/use-session-documents.test.tsx`, `src/components/dashboard/session-documents-panel.test.tsx` |
| `BILL-TEST-01` | Full set above plus `npm run typecheck` |

## Open Questions (RESOLVED)

1. **Validation gate artifact needed?** RESOLVED: yes; this file is the Nyquist validation artifact for Phase 44.
2. **Do polling-surface checks stop at backend routes?** RESOLVED: no; the current hook and panel tests are part of the brownfield status contract and must stay in scope.
