# 20-03 Summary

## Outcome

Made the hygiene baseline discoverable from contributor entrypoints and added a conservative CI visibility check for the new commands.

## Changes

- Added the dead-code workflow link to `docs/developer-rules/README.md`.
- Added a CI step that runs `unused`, `depcheck`, and `orphans` in help mode to prove tool availability without turning noisy findings into a hard gate.
- Synchronized roadmap, requirements, and phase state to mark Phase 20 complete.

## Verification

- `pnpm lint`
- `rg -n "dead-code|unused|depcheck|orphans" docs/developer-rules/README.md .github/workflows/ci.yml package.json`
