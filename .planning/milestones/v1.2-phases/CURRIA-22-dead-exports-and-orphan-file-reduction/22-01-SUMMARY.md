# 22-01 Summary

## Outcome

Turned the raw `ts-prune` and `madge` output into a reviewed inventory instead of treating tool output as deletion truth.

## Changes

- Added `docs/operations/dead-code-inventory.md`.
- Classified findings into false positive, manual review, and deletion candidate buckets.
- Recorded the main framework-driven noise classes from Next.js entrypoints, tests, middleware, and generated `.next/types/**`.

## Verification

- `pnpm unused`
- `pnpm orphans`
- `rg -n "false positive|manual review|deletion candidate" docs/operations/dead-code-inventory.md`
