---
phase: 80-repeated-query-fingerprinting-for-stronger-n-1-detection
plan: 01
subsystem: observability
tags: [supabase, observability, nextjs, api, n-plus-one, vitest]
requirements-completed: [DB-FP-OBS-01, DB-FP-OBS-02, DB-FP-TEST-01]
completed: 2026-04-21
---

# Phase 80 Plan 01 Summary

Phase 80 adds repeated query fingerprinting on top of the existing request-scoped DB tracking so high-count requests now surface repeated normalized request shapes and a stronger `suspectedNPlusOne` signal.

## Accomplishments

- Added a dedicated fingerprinting module with deterministic normalization and repeated-pattern summarization.
- Extended request query context to aggregate per-request pattern stats without changing business logic.
- Enriched summary and warning logs with unique/repeated pattern counts, top repeated patterns, and `suspectedNPlusOne`.
- Preserved existing SSE-safe flush behavior for `/api/agent`.
- Added regression coverage for fingerprint normalization, aggregation, warning payload shape, and repeated-vs-diverse high-count traffic.

## Verification

- `npm run typecheck`
- `npx vitest run "src/lib/observability/query-fingerprint.test.ts" "src/lib/observability/request-query-context.test.ts" "src/lib/observability/request-query-tracking.test.ts" "src/lib/db/supabase-admin.test.ts" "src/app/api/agent/route.test.ts" "src/app/api/session/[id]/route.test.ts"`
