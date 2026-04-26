# Quick Task Plan — 260426-qfa

## Goal

Fix the architecture proof pack failure caused by `preview-lock-transverse.test.ts` mocking an outdated `@/lib/db/sessions` contract.

## Scope

- Update the test mock to include the current file-access session lookup exports.
- Re-run the focused regression and the full architecture proof pack.

## Guardrails

- No production behavior changes.
- No route logic changes.
- Keep the fix isolated to test scaffolding.
