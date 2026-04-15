---
title: Security Boundary Audit
audience: [developers, operators]
related:
  - secret-boundaries-and-e2e-auth.md
  - storage-and-rls-proof.md
  - ../architecture-overview.md
  - ../developer-rules/API_CONVENTIONS.md
status: current
updated: 2026-04-15
---

# Security Boundary Audit

This document records the effective protection model for CurrIA's most sensitive request seams after Phase 16. It is intentionally narrow: it describes what the repository proves today, which file owns that proof, and where guarantees still depend on external policy or infrastructure.

## Boundary Matrix

| Seam                                       | Primary enforcement owner                                                                                                                                             | Repo proof                                                                                                                                                                                                                                                                                   | What is not claimed                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Protected dashboard pages                  | `src/middleware.ts` plus `src/app/(auth)/layout.tsx`                                                                                                                  | `src/app/(auth)/layout.test.tsx`, `src/app/api/e2e/auth/route.test.ts`, `src/lib/auth/e2e-auth.test.ts`                                                                                                                                                                                      | No claim that middleware alone authorizes API mutations; API routes still own their own auth checks                              |
| E2E auth bootstrap                         | `src/app/api/e2e/auth/route.ts` and `src/lib/auth/e2e-auth.ts`                                                                                                        | allowed-runtime, same-origin, signed-cookie, invalid-secret, and missing-secret tests in `src/app/api/e2e/auth/route.test.ts`                                                                                                                                                                | No claim that the bypass is available outside `NODE_ENV=test`, `CI=true`, or explicit local dev                                  |
| Clerk webhook                              | `src/app/api/webhook/clerk/route.ts`                                                                                                                                  | negative-path tests for missing Svix headers, malformed timestamp, invalid signature, duplicate delivery, and missing secret config in `src/app/api/webhook/clerk/route.test.ts`                                                                                                             | No claim that Upstash availability is guaranteed; config or infra failure still returns a closed `500`                           |
| Asaas webhook                              | `src/app/api/webhook/asaas/route.ts`                                                                                                                                  | tests for missing or wrong token, malformed payload, unsupported event ignore path, duplicate skip path, and retryable handler failures in `src/app/api/webhook/asaas/route.test.ts`                                                                                                         | No claim that billing settlement invariants are fully closed here; deeper credit mutation proof belongs to Phase 17              |
| Billing checkout and paid generation paths | `src/app/api/checkout/route.ts`, `src/lib/asaas/client.ts`, `src/lib/resume-generation/generate-billable-resume.ts`, and `src/app/api/session/[id]/generate/route.ts` | checkout sequencing tests, Asaas client server-only tests, and billable generation replay tests in `src/app/api/checkout/route.test.ts`, `src/lib/asaas/client.test.ts`, `src/lib/resume-generation/generate-billable-resume.test.ts`, and `src/app/api/session/[id]/generate/route.test.ts` | No claim that ownership checks alone prove paid artifact safety; billing replay and credit-consumption invariants must also hold |
| Session and file downloads                 | `src/app/api/file/[sessionId]/route.ts` and `getSession(sessionId, appUserId)`                                                                                        | owner vs non-owner, target ownership, unavailable artifact, and no signed-URL persistence tests in `src/app/api/file/[sessionId]/route.test.ts`                                                                                                                                              | No claim that signed URLs are enforced by middleware; route ownership check is the app-layer authority                           |
| Server-only provider clients               | `src/lib/db/supabase-admin.ts`, `src/lib/openai/client.ts`, `src/lib/asaas/client.ts`                                                                                 | explicit `server-only` declarations plus focused module tests from Phase 13 and Phase 18                                                                                                                                                                                                     | No claim that every future helper remains safe automatically; new secret-bearing seams must opt in explicitly                    |

## Route Ownership Model

### Middleware and app pages

- `src/middleware.ts` protects app pages and leaves API routes to perform their own auth and ownership checks.
- When E2E bypass is active, middleware trusts only the signed bypass cookie and only in allowed runtimes.
- `src/app/(auth)/layout.tsx` still redirects when no app user is resolved, so the protected app shell stays fail-closed even if Clerk user resolution is skipped in E2E mode.

### Public webhooks

- `/api/webhook/clerk` is intentionally public but must fail closed unless Svix headers, timestamp, signature, Redis config, and webhook secret are all valid enough to continue.
- `/api/webhook/asaas` is intentionally public but must fail closed unless `asaas-access-token` matches the configured secret and the JSON payload passes route-level validation.
- Duplicate delivery is treated as a post-verification path, not a substitute for verification.

### File access and generated artifacts

- `/api/file/[sessionId]` authorizes through `getCurrentAppUser()` plus ownership-aware `getSession(sessionId, appUserId)`.
- `?targetId=` access is authorized only after the caller already owns the session, and the selected target row must belong to that session.
- The route returns fresh signed URLs but must not persist them back into session or target state.
- Paid artifact safety is a two-part claim:
  1. the caller owns the session or target
  2. billing state proves the generation replay is idempotent and not double-charged

### Billing mutation boundaries

- `/api/checkout` is the only app route that should bootstrap new paid checkout state before provider mutation.
- `src/lib/asaas/client.ts` is the server-only provider seam for Asaas token usage.
- `/api/session/[id]/generate` still authorizes by session ownership first, but replay safety for paid artifacts depends on `resume_generations`, `credit_consumptions`, and idempotency handling in `generateBillableResume()`.
- Phase 16 proved ownership and fail-closed route behavior. Phase 17 adds the billing-side proof that duplicate economic mutations or duplicate paid generations do not silently succeed.

### Storage and RLS interpretation

- Phase 18 adds a dedicated proof file at `docs/operations/storage-and-rls-proof.md`.
- The repository proves route ownership checks and transient signed URL behavior.
- The repository does not by itself prove that Supabase Storage policy or database RLS enforced the final object read when a service-role seam was used.

## External Dependencies and Proof Limits

The repository does **not** currently prove every storage or database isolation guarantee by itself.

Still dependent on external configuration or operational proof:

- Supabase Storage policy behavior for the underlying file objects
- database RLS or service-role usage outside the app-layer route checks already covered here
- live Upstash, Clerk, and Asaas infrastructure availability

When a route uses a server-only admin client, the repository proof is:

1. the route authenticates and checks ownership first
2. the admin capability stays behind a server-only seam
3. tests prove the route fails closed when ownership is missing

That is not the same thing as claiming RLS enforced the request.

## Audit Checklist for Future Changes

- If you add a new public webhook, document its verification input and negative-path tests here.
- If you add a new file or artifact route, state whether authorization lives in middleware, route ownership checks, storage policy, or a combination.
- If you add a new secret-bearing provider seam, keep it server-only and link the proof file here.
- If you rely on external storage or RLS guarantees, say so explicitly instead of implying the repo alone proves them.
