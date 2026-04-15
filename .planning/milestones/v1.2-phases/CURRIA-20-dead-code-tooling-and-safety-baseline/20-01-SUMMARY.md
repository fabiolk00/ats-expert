# 20-01 Summary

## Outcome

Established the dead-code tooling baseline in the repo without enabling aggressive global enforcement.

## Changes

- Added `eslint-plugin-unused-imports`, `ts-prune`, `depcheck`, and `madge` to the dev toolchain.
- Added scripts for `lint:types:fix`, `unused`, `depcheck`, `orphans`, and `hygiene:inventory` in `package.json`.
- Scoped unused-import autofix into the existing TypeScript-aware ESLint slice in `.eslintrc.json`.
- Updated `README.md` with the staged hygiene command flow.

## Verification

- `pnpm lint`
- `pnpm unused --help`
- `pnpm depcheck --help`
- `pnpm orphans --help`
