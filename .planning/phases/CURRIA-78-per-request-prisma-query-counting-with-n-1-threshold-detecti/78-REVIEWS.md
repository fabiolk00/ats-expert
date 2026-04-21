# Phase 78 Plan Review

Reviewed on 2026-04-21 against the live codebase.

## Review Outcome

- Keep the request-scoped architecture, but adapt the global instrumentation seam from Prisma events to the actual runtime seam: `getSupabaseAdminClient()` with custom `global.fetch`.
- Count only `/rest/v1/` PostgREST requests so storage/auth traffic from the same client does not inflate DB counts.
- Keep the warning threshold at `15` by default, but allow `DB_QUERY_WARNING_THRESHOLD` to override it safely.
- Treat `/api/agent` as a streaming exception: initialize request context in the route, then flush request metrics when the SSE stream completes or fails.
- Keep sampled descriptors bounded and truncated; do not retain unbounded SQL or request strings in memory.

## Decision

Plan approved with one implementation adjustment:

- The repo does not have a live Prisma singleton backing these routes, so the phase should deliver equivalent DB observability at the Supabase/PostgREST seam instead of introducing unused Prisma-only infrastructure.
