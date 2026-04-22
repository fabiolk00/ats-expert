---
phase: CURRIA-94-promote-core-contextual-stack-evidence-in-preview-highlights
reviewed: 2026-04-22T09:44:23.5234486Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/CurrIA/src/lib/resume/optimized-preview-highlights.ts
  - C:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts
  - C:/CurrIA/src/lib/resume/optimized-preview-contracts.test.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 94: Code Review Report

**Reviewed:** 2026-04-22T09:44:23.5234486Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Phase 94 preview-highlight changes with emphasis on Phase 92 metric preservation, Layer 3 ordering stability, and accidental eligibility broadening. The targeted Vitest suite passes, but the new contextual-stack scoring introduces two logic regressions: terse stack-only rewrites can now cross the evidence gate, and the rendered highlight can drop the contextual words that justified the score.

## Warnings

### WR-01: Stack-Only Rewrites Now Qualify As High-Evidence Contextual Highlights

**File:** `C:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:510-541,967-1020,1205-1251`
**Issue:** The new `core_contextual_stack` path double-counts stack nouns as both technology and delivery context. `hasConcreteDeliveryContext()` now accepts `etl`, `elt`, and `dashboard`, and `isMeaningfulExperienceContext()` also treats those same terms as substantive context. That means terse rewrites such as `Desenvolvi ETL e SQL.` or `Implementei SQL, ETL e Power BI.` now score around `97-99` and become `eligible`, even though they are still just stack mentions with no real scope, outcome, or delivery evidence. This is a hidden eligibility broadening relative to the pre-Phase-94 behavior.
**Fix:**
```ts
function hasConcreteDeliveryContext(text: string): boolean {
  const normalized = normalizeText(text)
  return /\b(governan\w*|process\w*|integrac\w*|ingest\w*|arquitet\w*|orquestr\w*|lakehouse|warehouse|dataset\w*|modelo\w*|camada\w*|job\w*|transformac\w*|indicador\w*)\b/.test(normalized)
}

const contextualEvidence = classifyContextualStackEvidence(text, text, techTermCount)
```
Also add a regression test that keeps `Desenvolvi ETL e SQL.` and `Implementei SQL, ETL e Power BI.` ineligible.

### WR-02: Rendered "Core Contextual Stack" Highlights Can Lose The Context That Justified Them

**File:** `C:/CurrIA/src/lib/resume/optimized-preview-highlights.ts:570-577,891-907,967-971`
**Issue:** `extractContextualStackCore()` trims contextual-stack candidates down to the technology cluster, but the score still borrows execution and delivery context from the full `optimized` bullet. In practice, a bullet like `Implementei SQL, Python e Power BI para dashboards internos.` renders the highlight as `Implementei SQL, Python e Power BI`, and `Desenvolvi pipelines ETL completos no Azure Databricks com PySpark para governanca analitica.` can render as just `Azure Databricks`. The visible span therefore looks stack-only even when the scorer treated it as "core contextual" evidence, which makes the preview misleading and hard to reason about.
**Fix:**
```ts
if (category === "contextual_stack") {
  const completed = completeContextualStackSpan(optimized, start, end)
  nextStart = completed.start
  nextEnd = completed.end
  nextText = completed.text
}

const contextualEvidence = classifyContextualStackEvidence(nextText, nextText, countTechTerms(nextText))
if (category === "contextual_stack" && contextualEvidence === "technology_only") return null
```
Update the new positive tests to assert that a promoted contextual-stack span still includes at least one delivery/execution anchor, not just a tool or vendor name.

---

_Reviewed: 2026-04-22T09:44:23.5234486Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
