# Phase 1 Research: Contract Alignment and Fail-Fast Guards

**Date:** 2026-04-09
**Phase:** 01-contract-alignment-and-fail-fast-guards

## Goal

Remove launch-critical configuration drift between runtime code, CI, and operator docs without turning Phase 1 into a broad config-architecture rewrite.

## Evidence Collected

### Runtime is already the best source of truth for provider names

- `src/lib/openai/client.ts` reads `OPENAI_API_KEY` and optional `OPENAI_BASE_URL`.
- `src/lib/asaas/client.ts` reads `ASAAS_ACCESS_TOKEN`.
- `src/lib/rate-limit.ts` reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- `src/app/api/webhook/clerk/route.ts` reads `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `CLERK_WEBHOOK_SECRET`.
- `src/lib/db/supabase-admin.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `src/middleware.ts` depends on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` through CSP construction and Clerk middleware behavior.

### CI currently drifts from runtime on Asaas and Upstash

`.github/workflows/ci.yml` still exports:

- `ASAAS_API_KEY`
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`

Those names are not read by the runtime modules above. This is the clearest `OPS-01` violation in the repo.

### The repo references committed templates that do not exist

- `README.md` tells developers to copy `.env.example` to `.env`.
- `docs/ENVIRONMENT_SETUP.md` documents both `.env.example` and `.env.staging.example`.
- `scripts/verify-staging.sh` tells operators to copy `.env.staging.example` to `.env.staging`.
- The repo root currently contains only `.env`; no committed `.env.example` or `.env.staging.example` exists.

This is both a contract drift problem and a broken onboarding path.

### Some launch-critical paths still fail open or fail late

- `src/lib/openai/client.ts` falls back to `apiKey: 'test-key'`, which hides a missing credential until outbound requests fail.
- `src/lib/asaas/client.ts`, `src/lib/rate-limit.ts`, and `src/app/api/webhook/clerk/route.ts` rely on non-null assertions instead of actionable config errors.
- `src/app/api/webhook/asaas/route.ts` still accepts `ASAAS_ACCESS_TOKEN` as a fallback for `ASAAS_WEBHOOK_TOKEN`, which blurs two distinct secrets.
- `src/lib/db/supabase-admin.ts` is already the preferred pattern: explicit throw with a clear message.

### Optional integrations should stay optional

`src/lib/linkedin/linkdapi.ts` warns when `LINKDAPI_API_KEY` is missing and throws only when the integration is used. That matches the Phase 1 decision to avoid expanding the required startup contract beyond launch-critical providers.

## Recommended Canonical Contract

### Required in every non-test environment

