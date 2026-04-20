# Billing Ops Runbook

This runbook covers diagnosis and recovery for the current Asaas billing flow.

## Current semantics

- One-time credit grants come from settled payment webhooks.
- Initial recurring activation comes from the first settled payment that carries `payment.subscription`.
- Renewals come from settled payments or the legacy `SUBSCRIPTION_RENEWED` compatibility path.
- `SUBSCRIPTION_CREATED` is informational only.
- Cancellations and inactivations update metadata only and do not revoke credits.
- Resume export billing now uses `credit_reservations` plus `credit_ledger_entries` instead of relying only on `resume_generations`.
- Export jobs expose reservation stages through the existing job and file polling routes:
  - `reserve_credit`
  - `render_artifact`
  - `finalize_credit`
  - `release_credit`
  - `needs_reconciliation`

## Phase 17 operator entrypoint

Before ad hoc SQL or manual webhook replay, start with the committed billing proof path:

```bash
bash scripts/verify-staging.sh
npx tsx scripts/replay-staging-asaas.ts --list-scenarios
npx tsx scripts/check-staging-billing-state.ts --help
npx tsx scripts/stress-export-generation.ts --help
```

Prerequisites:

- Bash from WSL, Git Bash, or another POSIX shell
- `npx`
- a real `curl` binary in that shell
- `.env.staging` copied from `.env.staging.example`
- one database access path:
  - `psql` plus `STAGING_DB_URL`
  - or `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`

For export-specific proof, the repo-native path is:

```bash
npx tsx scripts/stress-export-generation.ts --url <staging-url> --session-id <session_id> --cookie "<cookie>" --requests 6 --concurrency 3 --format markdown
npx tsx scripts/check-staging-billing-state.ts --session <session_id>
```

Safe outcomes:

- repeated `202` responses that collapse onto one durable job id
- `200` when the artifact already exists
- `409 BILLING_RECONCILIATION_PENDING` when a previous failed export is still settling billing

Phase 17 also needs to validate the live trust-anchor shape. Current production intent is `curria:v1:c:<checkoutReference>`, while the parser still accepts the older `curria:v1:u:<appUserId>:c:<checkoutReference>` format for compatibility. Use the replay helper with or without `--app-user` only to prove which shape staging still receives; do not emit new checkout links in the legacy format.

## Quick health check

```sql
SELECT
  (SELECT COUNT(*) FROM processed_events
    WHERE created_at > NOW() - INTERVAL '1 hour') AS webhook_events_last_hour,
  (SELECT COUNT(*) FROM billing_checkouts
    WHERE status = 'failed') AS failed_checkouts,
  (SELECT COUNT(*) FROM billing_checkouts
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '30 minutes') AS stale_pending_checkouts,
  (SELECT COUNT(*) FROM billing_checkouts
    WHERE status = 'created'
      AND created_at < NOW() - INTERVAL '1 hour') AS stale_created_checkouts;
```

## 1. User says they paid but have no credits

### Check recent billing events

```sql
SELECT event_type, processed_at, event_payload
FROM processed_events
WHERE COALESCE(
  event_payload->'payment'->>'externalReference',
  event_payload->'subscription'->>'externalReference'
) IS NOT NULL
ORDER BY processed_at DESC
LIMIT 20;
```

### Check user state

```sql
SELECT * FROM credit_accounts WHERE user_id = '<user_id>';

SELECT * FROM billing_checkouts
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;

SELECT * FROM user_quotas
WHERE user_id = '<user_id>';
```

### What to expect

- one-time success: `billing_checkouts.status = 'paid'`
- recurring activation success: `billing_checkouts.status = 'subscription_active'`
- `processed_events.event_type` should be one of:
  - `PAYMENT_SETTLED`
  - `SUBSCRIPTION_STARTED`
  - `SUBSCRIPTION_RENEWED`
- some current Asaas one-time payloads arrive with:
  - `payment.externalReference = null`
  - `payment.checkoutSession = <session_id>`
  - this is valid in the current CurrIA handler

### Recovery

- If no processed row exists yet and the original payload contains `checkoutSession`, replay the original webhook as-is. Do not invent a synthetic `externalReference`.
- If credits were granted but checkout status is still `created`, update the checkout manually after confirming the provider object:

```sql
UPDATE billing_checkouts
SET status = 'paid',
    asaas_payment_id = '<payment_id>',
    updated_at = NOW()
WHERE checkout_reference = '<checkout_reference>';
```

Or for recurring activation:

```sql
UPDATE billing_checkouts
SET status = 'subscription_active',
    asaas_subscription_id = '<subscription_id>',
    updated_at = NOW()
WHERE checkout_reference = '<checkout_reference>';
```

## 2. Recurring activation never happened

This usually means the checkout exists, but the first settled payment never reconciled.

```sql
SELECT *
FROM billing_checkouts
WHERE plan IN ('monthly', 'pro')
  AND status = 'created'
ORDER BY created_at DESC;
```

### Interpret the state

