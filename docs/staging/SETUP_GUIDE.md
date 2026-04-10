# Staging Environment Setup Guide

This guide prepares the staging environment used by the billing validation scenarios in [VALIDATION_PLAN.md](./VALIDATION_PLAN.md).

## 1. Start from the committed template

Create the local staging file from the committed example:

```bash
cp .env.staging.example .env.staging
```

Required values in `.env.staging`:

- `STAGING_DB_URL`
- `STAGING_API_URL`
- `STAGING_ASAAS_WEBHOOK_TOKEN`
- `STAGING_ASAAS_ACCESS_TOKEN`

Optional diagnostics:

- `STAGING_LOG_LEVEL`
- `STAGING_ENABLE_DETAILED_LOGGING`

Runtime deploy variables for the application itself should still come from `.env.example` and the hosting provider dashboard.

## 2. Apply the current billing migrations

Run these migrations against the staging database in this order:

```bash
npx prisma db execute --file prisma/migrations/billing_webhook_hardening.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260406_align_asaas_webhook_contract.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260406_fix_billing_checkout_timestamp_defaults.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260407_persist_billing_display_totals.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260407_harden_text_id_generation.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260407_harden_standard_timestamps.sql --schema prisma/schema.prisma
```

These migrations are required for the current settlement-based billing contract and the Phase 1 hardening checks.

## 3. Run the preflight script before any billing scenario

The staging readiness script is the first operator step after filling `.env.staging`:

```bash
bash scripts/verify-staging.sh
```

The script validates:

- `.env.staging` exists and came from `.env.staging.example`
- required staging vars are populated
- staging database connectivity works
- current billing tables and RPC functions exist
- staging API is reachable
- the staging test user is present

Do not start webhook or billing scenario testing until this script exits successfully.

## 4. Prepare the staging test user

Use a clean test user before replaying events:

```sql
DELETE FROM billing_checkouts WHERE user_id = 'usr_staging_001';
DELETE FROM credit_accounts WHERE user_id = 'usr_staging_001';
DELETE FROM user_quotas WHERE user_id = 'usr_staging_001';
DELETE FROM users WHERE id = 'usr_staging_001';

INSERT INTO users (id, email, created_at, updated_at)
VALUES ('usr_staging_001', 'staging-test@curria.test', NOW(), NOW());

INSERT INTO credit_accounts (id, user_id, credits_remaining, created_at, updated_at)
VALUES ('cred_staging_001', 'usr_staging_001', 5, NOW(), NOW());
```

## 5. Execute the validation scenarios

After the preflight passes, follow the scenarios in [VALIDATION_PLAN.md](./VALIDATION_PLAN.md).

Use the staging env file for any local shell session that needs the credentials:

```bash
set -a
source .env.staging
set +a
```

## Troubleshooting

If `bash scripts/verify-staging.sh` fails:

- confirm `.env.staging` was copied from `.env.staging.example`
- re-check `STAGING_ASAAS_WEBHOOK_TOKEN` and `STAGING_ASAAS_ACCESS_TOKEN`
- confirm all six billing migrations above were applied to the staging database
- verify `STAGING_API_URL` points at the deployed staging environment

## Related docs

- [VALIDATION_PLAN.md](./VALIDATION_PLAN.md)
- [../PRODUCTION-READINESS-CHECKLIST.md](../PRODUCTION-READINESS-CHECKLIST.md)
- [../../.env.staging.example](../../.env.staging.example)
