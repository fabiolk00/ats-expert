---
phase: 260422-suf-normalize-highlight-span-boundaries-igno
reviewed: 2026-04-23T00:03:23.5113886Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/lib/resume/cv-highlight-artifact.ts
  - src/lib/resume/cv-highlight-artifact.test.ts
  - src/lib/agent/tools/detect-cv-highlights.test.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 260422-suf: Code Review Report

**Reviewed:** 2026-04-23T00:03:23.5113886Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the boundary-normalization changes in the highlight artifact logic plus the updated unit coverage around resume highlight detection. The fail-close payload handling in `detect-cv-highlights.test.ts` remains intact, but the new boundary refinement logic introduces one correctness regression on parenthetical continuations and one safety hole in the pipe-stack guard. The added tests do not currently cover either case.

## Warnings

### WR-01: Parenthetical continuation expansion drops the closing delimiter

**File:** `src/lib/resume/cv-highlight-artifact.ts:472-518`
**Issue:** `normalizeHighlightSpanBoundaries()` expands across `(` and `[` via `expandRangeRightAcrossSeparator()`, but `readShortContinuationEnd()` never stops on `)` or `]`. The later edge trim then removes the closing delimiter as ignorable noise. Repro: normalizing `governance workflows` inside `Built governance workflows (Azure Databricks).` returns `governance workflows (Azure Databricks`, which is still a broken mid-phrase highlight.
**Fix:**
```ts
function readShortContinuationEnd(
  text: string,
  start: number,
  openingChar?: string,
): number | null {
  const closingChar = openingChar === '(' ? ')' : openingChar === '[' ? ']' : null
  let cursor = start

  while (cursor < text.length && cursor - start <= HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS) {
    const char = text[cursor]
    if (closingChar && char === closingChar) {
      return cursor + 1
    }
    // existing stop conditions...
    cursor += 1
  }

  return cursor > start ? cursor : null
}
```

### WR-02: Mixed alphanumeric pipe stacks bypass the new micro-span guard

**File:** `src/lib/resume/cv-highlight-artifact.ts:584-610`
**Issue:** `isLikelyPipeStackText()` disables stack detection for the entire item when any segment contains a digit, `$`, or `%`. That lets noisy single-atom highlights survive in mixed stacks such as `Python | SQL | dbt | ISO 27001`. Repro: `validateAndResolveHighlights()` currently preserves a `SQL` micro-span in that string instead of failing closed. This weakens the intended stack-pipe safety policy.
**Fix:**
```ts
function isLikelyPipeStackText(text: string): boolean {
  const segments = text
    .split(HIGHLIGHT_STACK_SEPARATOR_CHAR)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length < 3) {
    return false
  }

  const informativeSegments = segments.filter((segment) => (
    !HIGHLIGHT_VERB_HINT_PATTERN.test(segment)
    && countHighlightWords(segment) <= 3
  ))

  return informativeSegments.length >= segments.length - 1
}
```

## Info

### IN-01: Regression coverage misses the new failing boundary cases

**File:** `src/lib/resume/cv-highlight-artifact.test.ts:398-444`
**Issue:** The new tests cover inner-parenthetical token repair and alphabetic pipe stacks, but they do not exercise cross-parenthesis continuation repair or mixed alphanumeric pipe stacks. Both behaviors currently regress in live outputs, so the suite would not catch them.
**Fix:** Add explicit cases for `Built governance workflows (Azure Databricks).` expecting the balanced closing `)` to survive, and for `Python | SQL | dbt | ISO 27001` expecting the `SQL` micro-span to be dropped.

---

_Reviewed: 2026-04-23T00:03:23.5113886Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
