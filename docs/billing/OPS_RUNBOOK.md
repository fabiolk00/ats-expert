# Billing Ops Runbook

This runbook covers diagnosis and recovery for the current Asaas billing flow.

## Current semantics

- One-time credit grants come from settled payment webhooks.
- Initial recurring activation comes from the first settled payment that carries `payment.subscription`.
- Renewals come from settled payments or the legacy `SUBSCRIPTION_RENEWED` compatibility path.
- `SUBSCRIPTION_CREATED` is informational only.
- Cancellations and inactivations update metadata only and do not revoke credits.

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

### Recovery

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

## 3. Renewal did not replace credits

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

## 4. Cancellation should not revoke credits

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

## 5. Duplicate webhook delivery

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

## 6. Pre-cutover legacy subscription issue

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

## 7. Manual webhook replay

Use the original webhook payload whenever possible.

```bash
curl -X POST https://curria.app/api/webhook/asaas \
  -H "asaas-access-token: $ASAAS_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '<original_payload_json>'
```

Expected outcomes:

- `200 { "success": true }`
- `200 { "success": true, "cached": true }`
- `200 { "success": true, "ignored": true }`

If you get `400`, compare the payload to:

- `billing_checkouts`
- `user_quotas`
- current trust-anchor rules in [IMPLEMENTATION.md](./IMPLEMENTATION.md)

## Escalate to engineering when

- duplicate grants are observed
- `processed_events` still stores old event names like `PAYMENT_RECEIVED`
- checkout status cannot be reconciled from authoritative Asaas data
- trust-anchor validation fails for apparently valid current-state rows
