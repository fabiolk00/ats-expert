# Phase 1: User Setup Required

**Generated:** 2026-04-10
**Phase:** 01-contract-alignment-and-fail-fast-guards
**Status:** Incomplete

Complete these items for the deployment contract to function. The agent automated everything possible in-repo; these items require human access to external dashboards.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `OPENAI_API_KEY` | Current hosting provider environment settings | Hosting provider project environment variables |
| [ ] | `ASAAS_ACCESS_TOKEN` | Current hosting provider environment settings; replace any legacy Asaas API token entry | Hosting provider project environment variables |
| [ ] | `ASAAS_WEBHOOK_TOKEN` | Asaas dashboard -> Webhooks -> Signing token | Hosting provider project environment variables |
| [ ] | `UPSTASH_REDIS_REST_URL` | Current hosting provider environment settings; replace any legacy Upstash URL entry | Hosting provider project environment variables |
| [ ] | `UPSTASH_REDIS_REST_TOKEN` | Current hosting provider environment settings; replace any legacy Upstash token entry | Hosting provider project environment variables |
| [ ] | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard -> API Keys -> Publishable key | Hosting provider project environment variables |
| [ ] | `CLERK_SECRET_KEY` | Clerk dashboard -> API Keys -> Secret key | Hosting provider project environment variables |
| [ ] | `CLERK_WEBHOOK_SECRET` | Clerk dashboard -> Webhooks -> Signing secret | Hosting provider project environment variables |

## Dashboard Configuration

- [ ] **Rename any legacy runtime variables before deploying Phase 1**
  - Location: Hosting provider project settings -> Environment Variables
  - Set to: Match `.env.example` exactly for preview, staging, and production
  - Notes: This phase intentionally removes alias support, so old variable names will no longer satisfy runtime validation.

## Verification

After completing setup, verify with:

```bash
npm run typecheck
bash scripts/verify-staging.sh
```

Expected results:
- Local verification completes without missing-variable errors caused by outdated deployment names.
- Staging verification uses the same canonical contract documented in `.env.example` and `.env.staging.example`.

---

**Once all items complete:** Mark status as "Complete" at the top of this file.
