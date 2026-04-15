---
title: CurrIA Dead-Code Cleanup Workflow
audience: [developers]
related:
  - ../developer-rules/QUALITY_BASELINE.md
  - ../developer-rules/CODE_STYLE.md
  - ../developer-rules/TESTING.md
  - ../../README.md
status: current
updated: 2026-04-14
---

# Dead-Code Cleanup Workflow

Back to [Developer Rules](../developer-rules/README.md) | [All Docs](../INDEX.md)

CurrIA uses a staged cleanup workflow for dead code. This repo is a brownfield Next.js monolith with dynamic runtime seams, so static-analysis tools are useful for inventory but not trustworthy enough for one-shot deletion.

## Toolchain

Use the committed commands in this order:

1. `pnpm lint:types:fix`
2. `pnpm unused`
3. `pnpm depcheck`
4. `pnpm orphans`

Optional convenience pass:

- `pnpm hygiene:inventory`

## What each tool is for

- `pnpm lint:types:fix`: scoped autofix for unused imports in the currently approved brownfield slices
- `pnpm unused`: candidate dead exports via `ts-prune`
- `pnpm depcheck`: candidate unused dependencies
- `pnpm orphans`: candidate orphan files under `src/` via `madge`

## False Positives

The following classes require manual review before deleting anything:

- Next.js routes under `src/app/**`
- dynamic imports
- string-driven handlers, tool dispatch, or workflow seams
- background jobs, polling routes, and queue-like flows
- tests or fixtures that are only referenced by runtime tooling or scripted checks

## Review Sequence

Follow this order and keep diffs small:

1. imports
2. low-risk locals and parameters
3. dead exports
4. orphan files
5. dependencies

Never combine all cleanup classes into one large commit.

## Validation Expectations

After each cleanup slice:

1. run `pnpm typecheck`
2. run `pnpm lint`
3. run focused tests for the touched runtime seams
4. rerun the relevant inventory command to confirm the targeted finding is gone

## Explicit Non-Goals for the Baseline

- no repo-wide deletion pass
- no automatic deletion based only on `ts-prune`, `depcheck`, or `madge`
- no global `noUnusedLocals` or `noUnusedParameters` gate in this baseline phase

## Decision Rule

If a finding might be reachable through framework conventions, string lookup, runtime registration, or delayed execution, keep it until a human proves otherwise.
