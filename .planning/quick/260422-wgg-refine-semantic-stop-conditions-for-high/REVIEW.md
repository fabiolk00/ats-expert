---
phase: 260422-wgg-refine-semantic-stop-conditions-for-high
reviewed: 2026-04-23T02:34:43Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/lib/resume/cv-highlight-artifact.ts
  - src/lib/resume/cv-highlight-artifact.test.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 260422-wgg: Code Review Report

**Reviewed:** 2026-04-23T02:34:43Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the semantic stop-condition and phrase-closure changes in `cv-highlight-artifact.ts` plus the added tests. The happy-path tests pass, but the new heuristics now accept some contextual continuations that should stay outside the highlight. Both issues are compactness regressions: they widen spans beyond the semantic phrase being emphasized, and the current tests do not cover those negative cases.

## Warnings

### WR-01: Comma + Preposition Now Over-Expands Contextual Adjuncts

**File:** `src/lib/resume/cv-highlight-artifact.ts:335-343,583-617`
**Issue:** `startsWithAttachedContinuation()` treats generic prepositional leads (`in`, `on`, `during`, `em`, `para`, etc.) as attached continuations, and the comma branch in `shouldExpandAcrossBoundary()` accepts any attached continuation. That makes comma-separated context read like phrase closure. Repro: `normalizeHighlightSpanBoundaries('Improved store operations, in partnership with finance and logistics across LATAM.', range('Improved store operations'))` returns `Improved store operations, in partnership with finance and logistics across LATAM`, which is broader than the highlighted business action and regresses compactness.
**Fix:**
```ts
if (separatorChar === ',') {
  return HIGHLIGHT_GERUND_CONTINUATION_PATTERN.test(normalized)
    || HIGHLIGHT_COORDINATED_CONTINUATION_PATTERN.test(normalized)
    || isLikelyNounPhraseContinuation(normalized)
    || /^[$\d]/u.test(normalized || trimmed)
}
```
Add a negative test beside the new comma/continuation cases to assert that comma + contextual preposition does not expand.

### WR-02: Phrase Closure Accepts Broad Locative/Context Tails After Metrics

**File:** `src/lib/resume/cv-highlight-artifact.ts:622-675`
**Issue:** `shouldPreferPhraseClosure()` allows whitespace continuations starting with `in|on|during|to|em|no|na|...` whenever the current fragment has an action or metric lead. That is too permissive for compact highlights, because it absorbs contextual tails rather than just the semantic closure. Repro: `normalizeHighlightSpanBoundaries('Reduced latency by 40% in batch pipelines across LATAM.', range('Reduced latency by 40%'))` returns `Reduced latency by 40% in batch pipelines across LATAM`. The meaningful measurable phrase is `Reduced latency by 40%`; the rest is execution context.
**Fix:**
```ts
const prepositionalClosure =
  HIGHLIGHT_DIRECT_CLOSURE_PREPOSITION_PATTERN.test(normalizedAddition)
  && hasActionOrMetricLead(currentFragment)
  && countHighlightWords(normalizedAddition) <= 4
  && !/\b(?:across|with|for|by|via)\b/i.test(normalizedAddition)
```
Or equivalent logic that distinguishes direct-object closure from locative/contextual adjuncts. Add a regression test next to the new positive phrase-closure cases to keep `in batch pipelines across LATAM` out of the highlight.

---

_Reviewed: 2026-04-23T02:34:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
