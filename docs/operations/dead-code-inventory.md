---
title: CurrIA Dead-Code Inventory
audience: [developers]
related:
  - ./dead-code-cleanup-workflow.md
  - ../developer-rules/QUALITY_BASELINE.md
  - ../../README.md
status: current
updated: 2026-04-14
---

# Dead-Code Inventory

Back to [Developer Rules](../developer-rules/README.md) | [All Docs](../INDEX.md)

This inventory records the reviewed output from `pnpm unused` and `pnpm orphans` during Phase 22. It is intentionally opinionated: raw static-tool output is not treated as truth.

## false positive

These findings are expected because they are framework-owned, config-owned, or test-owned entrypoints:

- `default`, `metadata`, and `runtime` exports under `src/app/**`
- `src/middleware.ts` `default` and `config`
- App Router pages and layouts reported by `madge --orphans`
- route, component, and hook test files reported as orphans
- `.next/types/**` generated type files surfaced by `ts-prune`
- exported types flagged as `used in module`
- standalone config entrypoints such as `playwright.config.ts` and `vitest.config.ts`

## manual review

These findings should not be deleted automatically and need a human proof step first:

- helper scripts under `scripts/**`
- template utilities referenced only through package scripts:
  - `src/lib/templates/create-template.ts`
  - `src/lib/templates/test-template.ts`
- profile, billing, and agent helper exports that may still serve operator, CLI, or future runtime flows

## deletion candidate

These findings survived manual review as low-risk cleanup candidates:

- `src/lib/auth/clerk-errors.ts`
  - no repo consumers
  - no framework ownership
  - overlaps with the actively used `src/components/auth/clerk-error.ts`
- `MAX_JOB_TARGETING_STAGE_RETRIES` export in `src/lib/agent/job-targeting-retry.ts`
  - exported but not consumed anywhere in the repo
  - not needed by the module itself

## removed dead code

Phase 22 removed the following reviewed candidates:

- deleted `src/lib/auth/clerk-errors.ts`
- removed the dead `MAX_JOB_TARGETING_STAGE_RETRIES` export from `src/lib/agent/job-targeting-retry.ts`

## kept exceptions

The following classes remain intentionally kept even though static tooling reports them:

- Next.js entrypoints
- middleware and route-level framework exports
- tests and fixtures
- script-only helpers
- generated `.next/types/**` artifacts

## next deletion scope

If more deletion work is needed later, prefer small `src/lib/**` helpers with no framework ownership and no package-script entrypoint before touching broader surfaces.
