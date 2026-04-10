# Phase 3 Staging Evidence Log

**Phase:** 03-billing-settlement-validation  
**Status:** passed  
**Last updated:** 2026-04-10T06:05:18Z

## Repo-local proof completed

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | Passed after adding the Supabase-admin fallback to the staging snapshot helper and the live-amount default to the replay helper. |
| `npm test -- src/lib/asaas/event-handlers.test.ts src/app/api/webhook/asaas/route.test.ts src/lib/asaas/credit-grants.test.ts src/lib/asaas/quota.test.ts src/app/api/checkout/route.test.ts` | PASS | Billing contract suite stayed green after the Phase 3 tooling updates. |
| `npx tsx scripts/replay-staging-asaas.ts --list-scenarios` | PASS | Seven named settlement scenarios remain committed and discoverable. |
| `npx tsx scripts/check-staging-billing-state.ts --help` | PASS | Snapshot helper exposes both the direct `psql` path and the Supabase-admin fallback. |

## Live target and operator flow

- **Target:** approved live production environment
- **Webhook endpoint:** `https://www.curria.com.br/api/webhook/asaas`
- **Database transport:** `supabase_admin`
- **Shell path:** `C:\Program Files\Git\bin\bash.exe`
- **Fixture user:** `usr_phase320260410a`

## Preflight

### Required proof path

- **Command:** `bash scripts/verify-staging.sh`
- **Result:** PASS
- **Notes:**
  - Git Bash executed the committed preflight successfully on Windows.
  - `psql` was unavailable, so the script used the committed Supabase-admin fallback for table and user checks.
  - API reachability returned HTTP `200`.

### Fixture-user healthcheck

- **Command:** `npx tsx scripts/check-staging-billing-state.ts --healthcheck --preflight-user usr_phase320260410a --env-file .env.staging`
- **Result:** PASS
- **Observed state:**
  - `billing_checkouts`: ok
  - `credit_accounts`: ok
  - `user_quotas`: ok
  - `processed_events`: ok
  - `user.exists`: `true`

## Baseline snapshot

- **Command:** `npx tsx scripts/check-staging-billing-state.ts --user usr_phase320260410a --env-file .env.staging`
- **Fixture setup:** cleared prior rows for the fixture user, inserted `users`, inserted `credit_accounts`, and inserted three `billing_checkouts` rows in `created`.
- **Initial state:**
  - `billing_checkouts`: `chkphase320260410unit`, `chkphase320260410inactive`, `chkphase320260410monthly` all `created`
  - `credit_accounts.runtime_balance`: `0`
  - `user_quotas.display_total`: not present yet
  - `processed_events`: empty

## Scenario matrix

### one_time_settlement

- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario one_time_settlement --checkout chkphase320260410unit --payment pay_phase320260410unit --value 19.9 --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true }`
- **Post-state:**
  - `billing_checkouts.status = 'paid'`
  - `billing_checkouts.asaas_payment_id = 'pay_phase320260410unit'`
  - `credit_accounts.runtime_balance = 3`
  - `user_quotas.display_total = 3`
  - `processed_events` contains one `PAYMENT_SETTLED` row for `pay_phase320260410unit`
- **Judgment:** `BILL-01 PASS`, `BILL-03 PASS`

### inactive_subscription_snapshot

- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario inactive_subscription_snapshot --checkout chkphase320260410inactive --subscription sub_phase320260410inactive --app-user usr_phase320260410a --value 39 --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true, "ignored": true }`
- **Contract note:** This scenario validated the long v1 shape `curria:v1:u:<user>:c:<checkout>` in live replay.
- **Post-state:**
  - `billing_checkouts.status = 'canceled'`
  - `credit_accounts.runtime_balance = 3`
  - `user_quotas.display_total = 3`
  - no new credit grant occurred
- **Judgment:** `BILL-01 PASS`, `BILL-03 PASS`

### initial_recurring_activation

- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario initial_recurring_activation --checkout chkphase320260410monthly --subscription sub_phase320260410live --payment pay_phase320260410start --value 39.9 --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true }`
- **Post-state:**
  - `billing_checkouts.status = 'subscription_active'`
  - `billing_checkouts.asaas_subscription_id = 'sub_phase320260410live'`
  - `credit_accounts.runtime_balance = 23`
  - `user_quotas.display_total = 23`
  - `user_quotas.asaas_subscription_id = 'sub_phase320260410live'`
  - `processed_events` contains `SUBSCRIPTION_STARTED`
- **Interpretation:** The live contract preserved the 3 existing one-time credits and added the monthly allocation, so `display_total` stayed aligned with `runtime_balance`.
- **Judgment:** `BILL-01 PASS`, `BILL-03 PASS`

### renewal_replace_balance

- **Fixture adjustment before replay:** set both `credit_accounts.runtime_balance` and `user_quotas.display_total` to `7` to simulate mid-cycle usage.
- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario renewal_replace_balance --checkout chkphase320260410monthly --subscription sub_phase320260410live --payment pay_phase320260410renew --value 39.9 --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true }`
- **Post-state:**
  - `credit_accounts.runtime_balance = 20`
  - `user_quotas.display_total = 20`
  - `processed_events` contains `SUBSCRIPTION_RENEWED`
  - `billing_checkouts.status` remained `subscription_active`
- **Interpretation:** Renewal replaced the simulated `7` balance with the monthly allocation instead of stacking on top.
- **Judgment:** `BILL-01 PASS`, `BILL-03 PASS`

### cancellation_metadata_only

- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario cancellation_metadata_only --subscription sub_phase320260410live --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true }`
- **Post-state:**
  - `user_quotas.status = 'canceled'`
  - `user_quotas.renews_at = NULL`
  - `billing_checkouts.status = 'canceled'`
  - `credit_accounts.runtime_balance = 20`
  - `user_quotas.display_total = 20`
- **Judgment:** `BILL-01 PASS`, `BILL-03 PASS`

### duplicate_delivery

- **Replay command 1:** `npx tsx scripts/replay-staging-asaas.ts --scenario duplicate_delivery --checkout chkphase320260410unit --payment pay_phase320260410unit --value 19.9 --env-file .env.staging`
- **Replay command 2:** `npx tsx scripts/replay-staging-asaas.ts --scenario duplicate_delivery --checkout chkphase320260410unit --payment pay_phase320260410unit --event PAYMENT_CONFIRMED --value 19.9 --env-file .env.staging`
- **Replay command 3:** `npx tsx scripts/replay-staging-asaas.ts --scenario duplicate_delivery --checkout chkphase320260410unit --payment pay_phase320260410unit --env-file .env.staging`
- **Responses:** all three returned HTTP `200` with `{ "success": true, "cached": true }`
- **Post-state:**
  - `credit_accounts.runtime_balance` stayed `20`
  - `user_quotas.display_total` stayed `20`
  - `billing_checkouts.status` stayed `paid`
  - `processed_events` still contains only the original `PAYMENT_SETTLED` row for `pay_phase320260410unit`
- **Interpretation:** Both same-payload replay and `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` cross-event replay stayed idempotent.
- **Judgment:** `BILL-02 PASS`, `BILL-03 PASS`

### partial_success_reconcile

- **Fixture adjustment before replay:** manually set `billing_checkouts.status = 'created'` and cleared `asaas_payment_id` for `chkphase320260410unit` while leaving the existing `PAYMENT_SETTLED` row intact.
- **Replay command:** `npx tsx scripts/replay-staging-asaas.ts --scenario partial_success_reconcile --checkout chkphase320260410unit --payment pay_phase320260410unit --value 19.9 --env-file .env.staging`
- **Response:** HTTP `200` with `{ "success": true, "cached": true }`
- **Post-state:**
  - `billing_checkouts.status` reconciled back to `paid`
  - `billing_checkouts.asaas_payment_id = 'pay_phase320260410unit'`
  - `credit_accounts.runtime_balance` stayed `20`
  - `user_quotas.display_total` stayed `20`
  - no second `PAYMENT_SETTLED` row appeared
- **Judgment:** `BILL-01 PASS`, `BILL-02 PASS`, `BILL-03 PASS`

## Requirement verdict

| Requirement | Status | Evidence |
|---|---|---|
| `BILL-01` | PASS | One-time settlement, inactive snapshot, initial activation, renewal, cancellation, and partial-success replay all behaved according to the live contract. |
| `BILL-02` | PASS | Duplicate replay returned `cached: true`, left balances unchanged, and did not create a second authoritative processed event. |
| `BILL-03` | PASS | Every validated mutation kept `credit_accounts.runtime_balance` aligned with `user_quotas.display_total`. |

## Operator notes

- Phase 3 ran against the approved live environment because there were no end users and the user explicitly authorized that target.
- The workstation used the committed Supabase-admin fallback instead of `psql`.
- The replay helper was tightened after live execution so scenario-default amounts now work in live mode, not just `--dry-run`.