- If the checkout is still `created` and there is no `processed_events` row, the first payment likely never settled.
- If the checkout is `canceled`, the subscription snapshot probably arrived inactive/deleted and was safely ignored.
- If `user_quotas.asaas_subscription_id` exists but the checkout is still `created`, reconcile it manually.

## 3. Checkout creation fails with Asaas validation errors

Typical symptoms:

- `cpfCnpj deve ser informado`
- `phone deve ser informado`
- `postalCode é inválido`
- provider rejects recurring checkouts that omit full address data

### Checks

- confirm the request body contains normalized billing data
- confirm the outgoing Asaas payload uses:
  - `customerData.phone`
  - not `customerData.phoneNumber`
- confirm phone is 11 digits and CEP is 8 digits before the provider call

### Recovery

- retry checkout only after the normalized billing fields are fixed
- if recurring checkout was built without full customer data, deploy the current checkout payload contract before retrying

## 4. Renewal did not replace credits

### Check the renewal event type

```sql
SELECT event_type, processed_at, event_payload
FROM processed_events
WHERE event_type = 'SUBSCRIPTION_RENEWED'
   OR (
     event_type = 'PAYMENT_SETTLED'
     AND event_payload->'payment'->>'subscription' = '<subscription_id>'
   )
ORDER BY processed_at DESC;
```

### Expected behavior

- renewals must replace the balance, not add to it
- the DB event should be `SUBSCRIPTION_RENEWED`, or a settled payment interpreted as renewal by the handler

### Recovery

If the user was additive-credited incorrectly before this fix, correct the balance manually and note the adjustment in the support trail.

## 5. Dashboard shows the wrong total credits

Symptom examples:

- `4 / 3`
- preserved credits are correct in the numerator, but the denominator still shows the base plan allocation

### Check

```sql
SELECT quota.user_id, quota.plan, quota.credits_remaining AS display_total, account.credits_remaining AS runtime_balance
FROM user_quotas AS quota
JOIN credit_accounts AS account ON account.user_id = quota.user_id
WHERE quota.user_id = '<user_id>';
```

Expected:

- `display_total >= runtime_balance`
- for carryover scenarios, `display_total` may be greater than the base plan credits

### Recovery

- apply `20260407_persist_billing_display_totals.sql`
- refresh the dashboard after deploy

## 6. Cancellation should not revoke credits

### Check metadata-only updates

```sql
SELECT * FROM user_quotas
WHERE asaas_subscription_id = '<subscription_id>';

SELECT * FROM billing_checkouts
WHERE asaas_subscription_id = '<subscription_id>';
```

Expected:

- `user_quotas.status = 'canceled'`
- `user_quotas.renews_at = NULL`
- checkout may be `canceled`
- `credit_accounts.credits_remaining` unchanged

## 7. Duplicate webhook delivery

### Expected behavior

- route may answer `cached: true`
- no second economic mutation should happen
- duplicate replay may still reconcile a stale checkout status

### Check

```sql
SELECT event_fingerprint, event_type, COUNT(*) AS count
FROM processed_events
GROUP BY event_fingerprint, event_type
HAVING COUNT(*) > 1;
```

Expected: zero rows.

## 8. Resume generation replay or duplicate-charge incident

### What should be true

- identical logical replay should return the existing `resume_generations` row with `creditsUsed = 0`
- an in-flight replay should return `inProgress = true`
- a failed generation replay by the same idempotency key should surface the previous failure instead of charging again
- `credit_consumptions` must contain at most one spend row per successful `resume_generations.id`

### Checks

```sql
SELECT id, session_id, resume_target_id, type, status, idempotency_key, output_pdf_path, created_at, updated_at
FROM resume_generations
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT generation_id, user_id, credits_used, created_at
FROM credit_consumptions
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 20;
```

### Recovery

- if two `credit_consumptions` rows point to the same logical generation intent, escalate to engineering immediately
- if `resume_generations.status = 'failed'` after file rendering but before credit finalization, verify whether a PDF path was created and avoid replaying blindly
- if the user retries with the same client request id and still sees a new charge, capture the duplicated `idempotency_key`, `generation_id`, and affected `credit_consumptions` rows before any manual refund

## 9. Export reservation stuck in `reserved` or `needs_reconciliation`

### Checks

```sql
SELECT id, user_id, generation_intent_key, status, reconciliation_status, job_id, session_id, resume_target_id, resume_generation_id, failure_reason, updated_at
FROM credit_reservations
WHERE status IN ('reserved', 'needs_reconciliation')
ORDER BY updated_at DESC;
```

```sql
SELECT generation_intent_key, entry_type, credits_delta, balance_after, job_id, session_id, resume_target_id, resume_generation_id, created_at
FROM credit_ledger_entries
WHERE generation_intent_key = '<generation_intent_key>'
ORDER BY created_at ASC;
```

```sql
SELECT id, user_id, session_id, resume_target_id, status, stage, completed_at, terminal_error_ref, terminal_result_ref
FROM jobs
WHERE id = '<job_id>';
```

