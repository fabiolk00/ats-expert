# Phase 21 Context

## Phase

Phase 21: Import and Local Cleanup Sweep

## Goal

Remove low-risk unused imports and locals in agreed scopes without changing runtime behavior.

## Why This Phase Exists

Phase 20 installed the hygiene baseline, but the repo still carries brownfield noise that should be reduced in a staged way. This phase starts with the safest cleanup class first:

- unused imports
- clearly dead locals
- clearly ignorable parameters where `_` is the accepted convention

The intent is not to chase every static-tool finding. The intent is to reduce maintenance noise in the scopes already covered by the staged lint baseline while preserving runtime behavior.

## Current State

- `eslint-plugin-unused-imports` is available through `pnpm lint:types:fix`.
- The TypeScript-aware lint scope is still intentionally narrow:
  - `src/app/api/e2e`
  - `src/app/api/cron`
  - `src/lib/auth`
  - `src/lib/openai`
  - `src/lib/db/supabase-admin.ts`
  - `src/lib/asaas/client.ts`
- False-positive classes remain explicitly documented for routes, dynamic imports, string-driven handlers, and background-job style flows.
- This phase should prefer small, reviewable cleanup batches over broad repo churn.

## Safety Rules

- Do not broaden lint scope in this phase.
- Do not enable global `noUnusedLocals` or `noUnusedParameters` in this phase.
- Do not delete files or exports in this phase; that belongs to Phase 22.
- Keep `_ignored` or `_unused` conventions only where a parameter is intentionally required by an interface, callback, or framework contract.
- Re-run focused tests for any runtime slice touched by cleanup.

## Files Likely In Scope

- `src/app/api/e2e/**/*`
- `src/app/api/cron/**/*`
- `src/lib/auth/**/*`
- `src/lib/openai/**/*`
- `src/lib/db/supabase-admin.ts`
- `src/lib/asaas/client.ts`
- focused tests for the cleaned slices

## Requirements

- `CLEAN-01`
- `CLEAN-02`
