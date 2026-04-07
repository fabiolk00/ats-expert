# Staging Validation Plan for Asaas Billing

This document defines the current staging validation flow for the settlement-based billing contract.

## Preconditions

Before running scenarios:

1. Deploy the latest billing code.
2. Apply:
   - `billing_webhook_hardening.sql`
   - `20260406_align_asaas_webhook_contract.sql`
   - `20260407_persist_billing_display_totals.sql`
3. Ensure a staging user exists, for example `usr_staging_001`.
4. Confirm the webhook token is configured.

## Scenario 1: One-time payment settlement

### Goal

Validate that a one-time checkout grants credits only from a settled payment event.

### Expected path

1. create checkout for `plan = unit`
2. confirm `billing_checkouts.status = 'created'`
3. send `PAYMENT_CONFIRMED` or `PAYMENT_RECEIVED`
4. verify:
   - credits increase once
   - `user_quotas.credits_remaining >= credit_accounts.credits_remaining`
   - checkout becomes `paid`
   - `processed_events.event_type = 'PAYMENT_SETTLED'`
5. repeat with a payload where:
   - `payment.externalReference = null`
   - `payment.checkoutSession = <checkout_session_id>`
   - verify the same one-time checkout still settles exactly once

## Scenario 2: Invalid subscription snapshot is ignored

### Goal

Validate that a `SUBSCRIPTION_CREATED` snapshot with inactive/deleted state does not grant credits and does not pause the queue.

### Send

```json
{
  "event": "SUBSCRIPTION_CREATED",
  "subscription": {
    "id": "sub_staging_invalid",
    "externalReference": "curria:v1:c:<checkout_reference>",
    "status": "INACTIVE",
    "deleted": true,
    "value": 39
  }
}
```

### Verify

- response is `200`
- response body contains `ignored: true`
- no credit change occurs
- recurring checkout may become `canceled`

## Scenario 3: Initial recurring activation from settlement

### Goal

Validate that the first recurring payment activates the subscription.

### Expected path

1. create checkout for `plan = monthly` or `plan = pro`
2. confirm checkout is `created`
3. send a settled payment event with:
   - `payment.subscription` present
   - v1 `externalReference`
4. verify:
   - credits increase additively
   - `user_quotas.credits_remaining` reflects the full display total for the current cycle
   - `user_quotas.asaas_subscription_id` is set
   - checkout becomes `subscription_active`
   - `processed_events.event_type = 'SUBSCRIPTION_STARTED'`

## Scenario 4: Renewal replaces balance

### Goal

Validate that renewal uses replacement logic, not additive logic.

### Expected path

1. start from an active recurring subscription
2. set a non-zero balance manually if needed
3. send:
   - a new settled payment for the same `payment.subscription`
   - or legacy `SUBSCRIPTION_RENEWED`
4. verify:
   - balance becomes exactly the plan allocation
   - not previous balance plus allocation
   - `processed_events.event_type = 'SUBSCRIPTION_RENEWED'`

## Scenario 5: Cancellation updates metadata only

### Goal

Validate that cancellation preserves credits.

### Send

- `SUBSCRIPTION_INACTIVATED`
- or `SUBSCRIPTION_DELETED`
- or legacy `SUBSCRIPTION_CANCELED`

### Verify

- `user_quotas.status = 'canceled'`
- `user_quotas.renews_at = NULL`
- credits unchanged
- checkout may be marked `canceled`
- `processed_events.event_type = 'SUBSCRIPTION_CANCELED'`

## Scenario 6: Duplicate delivery

### Goal

Validate that the same economic event is never granted twice.

### Verify

- sending the same payment payload twice returns one economic mutation only
- if you replay both `PAYMENT_CONFIRMED` and `PAYMENT_RECEIVED` for the same payment, credits still change once

## Scenario 7: Partial-success reconciliation

### Goal

Validate that a duplicate replay can reconcile checkout status after the event was already processed.

### Verify

- if the economic mutation already exists but checkout status is stale, a replay should not regrant credits
- checkout status should converge after reconciliation

## Final queries

### Confirm internal DB event types

```sql
SELECT event_type, COUNT(*) AS count
FROM processed_events
GROUP BY event_type
ORDER BY event_type;
```

Expected current values:

- `PAYMENT_SETTLED`
- `SUBSCRIPTION_STARTED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_CANCELED`

### Confirm stale recurring rows do not accumulate

```sql
SELECT *
FROM billing_checkouts
WHERE status = 'created'
  AND plan IN ('monthly', 'pro')
  AND created_at < NOW() - INTERVAL '1 hour';
```

Expected: zero rows or only rows under active investigation.
