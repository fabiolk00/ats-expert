# Quick Task 260415-xbf Summary

## What changed

- Reorganized the `rewrite-section` system prompt into a clearer hierarchy with a golden rule, mandatory rules, explicit JSON output contract, section-specific instructions, and pt-BR technical-language guidance.
- Added helper functions to centralize section-specific prompt instructions and to normalize short string lists.
- Limited `changes_made` to a short factual list so oversized model output gets trimmed deterministically instead of bloating the saved rewrite metadata.

## Verification

- `npx vitest run src/lib/agent/tools/rewrite-section.test.ts src/lib/agent/tools/pipeline.test.ts`
- Result: 2 test files passed, 19 tests passed.
