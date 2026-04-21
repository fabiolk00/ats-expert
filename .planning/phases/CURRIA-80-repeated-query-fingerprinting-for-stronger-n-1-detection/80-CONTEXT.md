# Phase 80 Context

## Goal

Extend the existing request-scoped DB request tracking so it can detect repeated normalized request patterns within a single HTTP request and emit a stronger `suspectedNPlusOne` signal.

## Problem

Phase 78 added per-request DB call counting, sampled descriptors, threshold warnings, and SSE-safe flushing on the live Supabase/PostgREST seam. That tells us when a request fan-outs too much, but not whether the request is repeating the same DB access shape over and over.

We now need second-layer diagnostics that answer:

- which request patterns repeated
- how many times they repeated
- which repeated shapes are most suspicious
- whether the request likely reflects N+1-like behavior

## Decisions

- Build on top of the existing Phase 78 architecture; do not redesign the request context, wrapper, or Supabase fetch seam.
- Keep normalization at the descriptor level produced from the Supabase/PostgREST request shape. Do not parse SQL or introspect Postgres internals.
- Preserve sampled raw descriptors and add normalized fingerprint summaries alongside them.
- Keep the repetition heuristic explicit and conservative.
- Preserve SSE correctness for `/api/agent` by reusing the current explicit flush lifecycle.

## Verification

- `npm run typecheck`
- `npx vitest run "src/lib/observability/query-fingerprint.test.ts" "src/lib/observability/request-query-context.test.ts" "src/lib/observability/request-query-tracking.test.ts" "src/lib/db/supabase-admin.test.ts" "src/app/api/agent/route.test.ts" "src/app/api/session/[id]/route.test.ts"`
