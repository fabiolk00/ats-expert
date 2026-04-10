---
phase: 02-core-funnel-browser-verification
plan: "01"
subsystem: browser-harness
tags: [playwright, e2e, auth, middleware, clerk]
requires: []
provides:
  - Repo-local Playwright harness with one Chromium entrypoint
  - Tightly gated E2E auth cookie bootstrap for protected browser routes
affects: [phase-2-plan-02, phase-2-plan-03, ci, local-browser-tests]
tech-stack:
  added:
    - "@playwright/test"
  patterns:
    - Signed synthetic auth cookie for test-only route access
    - Dedicated E2E dev-server bootstrap with deterministic env overrides
    - Shared mocked API fixtures and SSE builders for browser coverage
key-files:
  created:
    - playwright.config.ts
    - scripts/start-e2e-dev-server.mjs
    - src/lib/auth/e2e-auth.ts
    - src/app/api/e2e/auth/route.ts
    - src/lib/auth/e2e-auth.test.ts
    - src/app/api/e2e/auth/route.test.ts
    - tests/e2e/auth.guard.spec.ts
    - tests/e2e/fixtures/auth-session.ts
    - tests/e2e/fixtures/api-mocks.ts
    - tests/e2e/helpers/sse.ts
  modified:
    - package.json
    - package-lock.json
    - src/lib/auth/app-user.ts
    - src/middleware.ts
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/dashboard/page.tsx
key-decisions:
  - "In E2E mode, bypass Clerk middleware entirely and enforce protected-route access with the signed test cookie instead."
  - "Use a dedicated server bootstrap script so the browser lane always starts with the required E2E env and dummy provider config."
patterns-established:
  - "Protected browser tests authenticate through POST/DELETE /api/e2e/auth instead of live Clerk UI."
  - "Browser fixtures own mocked profile, session, agent SSE, and file routes so later specs stay provider-free."
requirements-completed: [QA-01, QA-03]
duration: 44 min
completed: 2026-04-10
---

# Phase 2 Plan 1: Browser Harness and E2E Auth Summary

**Playwright is now committed and the protected dashboard can be entered in browser tests without live Clerk, Supabase, or OpenAI dependencies.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-04-10T04:09:28Z
- **Completed:** 2026-04-10T04:53:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Added a repo-local `npm run test:e2e` command plus a Chromium-only Playwright configuration.
- Built a signed E2E auth cookie helper, a gated bootstrap/clear route, and synthetic app-user resolution for server code.
- Switched middleware to a dedicated E2E branch so browser tests no longer stall on Clerk request auth.
- Added shared browser fixtures for auth bootstrap, mocked profile/session/file APIs, and mocked SSE agent responses.
- Proved the harness with a browser smoke spec covering guest redirect to `/login` and authenticated entry into `/dashboard`.

## Files Created/Modified

- `package.json` and `package-lock.json` - Added Playwright and the repo-local browser test command.
- `playwright.config.ts` - Defined the Chromium lane and wired it to a dedicated E2E server bootstrap.
- `scripts/start-e2e-dev-server.mjs` - Starts Next with deterministic test env so browser runs do not depend on operator shell state.
- `src/lib/auth/e2e-auth.ts` - Signs, verifies, and resolves the synthetic E2E auth cookie.
- `src/app/api/e2e/auth/route.ts` - Same-origin bootstrap and clear route for the browser harness.
- `src/lib/auth/app-user.ts` - Resolves the synthetic test user before falling back to Clerk.
- `src/middleware.ts` - Uses a true E2E auth branch in test mode and preserves normal Clerk behavior otherwise.
- `src/app/(auth)/layout.tsx` and `src/app/(auth)/dashboard/page.tsx` - Skip Clerk profile fetches in E2E mode so protected pages render deterministically in the harness.
- `tests/e2e/*` - Shared browser fixtures plus the auth guard smoke spec.

## Decisions Made

- Treat E2E mode as a distinct middleware path instead of trying to partially short-circuit Clerk after it has already initialized.
- Keep the cookie signed and same-origin gated so the browser auth seam remains explicit and fail-closed.
- Centralize test env bootstrapping in one server script rather than scattering shell-specific env setup into docs or commands.

## Deviations from Plan

- `src/app/(auth)/layout.tsx` and `src/app/(auth)/dashboard/page.tsx` also needed small changes to avoid Clerk profile lookups hanging in the browser harness. This stayed within the same auth-boundary objective and removed a real integration blocker.

## Issues Encountered

- Playwright's `webServer.env` path was not reliable enough for this repo on Windows, so a dedicated Node bootstrap script replaced it.
- Clerk rejected the original placeholder publishable key format; the harness now uses a syntactically valid test-style key.
- Loopback origin checks needed to treat `localhost` and `127.0.0.1` as equivalent for the bootstrap route.

## Verification

- `npm run typecheck`
- `npm test -- src/lib/auth/e2e-auth.test.ts src/app/api/e2e/auth/route.test.ts`
- `npm run test:e2e -- tests/e2e/auth.guard.spec.ts --project=chromium`
- `rg -n 'E2E_AUTH_BYPASS_SECRET|E2E_AUTH_ENABLED' src/lib/auth/e2e-auth.ts src/app/api/e2e/auth/route.ts src/middleware.ts src/lib/auth/app-user.ts`

## User Setup Required

None. The browser harness starts with committed defaults for the required test-only env values.

## Next Phase Readiness

- Ready for `02-02`, which can build the real profile and dashboard funnel specs on top of the committed auth and fixture layer.
- The shared API mock helpers are in place for profile save, workspace refresh, SSE streaming, and artifact download coverage.

---
*Phase: 02-core-funnel-browser-verification*
*Completed: 2026-04-10*
