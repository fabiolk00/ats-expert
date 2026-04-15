---
title: Secret Boundaries and E2E Auth
audience: [developers, operators]
related:
  - ENVIRONMENT_SETUP.md
  - developer-rules/TESTING.md
  - operations/lgpd-data-handling.md
status: current
updated: 2026-04-15
---

# Secret Boundaries and E2E Auth

CurrIA uses backend-only credentials for Supabase admin access, OpenAI, Clerk webhooks, and Asaas. Those secrets must never cross into client bundles or ambiguous shared utilities.

## Server-Only Secret Boundary

These modules are the expected server-only seams for launch-critical credentials:

- `src/lib/db/supabase-admin.ts`
- `src/lib/openai/client.ts`
- `src/lib/asaas/client.ts`

Rules:

- secret-bearing shared modules must declare a server-only boundary explicitly
- route handlers may read webhook secrets directly when the route itself is server-only
- client components, browser helpers, and shared UI utilities must not import secret-bearing modules
- if a helper needs admin storage access, it should call the shared server-only seam instead of reading service-role env vars inline
- the Supabase admin seam is a capability seam, not an authorization proof; service-role access can bypass RLS by design
- signed URL helpers are delivery seams only and must stay downstream of route ownership or billing checks

## E2E Auth Bypass Contract

`/api/e2e/auth` is a test-only bootstrap seam. It must stay unavailable unless all of these are true:

1. `E2E_AUTH_ENABLED=true`
2. `E2E_AUTH_BYPASS_SECRET` is present
3. the runtime is one of:
   - `NODE_ENV=test`
   - CI with `CI=true`
   - explicit local dev with `E2E_AUTH_ALLOW_LOCAL_DEV=true`

Additional safeguards:

- same-origin requests only
- signed cookie payload
- middleware only trusts the bypass cookie when the runtime contract above is active
- unsupported environments fail closed and do not expose the route

## Local and CI Usage

Local Playwright or stress tooling must set:

- `E2E_AUTH_ENABLED=true`
- `E2E_AUTH_BYPASS_SECRET=<local test secret>`
- `E2E_AUTH_ALLOW_LOCAL_DEV=true`

CI must set:

- `E2E_AUTH_ENABLED=true`
- `E2E_AUTH_BYPASS_SECRET=<ci secret or dummy test secret>`

CI does not need `E2E_AUTH_ALLOW_LOCAL_DEV=true` because `CI=true` already satisfies the runtime guard.

## Audit Checklist

When touching auth, env, or provider clients:

- search for direct `process.env` reads of service-role or provider tokens
- prefer the committed server-only seam over duplicating env access
- confirm test-only auth still fails when the runtime guard is absent
- if a route returns signed URLs, verify authorization happened before the signing helper ran
- state explicitly when a route depends on external storage policy or RLS beyond what the repo tests can prove
- update this document if a new secret-bearing integration is introduced
