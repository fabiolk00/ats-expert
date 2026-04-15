---
title: CurrIA Dependency Hygiene Inventory
audience: [developers]
related:
  - ./dead-code-cleanup-workflow.md
  - ../developer-rules/QUALITY_BASELINE.md
  - ../../README.md
status: current
updated: 2026-04-14
---

# Dependency Hygiene Inventory

Back to [Developer Rules](../developer-rules/README.md) | [All Docs](../INDEX.md)

This inventory records the reviewed `depcheck` findings from Phase 23 and the decision taken for each one.

## unused dependency

No dependency was removed blindly from raw `depcheck` output.

Reviewed findings:

- `autoprefixer`
  - kept
  - used via `postcss.config.js`
  - ignored in `.depcheckrc.json` because `depcheck` does not model this repo's PostCSS config path reliably
- `postcss`
  - kept
  - required by the committed PostCSS/Tailwind configuration
  - ignored in `.depcheckrc.json` for the same reason as `autoprefixer`

## missing dependency

- `@clerk/types`
  - added explicitly to `devDependencies`
  - currently imported by `src/components/auth/clerk-localization.ts`
  - this satisfies the repo's typecheck contract even though the package is deprecated upstream

## ignored finding

- `server-only`
  - ignored in `.depcheckrc.json`
  - this is a Next.js/React server-boundary package already present transitively and intentionally imported in server-only modules
  - treated as a tool-specific false positive for dependency hygiene purposes

## enforcement decision

The sustainable enforcement baseline for this repo is:

- keep scoped `typescript-eslint` enforcement in the brownfield-safe slices
- keep global TypeScript unused enforcement disabled for now
- run configured `depcheck` as a reviewed inventory tool, not as a blind uninstall trigger
- keep CI hygiene checks realistic and brownfield-safe

## follow-up

When the auth localization import is migrated away from `@clerk/types`, this inventory should be updated and the direct dependency can be reconsidered.
