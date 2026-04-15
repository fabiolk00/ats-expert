# Phase 23 Context

## Phase

Phase 23: Dependency Cleanup and Sustained Enforcement

## Goal

Remove truly unused dependencies and turn the cleanup into sustainable hygiene gates the repo can support.

## Why This Phase Exists

Phases 20 through 22 established the hygiene toolchain, validated the low-risk import/local slices, and proved that most dead-code findings are framework or test noise. The remaining work is narrower:

- review `depcheck` findings carefully
- remove only dependencies that are truly unused
- decide what ongoing enforcement the brownfield repo can actually sustain

This phase should not overreact to static-tool output. The first job is to separate real cleanup from tool limitations.

## Current State

- `depcheck` currently reports:
  - unused dependencies: `autoprefixer`
  - unused devDependencies: `postcss`
  - missing dependencies: `server-only`, `@clerk/types`
- `server-only` is a known special-case import pattern and may require ignore configuration rather than install/removal.
- `@clerk/types` appears as a likely real missing dependency because the repo imports it in `src/components/auth/clerk-localization.ts`.
- CI currently proves command availability with `--help`, but does not yet enforce dep hygiene beyond discoverability.
- `tsconfig.json` still does not enable `noUnusedLocals` or `noUnusedParameters`, by design.

## Safety Rules

- Do not uninstall anything until the dependency has been checked against runtime, Next/Tailwind conventions, and scripts.
- Treat `depcheck` output as inventory, not truth.
- Do not enable global TypeScript unused enforcement in this phase unless the repo proves it can sustain it.
- Prefer scoped lint or CI enforcement that matches the brownfield slices already proven safe.

## Likely Decision Areas

- whether `autoprefixer` and `postcss` are genuinely unused in the current Tailwind/Next setup
- whether `@clerk/types` should be added explicitly
- whether `depcheck` needs an ignore config for `server-only`
- whether CI should run real dep hygiene checks or keep visibility-only commands
- whether editor or lint guidance should become the durable maintenance contract instead of TS global hard-fail

## Requirements

- `DEPS-01`
- `ENF-01`