### Interpret the state

- `status = 'reserved'` plus `jobs.status IN ('failed', 'cancelled')`:
  the hold should be released.
- `status = 'reserved'` plus `jobs.status = 'completed'` and the session or target artifact is ready:
  the hold should be finalized.
- `status = 'needs_reconciliation'` plus `reconciliation_status = 'manual_review'`:
  evidence was ambiguous; do not force a balance mutation until engineering confirms the real artifact outcome.

### Recovery

- Preferred path: run the repo-native reconciliation routine so the repair is repeatable and logged.
- Capture a committed evidence pair before and after repair:

```bash
npx tsx scripts/check-staging-billing-state.ts --session <session_id>
npx tsx scripts/stress-export-generation.ts --url <staging-url> --session-id <session_id> --cookie "<cookie>" --requests 4 --concurrency 2 --format markdown
```

- After automatic repair, verify that:
  - the reservation is now `released` or `finalized`
  - `reconciliation_status = 'repaired'`
  - exactly one matching `reservation_release` or `reservation_finalize` ledger entry exists for the intent
- If the reservation is flagged `manual_review`, capture:
  - `generation_intent_key`
  - `job_id`
  - session or target artifact metadata
  - the full ledger trail
  and escalate to engineering.

## 10. Artifact ready but billing still needs reconciliation

### What users and operators will see

- `/api/file/[sessionId]` can return `available = true`, `generationStatus = 'ready'`, and `stage = 'needs_reconciliation'`.
- The current dashboard documents panel keeps the PDF available and shows a reconciliation notice instead of blocking access to the file.
- `/api/jobs/[jobId]` keeps the canonical job DTO and surfaces `stage = 'needs_reconciliation'` for artifact jobs.

### Checks

```sql
SELECT id, generated_output
FROM sessions
WHERE id = '<session_id>';
```

If this was a target export:

```sql
SELECT id, generated_output
FROM resume_targets
WHERE id = '<resume_target_id>';
```

### Recovery

- If the artifact is present and valid, do not revoke access just because billing is in reconciliation.
- Repair the reservation first, then confirm the job stage leaves `needs_reconciliation`.

## 11. Pre-cutover legacy subscription issue

Legacy recurring flows still resolve by `user_quotas.asaas_subscription_id`.

```sql
SELECT *
FROM user_quotas
WHERE asaas_subscription_id = '<subscription_id>';
```

If the row is missing or malformed:

- backfill `asaas_subscription_id`
- confirm the plan is correct
- then replay the renewal webhook

## 12. Manual webhook replay

Use the original webhook payload whenever possible. When you are following the committed Phase 3 proof path, prefer the replay helper over hand-crafted curl commands so the evidence stays repeatable.

```bash
npx tsx scripts/replay-staging-asaas.ts --scenario one_time_settlement --checkout <checkout_reference> --payment <payment_id> [--app-user <user_id>]
```

Expected outcomes:

- `200 { "success": true }`
- `200 { "success": true, "cached": true }`
- `200 { "success": true, "ignored": true }`

If you get `400`, compare the payload to:

- `billing_checkouts`
- `user_quotas`
- current trust-anchor rules in [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- for one-time events with `externalReference = null`, also compare `payment.checkoutSession` to `billing_checkouts.asaas_link`

For evidence capture, pair every replay with:

```bash
npx tsx scripts/check-staging-billing-state.ts --checkout <checkout_reference>
```

## Billing invariant checklist

- `billing_checkouts` is the trust anchor for new paid checkout settlement and initial recurring activation
- `processed_events` must dedupe economic webhook mutations
- `credit_accounts` is the authoritative runtime balance
- `user_quotas` is metadata plus UI display state, not the spend authority
- `resume_generations` describe export history, but `credit_reservations` plus `credit_ledger_entries` are the reservation and audit truth for export billing
- paid artifact ownership checks are necessary but not sufficient; billing replay safety depends on generation state and credit mutation state together

## Phase 46 worker operations

- Web/API nodes should run with `APP_RUNTIME_ROLE=web`.
- Export workers should run with `APP_RUNTIME_ROLE=worker` and `npm run jobs:worker`.
- Recommended starting point:
  - `EXPORT_GENERATION_MAX_CONCURRENCY=3`
  - `EXPORT_GENERATION_MAX_PER_USER=1`
  - `EXPORT_GENERATION_TIMEOUT_MS=90000`
  - `EXPORT_GENERATION_RETRY_DELAYS_MS=10000,30000,120000`
- If export traffic rises while web latency is healthy, scale worker nodes first.
- If queued export jobs rise while `runningJobs = 0`, check worker role env, worker logs, and DB pool exhaustion before changing concurrency.

## Escalate to engineering when

- duplicate grants are observed
- duplicate billable generations are observed for the same `idempotency_key`
- `processed_events` still stores old event names like `PAYMENT_RECEIVED`
- checkout status cannot be reconciled from authoritative Asaas data
- trust-anchor validation fails for apparently valid current-state rows
