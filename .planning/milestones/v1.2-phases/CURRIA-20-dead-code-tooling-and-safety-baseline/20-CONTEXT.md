# Phase 20 Context

## Phase

Phase 20: Dead-Code Tooling and Safety Baseline

## Goal

Establish a repo-native hygiene toolchain and explicit safety rules before any broad cleanup starts.

## Why This Phase Exists

The new `v1.2` milestone is intentionally about cleanup, but this repo is a brownfield Next.js monolith with API routes, dynamic imports, billing and auth seams, and background-job style flows. Running dead-code tools without guardrails would produce noisy or risky deletions.

This phase therefore creates the baseline:
- add the right repo-native tooling
- expose repeatable scripts
- document false-positive classes before deletion work starts
- prove the toolchain runs in this repo

## Current State

- ESLint already exists, but TypeScript-aware rules are only scoped to selected slices.
- Prettier already exists and is intentionally limited to low-churn areas.
- `package.json` does not yet expose scripts for unused imports, dead exports, orphan files, or dependency drift.
- `tsconfig.json` does not enforce `noUnusedLocals` or `noUnusedParameters`.
- The repo contains known static-analysis risk areas:
  - Next.js routes under `src/app/**`
  - dynamic imports
  - string-driven handlers or workflow seams
  - background-job style flows and polling routes

## Safety Rules

- Do not delete code in this phase.
- Do not enable global TypeScript unused-local enforcement in this phase.
- Prefer scoped lint autofix and inventory tooling over repo-wide mutation.
- Treat static-tool findings as candidates, not truth.

## Files Likely In Scope

- `package.json`
- `.eslintrc.json`
- `tsconfig.json`
- `README.md`
- `docs/developer-rules/QUALITY_BASELINE.md`
- `docs/developer-rules/CODE_STYLE.md`
- `docs/developer-rules/TESTING.md`
- a new operations or developer doc for cleanup workflow and false positives

## Requirements

- `HYG-01`
- `HYG-02`
