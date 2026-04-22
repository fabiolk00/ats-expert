---
phase: 92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi
reviewed: 2026-04-22T01:06:46.0128863Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/lib/resume/optimized-preview-highlights.ts
  - src/lib/resume/optimized-preview-highlights.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 92: Code Review Report

**Reviewed:** 2026-04-22T01:06:46.0128863Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the Phase 92 Layer 1 evidence split and the focused tests around preserved metrics, superficial stack mentions, and Layer 3 ordering. The committed Vitest suites passed:

- `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts`
- `npx vitest run src/lib/resume/optimized-preview-contracts.test.ts`

Preserved metric recovery and Layer 3 ordering look correct, but there is still one Layer 1 eligibility regression for stack-only rewrites phrased with a strong verb.

## Warnings

### WR-01: Improvement path still marks stack-only bullets as eligible

**File:** `src/lib/resume/optimized-preview-highlights.ts:1184-1195`
**Issue:** `qualifiesByImprovement` allows stack-only rewrites with a strong verb to become `eligible: true` even when `evidenceScore` is `0` and no renderable highlight candidate exists. Example repro from the current code: `evaluateExperienceBulletImprovement("Apoiei rotinas internas do time.", "Implementei SQL e Python para o time.")` returns `eligible: true`, `improvementScore: 7`, `evidenceScore: 0`. That conflicts with the phase decision that superficial technology mentions must not open Layer 1 eligibility without measurable or scope-anchored evidence. The preview currently suppresses these bullets only because `buildBulletHighlight(...)` separately requires a visible candidate, so any caller that trusts `eligible` alone will still misclassify them.
**Fix:**
```ts
const eligible =
  bestCandidate !== null
  && (
    evidenceScore >= EXPERIENCE_BULLET_EVIDENCE_THRESHOLD
    || qualifiesByImprovement
  )
```

Also add a regression test that uses strong-verb stack-only phrasing, for example `"Implementei SQL e Python para o time."`, and asserts `eligible === false`.

---

_Reviewed: 2026-04-22T01:06:46.0128863Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