| Variable | Why it matters | Owner |
|----------|----------------|-------|
| `OPENAI_API_KEY` | Core resume analysis and generation | `src/lib/openai/client.ts` |
| `ASAAS_ACCESS_TOKEN` | Billing API access | `src/lib/asaas/client.ts` |
| `ASAAS_WEBHOOK_TOKEN` | Billing webhook authentication | `src/app/api/webhook/asaas/route.ts` |
| `UPSTASH_REDIS_REST_URL` | Rate limiting and webhook replay protection | `src/lib/rate-limit.ts`, `src/app/api/webhook/clerk/route.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting and webhook replay protection | `src/lib/rate-limit.ts`, `src/app/api/webhook/clerk/route.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase admin access and file generation paths | `src/lib/db/supabase-admin.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access and file generation paths | `src/lib/db/supabase-admin.ts` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend + CSP host construction | `src/middleware.ts` |
| `CLERK_SECRET_KEY` | Clerk server runtime | Clerk SDK / deployment runtime |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signature verification | `src/app/api/webhook/clerk/route.ts` |

### Explicitly optional in Phase 1

| Variable | Why it stays optional |
|----------|-----------------------|
| `OPENAI_BASE_URL` | Safe default exists and is not a credential |
| `ASAAS_SANDBOX` | Behavior toggle, not a secret |
| `LINKDAPI_API_KEY` | Onboarding helper, not part of the launch-critical funnel contract for this milestone |

## Recommended Implementation Shape

### 1. Keep runtime names canonical and push the rest of the repo toward them

Do not rename runtime code to match the old CI names. The runtime names are already used across the real provider clients, so the safest cutover is:

- add committed env templates using the runtime names
- update CI to those names
- update README and operator docs to those names
- remove legacy names from the checked-in examples

### 2. Fail fast in non-test environments, but preserve test importability

The practical pattern for this codebase is:

- read required env vars lazily, not at module top level, when the client/route actually needs them
- allow tests to import modules without credentials by gating strictness behind a non-test check
- in non-test environments, throw immediately with actionable messages such as `Missing required environment variable OPENAI_API_KEY for OpenAI client.`

This keeps local dev, preview, staging, and production strict while avoiding brittle test bootstrapping.

### 3. Treat webhook secrets as separate credentials

`ASAAS_WEBHOOK_TOKEN` and `ASAAS_ACCESS_TOKEN` should no longer share fallback behavior. They protect different trust boundaries:

- API access token: CurrIA -> Asaas API
- webhook token: Asaas -> CurrIA webhook

Phase 1 should make that separation explicit in both code and docs.

### 4. Reuse the Supabase pattern instead of designing a new config subsystem

`src/lib/db/supabase-admin.ts` already shows the preferred Phase 1 style: fetch the env vars inside the accessor and throw with a clear message if they are absent. The other provider modules should converge on that behavior, but Phase 1 should not introduce a large config registry or schema layer unless duplication becomes clearly harmful during execution.

## Recommended Plan Split

### Wave 1

- `01-01`: Add committed env templates and align README, environment docs, and CI to the canonical contract.
- `01-02`: Remove fail-open behavior from provider modules and add focused regression tests.

These can run in parallel because their write sets do not overlap.

### Wave 2

- `01-03`: Refresh production-readiness and staging-validation instructions, then wire the proof commands into operator-facing docs.

This should wait for both Wave 1 plans so the docs point at the actual templates, secret names, tests, and script behavior produced by the first two plans.

## Risks and Constraints

- Hard cutover with no aliases means deployed environments must be renamed before rollout. This is a human-owned setup step and should be declared in the affected plan frontmatter.
- Strict non-test validation can break previously tolerated local setups. That is intentional for launch-critical providers, but the error messages must be specific enough to unblock developers quickly.
- The phase should not pull in unrelated env cleanup for every feature flag or integration in the repo. Keep the scope anchored on the launch funnel and the providers named in `01-CONTEXT.md`.

## Validation Architecture

### Automated proof

1. Static contract audit through `rg` checks against:
   - `.env.example`
   - `.env.staging.example`
   - `.github/workflows/ci.yml`
   - `README.md`
   - `docs/ENVIRONMENT_SETUP.md`
2. Focused Vitest coverage for fail-fast behavior in:
   - `src/lib/openai/client.ts`
   - `src/lib/asaas/client.ts`
   - `src/lib/rate-limit.ts`
   - `src/lib/db/supabase-admin.ts`
   - `src/app/api/webhook/asaas/route.ts`
   - `src/app/api/webhook/clerk/route.ts`
3. Full regression confirmation with `npm test`.

### Manual or external proof

1. Hosting provider environments must be updated to the canonical names before deploying the hard cutover.
2. A real staging run of `bash scripts/verify-staging.sh` still requires populated staging credentials and live database access, so that remains an operator-executed check rather than a repo-only test.

### Success signal for Phase 1

Phase 1 can be considered complete only when all of the following are true:

- committed templates exist and list the canonical names
- CI uses the same names as runtime for the launch-critical providers
- missing launch-critical config throws clearly in non-test paths
- optional integrations are still explicitly optional
- release and staging docs point at the updated templates, migrations, and verification commands
