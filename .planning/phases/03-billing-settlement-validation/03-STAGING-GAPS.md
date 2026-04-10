# Phase 3 Staging Gaps

**Phase:** 03-billing-settlement-validation  
**Status:** Passed  
**Last updated:** 2026-04-10T06:05:18Z

## No open gaps

All seven live billing scenarios passed against the approved live target, and no runtime billing inconsistency remains open.

- `BILL-01`: satisfied by the successful one-time, inactive snapshot, activation, renewal, cancellation, duplicate replay, and partial-success reconcile runs.
- `BILL-02`: satisfied by duplicate and reconcile evidence that left `credit_accounts.runtime_balance` unchanged and did not create extra authoritative processed events.
- `BILL-03`: satisfied because `user_quotas.credits_remaining` as the display total never fell below `credit_accounts.credits_remaining` in the validated scenarios.

No runtime owner-file remediation is required in `src/lib/asaas/event-handlers.ts`, `src/lib/asaas/credit-grants.ts`, `src/lib/asaas/quota.ts`, `src/app/api/webhook/asaas/route.ts`, `src/app/api/checkout/route.ts`, or `src/lib/asaas/external-reference.ts`.

## Resolved

### Gap 1: Bash preflight could not run from the original workstation entrypoint

- **scenario:** phase_preflight
- **requirement_ids:** BILL-01, BILL-02, BILL-03
- **issue_class:** operator
- **observed_behavior:** `bash scripts/verify-staging.sh` originally failed through the default Windows alias before the script started.
- **expected_behavior:** Operators can run the committed preflight script before any replay attempt.
- **owner_files:** `scripts/verify-staging.sh`, `docs/staging/SETUP_GUIDE.md`
- **status:** Resolved
- **resolution:** Phase 3 used the explicit Git Bash binary and the committed preflight completed successfully.

### Gap 2: `.env.staging` was missing and unsafe to infer implicitly

- **scenario:** baseline_snapshot
- **requirement_ids:** BILL-01, BILL-02, BILL-03
- **issue_class:** operator
- **observed_behavior:** No local `.env.staging` bridge existed for the committed helper flow.
- **expected_behavior:** Operators can load the required credentials from `.env.staging` without editing committed templates.
- **owner_files:** `.env.staging.example`, `docs/staging/SETUP_GUIDE.md`, `scripts/verify-staging.sh`
- **status:** Resolved
- **resolution:** A local non-committed `.env.staging` bridge was created from the approved runtime env and used for the completed Phase 3 proof.

### Gap 3: `psql` was unavailable on PATH

- **scenario:** baseline_snapshot
- **requirement_ids:** BILL-01, BILL-02, BILL-03
- **issue_class:** operator
- **observed_behavior:** Direct SQL snapshot commands could not run on this Windows machine.
- **expected_behavior:** Operators can capture `billing_checkouts`, `credit_accounts`, `user_quotas`, and `processed_events` through committed repo-local tooling.
- **owner_files:** `scripts/check-staging-billing-state.ts`, `scripts/verify-staging.sh`, `scripts/README.md`, `docs/staging/SETUP_GUIDE.md`
- **status:** Resolved
- **resolution:** Added a committed Supabase-admin fallback, reran preflight, and captured every live snapshot through the same helper flow.

### Gap 4: The live replay helper required `--value` for sends even when the scenario already had a committed default

- **scenario:** duplicate_delivery
- **requirement_ids:** BILL-01, BILL-02
- **issue_class:** code
- **observed_behavior:** Initial live replay attempts failed unless `--value` was passed explicitly.
- **expected_behavior:** Scenario-default payment values work in live mode the same way they already work in `--dry-run`.
- **owner_files:** `scripts/replay-staging-asaas.ts`
- **status:** Resolved
- **resolution:** The helper now falls back to the scenario default amount in live mode; a follow-up duplicate replay without `--value` returned `cached: true` successfully.
