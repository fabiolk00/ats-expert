# Staging Validation Plan for Asaas Billing

This plan validates the current settlement-based billing contract in staging.

## Preconditions

Before running scenarios:

1. Deploy the latest billing code.
2. Fill `.env.staging` from `.env.staging.example`.
3. Apply the current billing migrations:
   - `billing_webhook_hardening.sql`
   - `20260406_align_asaas_webhook_contract.sql`
   - `20260406_fix_billing_checkout_timestamp_defaults.sql`
   - `20260407_persist_billing_display_totals.sql`
   - `20260407_harden_text_id_generation.sql`
   - `20260407_harden_standard_timestamps.sql`
4. Run the preflight script:

```bash
bash scripts/verify-staging.sh
```

5. Confirm the staging test user exists, for example `usr_staging_001`.

## Proof set

### Repo-local proof

```bash
npm run typecheck
npm test
```

### Live staging proof

```bash
bash scripts/verify-staging.sh
```

## Scenario 1: One-time settlement

Goal: credits move only after a settled payment event.

Expected path:

1. Create a checkout for `plan = unit`.
2. Confirm `billing_checkouts.status = 'created'`.
3. Send `PAYMENT_CONFIRMED` or `PAYMENT_RECEIVED`.
4. Verify:
   - credits change once
   - checkout becomes `paid`
   - `processed_events.event_type = 'PAYMENT_SETTLED'`
   - `user_quotas.credits_remaining >= credit_accounts.credits_remaining`
5. Replay with `payment.externalReference = null` and `payment.checkoutSession = <checkout_session_id>` and verify the same checkout still settles exactly once.

## Scenario 2: Invalid subscription snapshot is ignored

Goal: inactive or deleted snapshots never grant credits.

Send a `SUBSCRIPTION_CREATED` payload with `status = 'INACTIVE'` and `deleted = true`.

Verify:

- response is `200`
- response body contains `ignored: true`
- no credit change occurs
- any referenced pending recurring checkout may become `canceled`

## Scenario 3: Initial recurring activation from settlement

Goal: the first paid subscription cycle activates from a settled payment, not from `SUBSCRIPTION_CREATED`.

Expected path:

1. Create a checkout for `plan = monthly` or `plan = pro`.
2. Confirm the row is `created`.
3. Send a settled payment event with `payment.subscription` present.
4. Verify:
   - checkout becomes `subscription_active`
   - `user_quotas.asaas_subscription_id` is set
   - `processed_events.event_type = 'SUBSCRIPTION_STARTED'`
   - the displayed plan total is at least the runtime balance

## Scenario 4: Renewal replaces balance

Goal: renewals replace the previous cycle balance once.

Expected path:

1. Start from an active recurring subscription.
2. Send a new settled payment for the same `payment.subscription`, or replay legacy `SUBSCRIPTION_RENEWED`.
3. Verify:
   - the balance becomes exactly the plan allocation
   - the previous cycle remainder is not added on top
   - `processed_events.event_type = 'SUBSCRIPTION_RENEWED'`

## Scenario 5: Cancellation updates metadata only

Goal: cancellation preserves credits and updates metadata.

Send one of:

- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`
- legacy `SUBSCRIPTION_CANCELED`

Verify:

- `user_quotas.status = 'canceled'`
- `user_quotas.renews_at = NULL`
- credits stay unchanged
- `processed_events.event_type = 'SUBSCRIPTION_CANCELED'`

## Scenario 6: Duplicate delivery

Goal: the same economic event never grants credits twice.

Verify:

- replaying the same payment payload twice changes credits once
- replaying both `PAYMENT_CONFIRMED` and `PAYMENT_RECEIVED` for the same payment still changes credits once

## Scenario 7: Partial-success reconciliation

Goal: a duplicate replay can repair stale checkout state without re-granting credits.

Verify:

- if the economic mutation already exists but checkout status is stale, a replay does not grant credits again
- checkout status converges after reconciliation

## Final checks

### Internal processed event names

```sql
SELECT event_type, COUNT(*) AS count
FROM processed_events
GROUP BY event_type
ORDER BY event_type;
```

Expected values include:

- `PAYMENT_SETTLED`
- `SUBSCRIPTION_STARTED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_CANCELED`

### Stale recurring checkouts

```sql
SELECT *
FROM billing_checkouts
WHERE status = 'created'
  AND plan IN ('monthly', 'pro')
  AND created_at < NOW() - INTERVAL '1 hour';
```

Expected: zero rows, or only rows currently under investigation.
