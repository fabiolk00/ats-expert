#!/bin/bash

set -euo pipefail

ENV_TEMPLATE=".env.staging.example"
ENV_FILE=".env.staging"
REQUIRED_MIGRATIONS=(
  "prisma/migrations/billing_webhook_hardening.sql"
  "prisma/migrations/20260406_align_asaas_webhook_contract.sql"
  "prisma/migrations/20260406_fix_billing_checkout_timestamp_defaults.sql"
  "prisma/migrations/20260407_persist_billing_display_totals.sql"
  "prisma/migrations/20260407_harden_text_id_generation.sql"
  "prisma/migrations/20260407_harden_standard_timestamps.sql"
)

echo "======================================================================"
echo "  Staging Environment Verification"
echo "======================================================================"
echo ""

REQUIRED_COMMANDS=(
  "psql"
  "curl"
)

echo "Checking required shell tools..."
echo ""

for command_name in "${REQUIRED_COMMANDS[@]}"; do
  if command -v "$command_name" > /dev/null 2>&1; then
    echo "Found: $command_name"
  else
    echo "Missing required command: $command_name"
    echo "Install it first, then rerun this script from Bash (WSL, Git Bash, or another POSIX shell)."
    exit 1
  fi
done

echo ""

if [ ! -f "$ENV_FILE" ]; then
  echo "FATAL: $ENV_FILE not found."
  echo ""
  echo "Create it from the committed template first:"
  echo "  cp $ENV_TEMPLATE $ENV_FILE"
  echo "  # Then edit $ENV_FILE with your staging credentials"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "Checking required staging environment variables..."
echo ""

REQUIRED_VARS=(
  "STAGING_DB_URL"
  "STAGING_API_URL"
  "STAGING_ASAAS_WEBHOOK_TOKEN"
  "STAGING_ASAAS_ACCESS_TOKEN"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Missing: $var"
    MISSING_VARS=$((MISSING_VARS + 1))
  else
    echo "Set: $var"
  fi
done

if [ "$MISSING_VARS" -gt 0 ]; then
  echo ""
  echo "$MISSING_VARS required staging variables are missing."
  echo "Update $ENV_FILE so it matches $ENV_TEMPLATE."
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Database Connectivity Check"
echo "======================================================================"
echo ""

if psql "$STAGING_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "Database is reachable."
else
  echo "Cannot connect to the staging database."
  echo "Check STAGING_DB_URL and verify the database is reachable from this machine."
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Database Schema Check"
echo "======================================================================"
echo ""

TABLES_FOUND=$(psql "$STAGING_DB_URL" -t -A -c "
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('billing_checkouts', 'credit_accounts', 'user_quotas', 'processed_events');
")

if [ "$TABLES_FOUND" = "4" ]; then
  echo "Billing tables exist (4/4)."
else
  echo "Expected billing tables are missing ($TABLES_FOUND/4 found)."
  echo "Apply the current billing migrations before retrying:"
  for migration in "${REQUIRED_MIGRATIONS[@]}"; do
    echo "  - $migration"
  done
  exit 1
fi

RPC_COUNT=$(psql "$STAGING_DB_URL" -t -A -c "
  SELECT COUNT(*) FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('apply_billing_credit_grant_event', 'apply_billing_subscription_metadata_event');
")

if [ "$RPC_COUNT" = "2" ]; then
  echo "Billing RPC functions exist (2/2)."
else
  echo "Billing RPC functions are missing ($RPC_COUNT/2 found)."
  echo "Re-apply the migration sequence documented above."
  exit 1
fi

echo ""
echo "======================================================================"
echo "  API Reachability Check"
echo "======================================================================"
echo ""

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${STAGING_API_URL%/}" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "404" ]; then
  echo "Staging API is reachable (HTTP $HTTP_STATUS)."
else
  echo "Staging API is not reachable (HTTP $HTTP_STATUS)."
  echo "Check STAGING_API_URL and verify the current build is deployed."
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Asaas Credentials Check"
echo "======================================================================"
echo ""

WEBHOOK_PREVIEW="${STAGING_ASAAS_WEBHOOK_TOKEN:0:10}..."
ACCESS_PREVIEW="${STAGING_ASAAS_ACCESS_TOKEN:0:10}..."
echo "Webhook token present: $WEBHOOK_PREVIEW"
echo "Access token present:  $ACCESS_PREVIEW"

echo ""
echo "======================================================================"
echo "  Test User Check"
echo "======================================================================"
echo ""

TEST_USER_EXISTS=$(psql "$STAGING_DB_URL" -t -A -c "
  SELECT COUNT(*) FROM users WHERE id = 'usr_staging_001';
")

if [ "$TEST_USER_EXISTS" = "1" ]; then
  echo "Test user exists (usr_staging_001)."
else
  echo "Test user usr_staging_001 does not exist yet."
  echo "Create it with the SQL block from docs/staging/SETUP_GUIDE.md before running scenarios."
fi

echo ""
echo "======================================================================"
echo "  VERIFICATION COMPLETE"
echo "======================================================================"
echo ""
echo "All preflight checks passed."
echo "Next step: use the committed Phase 3 helpers described in scripts/README.md and docs/staging/VALIDATION_PLAN.md."
