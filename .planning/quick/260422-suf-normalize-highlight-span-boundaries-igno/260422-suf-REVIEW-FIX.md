# Quick Task 260422-suf - Review Fix

## Findings Addressed

1. Balanced parenthetical continuations could lose the closing wrapper after boundary expansion.
   Fixed by preserving matched `()` and `[]` wrappers during edge trimming so refined highlights no longer stop at `(...` without the closing delimiter.

2. Mixed alphanumeric pipe lists could preserve weak micro-spans such as `SQL` in `Python | SQL | dbt | ISO 27001`.
   Fixed by keeping pipe-stack suppression based on separator density and verb absence instead of disabling it when digits or currency symbols appear in the line.

3. Regression coverage missed both cases above.
   Added tests for:
   - balanced parenthetical continuation across `(`
   - mixed alphanumeric flat pipe-stack suppression

## Re-Verification

- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`
- `npx vitest run src/components/resume/resume-comparison-view.test.tsx`
- `npm run typecheck`

All checks passed after the fixes.
