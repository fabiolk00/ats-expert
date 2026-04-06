# Production Readiness Checklist

Status: billing webhook contract updated for settlement-based processing.

## Required before deploy

- [ ] Latest billing code deployed
- [ ] `billing_webhook_hardening.sql` applied
- [ ] `20260406_align_asaas_webhook_contract.sql` applied
- [ ] `20260406_fix_billing_checkout_timestamp_defaults.sql` applied
- [ ] Old overload of `apply_billing_credit_grant_event` removed
- [ ] Focused billing tests passing
- [ ] Typecheck passing

## Runtime behavior to confirm

- [ ] One-time purchases grant credits from settled payments only
- [ ] Initial recurring activation comes from settled payment with `payment.subscription`
- [ ] `SUBSCRIPTION_CREATED` invalid snapshots return `200 ignored`
- [ ] Renewals replace balance, not add to it
- [ ] Cancellations preserve credits
- [ ] Duplicate `PAYMENT_CONFIRMED` and `PAYMENT_RECEIVED` do not double-grant
- [ ] `processed_events` stores internal event types, not old raw names

## DB verification

### Function signatures

```sql
SELECT
  p.proname AS routine_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'apply_billing_credit_grant_event',
    'apply_billing_subscription_metadata_event'
  )
ORDER BY p.proname, args;
```

Expected:

- one `apply_billing_credit_grant_event` with `p_is_renewal boolean`
- one `apply_billing_subscription_metadata_event`

### Processed event types

```sql
SELECT event_type, COUNT(*) AS count
FROM processed_events
GROUP BY event_type
ORDER BY event_type;
```

Expected new values include:

- `PAYMENT_SETTLED`
- `SUBSCRIPTION_STARTED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_CANCELED`

## Linked docs

- [billing/IMPLEMENTATION.md](./billing/IMPLEMENTATION.md)
- [billing/MIGRATION_GUIDE.md](./billing/MIGRATION_GUIDE.md)
- [billing/MONITORING.md](./billing/MONITORING.md)
- [billing/OPS_RUNBOOK.md](./billing/OPS_RUNBOOK.md)
- [staging/VALIDATION_PLAN.md](./staging/VALIDATION_PLAN.md)
- [staging/VALIDATION_AGENT_PROMPT.md](./staging/VALIDATION_AGENT_PROMPT.md)
