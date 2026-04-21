# Phase 78 Context

## Goal

Add request-scoped database query counting with threshold-based N+1 suspicion logging for the Next.js API layer, without changing API contracts or business behavior.

## Problem

The requested work targets Prisma query instrumentation, but the current runtime data layer used by the sensitive API routes is not backed by a live Prisma client singleton. The active route and repository seams in `src/app/api/**` and `src/lib/db/**` use `@supabase/supabase-js` through `getSupabaseAdminClient()`.

We still need the same operational outcome:

- count DB requests per HTTP request
- log route/method/query count/latency in structured logs
- warn when a configurable threshold is exceeded
- keep the implementation request-scoped and reusable
- avoid invasive route/business-logic edits

## Decisions

- Preserve the requested architecture shape where it still makes sense: AsyncLocalStorage request context plus a reusable route wrapper plus global DB client instrumentation.
- Implement instrumentation at the live DB seam (`getSupabaseAdminClient()` / Supabase fetch pipeline) instead of introducing an unused Prisma client layer.
- Keep event names DB-generic (`db.request_queries`, `db.n_plus_one_threshold_exceeded`) so the observability contract remains useful even though the concrete transport is Supabase/PostgREST requests rather than Prisma query events.
- Scope wrapper rollout to the highest-value existing API routes first: `/api/agent`, `/api/session/[id]`, `/api/file/[sessionId]`, and `/api/session/[id]/generate`.
- Bound in-memory sampling and truncate sampled request descriptors to keep production safety.

## Verification

- `npm run typecheck`
- `npx vitest run "src/lib/observability/request-query-context.test.ts" "src/lib/observability/request-query-tracking.test.ts" "src/app/api/agent/route.test.ts" "src/app/api/session/[id]/route.test.ts" "src/app/api/file/[sessionId]/route.test.ts" "src/app/api/session/[id]/generate/route.test.ts"`
