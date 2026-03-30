#!/bin/bash

# Staging Environment Verification Script
# Checks all preconditions before running validation

set -e

echo "======================================================================"
echo "  Staging Environment Verification"
echo "======================================================================"
echo ""

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
  echo "❌ FATAL: .env.staging not found"
  echo ""
  echo "Create it from the template:"
  echo "  cp .env.staging.example .env.staging"
  echo "  # Then edit .env.staging with your staging credentials"
  exit 1
fi

# Load staging credentials
source .env.staging

# Validate all required variables are set
echo "Checking required environment variables..."
echo ""

REQUIRED_VARS=(
  "STAGING_DB_URL"
  "STAGING_API_URL"
  "STAGING_ASAAS_WEBHOOK_TOKEN"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING_VARS=$((MISSING_VARS + 1))
  else
    echo "✓ Set: $var"
  fi
done

if [ $MISSING_VARS -gt 0 ]; then
  echo ""
  echo "❌ $MISSING_VARS required environment variables are missing"
  echo "Edit .env.staging and set all required values"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Database Connectivity Check"
echo "======================================================================"
echo ""

if psql "$STAGING_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Database is reachable"
else
  echo "❌ Cannot connect to staging database"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check STAGING_DB_URL is correct"
  echo "  2. Verify database host is reachable: nc -zv [host] 5432"
  echo "  3. Check firewall allows your IP address"
  echo "  4. For Supabase: verify IP whitelist in settings"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Database Schema Check"
echo "======================================================================"
echo ""

# Check if required tables exist
TABLES_FOUND=$(psql "$STAGING_DB_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'public'
  AND tablename IN ('billing_checkouts', 'credit_accounts', 'user_quotas', 'processed_events');")

if [ "$TABLES_FOUND" = "4" ]; then
  echo "✓ All required tables exist ($TABLES_FOUND/4)"
else
  echo "⚠️  Found $TABLES_FOUND/4 required tables"
  echo ""
  echo "Tables found:"
  psql "$STAGING_DB_URL" -c "
    SELECT tablename FROM pg_tables
    WHERE tablename IN ('billing_checkouts', 'credit_accounts', 'user_quotas', 'processed_events')
    ORDER BY tablename;"
  echo ""
  echo "Missing tables must be created by running the migration:"
  echo "  psql \"\$STAGING_DB_URL\" -f prisma/migrations/billing_webhook_hardening.sql"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  RPC Functions Check"
echo "======================================================================"
echo ""

RPC_COUNT=$(psql "$STAGING_DB_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE 'apply_billing_%';")

if [ "$RPC_COUNT" = "2" ]; then
  echo "✓ Both RPC functions exist ($RPC_COUNT/2)"
  echo ""
  psql "$STAGING_DB_URL" -c "
    SELECT routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name LIKE 'apply_billing_%'
    ORDER BY routine_name;"
else
  echo "❌ Found $RPC_COUNT/2 RPC functions"
  echo ""
  echo "Required RPC functions:"
  echo "  - apply_billing_credit_grant_event"
  echo "  - apply_billing_subscription_metadata_event"
  echo ""
  echo "Run the migration to create them:"
  echo "  psql \"\$STAGING_DB_URL\" -f prisma/migrations/billing_webhook_hardening.sql"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  API Reachability Check"
echo "======================================================================"
echo ""

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_API_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
  echo "✓ API is reachable (HTTP $HTTP_STATUS)"
else
  echo "❌ API not reachable (HTTP $HTTP_STATUS)"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check STAGING_API_URL is correct"
  echo "  2. Verify API is deployed to staging"
  echo "  3. Check firewall/network access"
  echo "  4. Test manually: curl -v '$STAGING_API_URL'"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Webhook Token Check"
echo "======================================================================"
echo ""

if [ -n "$STAGING_ASAAS_WEBHOOK_TOKEN" ]; then
  TOKEN_LENGTH=${#STAGING_ASAAS_WEBHOOK_TOKEN}
  TOKEN_PREVIEW="${STAGING_ASAAS_WEBHOOK_TOKEN:0:10}..."
  echo "✓ Webhook token is set ($TOKEN_LENGTH chars)"
  echo "  Preview: $TOKEN_PREVIEW"
else
  echo "❌ Webhook token is empty"
  echo ""
  echo "Get token from Asaas sandbox dashboard:"
  echo "  https://sandbox.asaas.com/settings/webhooks"
  exit 1
fi

echo ""
echo "======================================================================"
echo "  Test Data Check"
echo "======================================================================"
echo ""

TEST_USER_EXISTS=$(psql "$STAGING_DB_URL" -t -c "
  SELECT COUNT(*) FROM users WHERE id = 'usr_staging_001';")

if [ "$TEST_USER_EXISTS" = "1" ]; then
  echo "✓ Test user exists (usr_staging_001)"

  # Show test user data
  echo ""
  echo "Test user data:"
  psql "$STAGING_DB_URL" -c "
    SELECT
      u.id as user_id,
      COALESCE(ca.credits_remaining, 0) as credits,
      COALESCE(uq.plan, 'none') as plan
    FROM users u
    LEFT JOIN credit_accounts ca ON ca.user_id = u.id
    LEFT JOIN user_quotas uq ON uq.user_id = u.id
    WHERE u.id = 'usr_staging_001';"
else
  echo "⚠️  Test user does not exist"
  echo ""
  echo "Create test user before running validation:"
  echo "  psql \"\$STAGING_DB_URL\" <<'SQL'"
  echo "  INSERT INTO users (id, email, created_at, updated_at)"
  echo "  VALUES ('usr_staging_001', 'staging-test@curria.test', NOW(), NOW());"
  echo "  "
  echo "  INSERT INTO credit_accounts (id, user_id, credits_remaining, created_at, updated_at)"
  echo "  VALUES ('cred_staging_001', 'usr_staging_001', 5, NOW(), NOW());"
  echo "  SQL"
fi

echo ""
echo "======================================================================"
echo "  VERIFICATION COMPLETE"
echo "======================================================================"
echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Review test user data above"
echo "  2. Run: npm run agent:validate-billing"
echo "  3. Check output for go/no-go recommendation"
echo ""
