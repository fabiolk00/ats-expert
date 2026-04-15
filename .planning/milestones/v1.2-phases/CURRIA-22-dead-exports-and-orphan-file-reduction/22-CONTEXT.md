# Phase 22 Context

## Phase

Phase 22: Dead Exports and Orphan File Reduction

## Goal

Inventory and reduce dead exports or orphan files with manual validation for dynamic-runtime seams.

## Why This Phase Exists

Phase 20 established the tooling baseline and Phase 21 confirmed the low-risk import/local cleanup slices were already clean. The next useful step is deeper discovery:

- candidate dead exports from `ts-prune`
- candidate orphan files from `madge`

This phase must stay review-driven. The raw tool output already shows many expected false positives caused by Next.js conventions and test-only entrypoints.

## Current State

- `pnpm unused` produces many candidate exports, including obvious framework false positives:
  - `default` page exports
  - `metadata`
  - `runtime`
  - Next middleware/config exports
  - types marked as "used in module"
- `pnpm orphans` reports many files that are valid entrypoints:
  - App Router pages and layouts
  - route tests and component tests
  - `middleware.ts`
- The repo now has working `typecheck`, `lint`, and focused Vitest again after the validation dependency restore in Phase 21.

## Safety Rules

- Do not delete anything based only on raw `ts-prune` or `madge` output.
- Treat all App Router pages, layouts, route handlers, `metadata`, `runtime`, and `middleware.ts` as framework-owned until proven otherwise.
- Treat tests, fixtures, scripts, and helper CLIs as valid standalone entrypoints unless manually proven dead.
- Prefer deleting one low-risk slice with focused proof over broad removal across many modules.

## Likely False-Positive Classes

- `default` exports in `src/app/**`
- `metadata` and `runtime` exports in App Router files
- `middleware.ts` and `config`
- test files reported as orphans
- script-only helpers under `scripts/**`
- exported types used only locally or by tooling seams

## Likely Low-Risk Review Candidates

- small helpers in `src/lib/**` reported by `ts-prune`
- unused auth or billing helpers with no framework ownership
- isolated templates or utility entrypoints with no runtime caller

## Requirements

- `DEAD-01`
