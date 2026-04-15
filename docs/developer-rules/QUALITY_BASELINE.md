---
title: CurrIA Quality Baseline
audience: [developers]
related: [CODE_STYLE.md, TESTING.md, ../../README.md]
status: current
updated: 2026-04-14
---

# Quality Baseline

Back to [Developer Rules](./README.md) | [All Docs](../INDEX.md)

CurrIA now uses a staged quality baseline designed for a brownfield TypeScript monolith.

## Lint Layers

### `pnpm lint:next`

Runs the existing Next.js lint contract across the app surface.

### `pnpm lint:types`

Runs the new TypeScript-aware ESLint layer on the highest-value server and test seams:

- `src/app/api/cron`
- `src/app/api/e2e`
- `src/lib/auth`
- `src/lib/db/supabase-admin.ts`
- `src/lib/openai`
- `src/lib/asaas/client.ts`

Current enforced rules stay intentionally narrow:

- type-only imports where appropriate
- no unused variables unless prefixed with `_`

This rollout is intentionally scoped. It does not claim that the whole repo is ready for full `typescript-eslint` enforcement yet.

### `pnpm lint`

Runs both layers in order:

1. `pnpm lint:next`
2. `pnpm lint:types`

## Formatting Baseline

CurrIA now uses Prettier as a low-churn formatter entrypoint:

- `pnpm format:check`
- `pnpm format:write`

Rollout strategy:

- Prettier is enforced first for contributor-facing docs and config files in this baseline scope:
  - `README.md`
  - `docs/INDEX.md`
  - `docs/session-persistence-boundaries.md`
  - `docs/developer-rules/*.md`
  - `docs/operations/*.md`
  - selected root/config files wired into the scripts
- contributors should only format files they touch inside that documented scope
- we are explicitly avoiding a one-shot repo-wide reformat in this phase

## Contributor Workflow

For normal feature work:

1. `pnpm typecheck`
2. `pnpm lint`
3. relevant Vitest suites
4. relevant Playwright suite when UI or funnel behavior changes

For docs/config-only edits:

1. `pnpm format:check`
2. any targeted validation relevant to the changed contract

## Rollout Boundaries

- We are not enabling strict `typescript-eslint` across every legacy file yet.
- We are not auto-formatting the entire repo in one migration.
- New scope should expand from the staged directories only when the local error rate stays manageable.
