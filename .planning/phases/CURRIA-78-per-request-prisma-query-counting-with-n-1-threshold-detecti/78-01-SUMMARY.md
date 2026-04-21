---
phase: 78-per-request-prisma-query-counting-with-n-1-threshold-detecti
plan: 01
subsystem: observability
tags: [supabase, observability, nextjs, api, async-local-storage, vitest]
requirements-completed: [DB-QUERY-OBS-01, DB-QUERY-OBS-02, DB-QUERY-TEST-01]
completed: 2026-04-21
---

# Phase 78 Plan 01 Summary

Request-scoped DB query tracking now runs through the live Supabase admin client seam and emits structured per-request summaries plus threshold warnings for the highest-value API routes.

## Accomplishments

- Added `AsyncLocalStorage`-backed request query context with bounded sampling and truncation.
- Added a reusable `withRequestQueryTracking(...)` helper plus idempotent flush support for streaming routes.
- Instrumented `getSupabaseAdminClient()` with a custom `global.fetch` that counts only `/rest/v1/` PostgREST DB requests.
- Wrapped `/api/agent`, `/api/session/[id]`, `/api/file/[sessionId]`, and `/api/session/[id]/generate`.
- Added regression coverage for context accounting, threshold warnings, Supabase seam filtering, and the tracked routes.

## Verification

- `npm run typecheck`
- `npx vitest run "src/lib/observability/request-query-context.test.ts" "src/lib/observability/request-query-tracking.test.ts" "src/lib/db/supabase-admin.test.ts" "src/app/api/agent/route.test.ts" "src/app/api/session/[id]/route.test.ts" "src/app/api/file/[sessionId]/route.test.ts" "src/app/api/session/[id]/generate/route.test.ts"`

## Notes

- The original ask referenced Prisma instrumentation, but the live runtime seam in this repo is Supabase/PostgREST; the phase preserves the intended observability outcome at the seam the application actually uses.
