---
phase: 01
slug: contract-alignment-and-fail-fast-guards
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
---

# Phase 01 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x plus TypeScript typecheck and static `rg` audits |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | OPS-01, OPS-03 | T-01-01 / T-01-02 | Templates expose only canonical launch-contract names and placeholders | static audit | `rg -n "OPENAI_API_KEY|ASAAS_ACCESS_TOKEN|ASAAS_WEBHOOK_TOKEN|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|CLERK_WEBHOOK_SECRET" .env.example .env.staging.example` | yes | pending |
| 01-01-02 | 01 | 1 | OPS-01 | T-01-01 | README, env docs, and CI use canonical names with no legacy aliases | static audit | `powershell -NoProfile -Command "if (rg -n 'ASAAS_API_KEY|UPSTASH_REDIS_URL|UPSTASH_REDIS_TOKEN' README.md docs/ENVIRONMENT_SETUP.md .github/workflows/ci.yml) { exit 1 } else { exit 0 }"` | yes | pending |
| 01-02-01 | 02 | 1 | OPS-02 | T-01-03 | OpenAI, Asaas, and Supabase fail fast with actionable errors outside tests | unit | `npm test -- src/lib/openai/client.test.ts src/lib/asaas/client.test.ts src/lib/db/supabase-admin.test.ts` | yes | pending |
| 01-02-02 | 02 | 1 | OPS-01, OPS-02 | T-01-04 / T-01-05 | Webhook and rate-limit paths require dedicated secrets and lazy config reads | unit | `npm test -- src/lib/rate-limit.test.ts src/app/api/webhook/asaas/route.test.ts src/app/api/webhook/clerk/route.test.ts` | yes | pending |
| 01-03-01 | 03 | 2 | OPS-03 | T-01-06 | Production checklist lists the current migration set and billing event expectations | static audit | `rg -n "20260406_align_asaas_webhook_contract.sql|20260406_fix_billing_checkout_timestamp_defaults.sql|20260407_persist_billing_display_totals.sql|20260407_harden_text_id_generation.sql|20260407_harden_standard_timestamps.sql|PAYMENT_SETTLED|SUBSCRIPTION_STARTED" docs/PRODUCTION-READINESS-CHECKLIST.md` | yes | pending |
| 01-03-02 | 03 | 2 | OPS-03 | T-01-07 | Staging setup docs and verification script point at the same template and required vars | static audit | `rg -n "\\.env\\.staging\\.example|verify-staging\\.sh|STAGING_ASAAS_WEBHOOK_TOKEN|STAGING_ASAAS_ACCESS_TOKEN" docs/staging/SETUP_GUIDE.md docs/staging/VALIDATION_PLAN.md scripts/verify-staging.sh scripts/README.md` | yes | pending |
| 01-03-03 | 03 | 2 | OPS-03 | T-01-06 / T-01-07 | Operator docs name the exact local, CI, and staging proof commands | static audit | `rg -n "npm run typecheck|npm test|bash scripts/verify-staging.sh" docs/PRODUCTION-READINESS-CHECKLIST.md docs/staging/VALIDATION_PLAN.md scripts/README.md` | yes | pending |

*Status: pending, green, red, or flaky.*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Preview, staging, and production environments use only the canonical launch-contract names before rollout | OPS-01 | Requires access to the deployment platform or hosting dashboard | Open the environment-variable settings for each deployed environment and confirm the names match `.env.example`, especially `ASAAS_ACCESS_TOKEN`, `ASAAS_WEBHOOK_TOKEN`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. |
| Real staging prerequisites pass before billing validation begins | OPS-03 | Requires live staging credentials and database connectivity | Copy `.env.staging.example` to `.env.staging`, populate real staging values, then run `bash scripts/verify-staging.sh` and confirm all checks pass before executing the billing scenarios. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or no Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-09
