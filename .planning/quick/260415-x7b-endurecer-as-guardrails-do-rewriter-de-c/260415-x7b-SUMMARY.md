# Quick Task 260415-x7b Summary

## What changed

- Replaced the shared resume rewrite guardrails with a stronger Portuguese contract that makes the "never make the resume worse" rule the top priority.
- Reinforced both the low-level section rewriter and the end-to-end ATS rewrite flow so they explicitly apply those guardrails rigorously before any rewrite.
- Updated focused tests so the prompt coverage now proves the stronger guardrail wording is actually flowing into the LLM instructions.

## Verification

- `npx vitest run src/lib/agent/tools/rewrite-section.test.ts src/lib/agent/tools/pipeline.test.ts`
- Result: 2 test files passed, 18 tests passed.
