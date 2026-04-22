---
phase: 93-summary-editorial-hardening-reduce-repetition-and-increase-i
reviewed: 2026-04-22T09:43:13.7019556Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/CurrIA/src/lib/agent/tools/rewrite-resume-full.ts
  - C:/CurrIA/src/lib/agent/tools/rewrite-section.ts
  - C:/CurrIA/src/lib/agent/tools/pipeline.test.ts
  - C:/CurrIA/src/lib/agent/tools/rewrite-section.test.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 93: Code Review Report

**Reviewed:** 2026-04-22T09:43:13.7019556Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the Phase 93 summary hardening changes in the ATS/full-rewrite path and the summary sanitization tests. The scoped tests pass, but there are two logic mismatches in the new summary heuristics: one leaks the ATS-only rule set into `job_targeting`, and one rejects additive two-sentence summaries that the prompt explicitly says are allowed.

## Warnings

### WR-01: ATS-only two-sentence gate now changes `job_targeting` summary behavior

**File:** `C:/CurrIA/src/lib/agent/tools/rewrite-resume-full.ts:257-265`
**Issue:** `job_targeting` still tells the model to produce a `4 to 6 concise lines` summary, but the shared noise detector now treats any summary with more than 2 sentences as structurally noisy (`:455-457`) and the shared retry path applies that check in both modes (`:676-691`). In practice, a valid job-targeted summary can now be forced into an extra assertive retry only because the ATS editorial rule leaked into another workflow.
**Fix:**
```ts
function isVisibleRewriteTooClose(
  mode: 'ats_enhancement' | 'job_targeting',
  section: RewriteSectionName,
  currentCvState: CVState,
  nextSectionData: unknown,
): boolean {
  // ...
  if (section === 'summary') {
    const isNoisy = mode === 'ats_enhancement'
      ? isAtsSummaryStructurallyNoisy(nextSectionData as string)
      : false
    // ...
  }
}
```

Or, if the new summary contract is intended for both modes, update `buildTargetJobSectionInstructions()` to the same 1-2 sentence rule and add a `job_targeting` regression test.

### WR-02: Repeated-domain detector contradicts the “additive second sentence” rule

**File:** `C:/CurrIA/src/lib/agent/tools/rewrite-resume-full.ts:190-193`
**Issue:** The prompt explicitly allows a repeated domain/role phrase when the second sentence adds materially new information, but `hasRepeatedSummaryDomainPhrasing()` (`:400-410`) marks several repeated domain phrases as noisy unconditionally, and `isAtsSummaryStructurallyNoisy()` rejects them (`:467-472`) before additivity is considered. This can force retries for strong summaries such as “Especialista em engenharia de dados... Atua em engenharia de dados para billing e lakehouse...”, even though the second sentence is additive and prompt-compliant.
**Fix:**
```ts
function hasRepeatedSummaryDomainPhrasing(summary: string): boolean {
  const sentences = splitSummarySentences(summary)
  if (sentences.length < 2) return false

  for (let index = 0; index < sentences.length - 1; index += 1) {
    const current = normalizeForVisibilityCheck(sentences[index] ?? '')
    const next = normalizeForVisibilityCheck(sentences[index + 1] ?? '')

    const repeatsDomain =
      /\bbusiness intelligence\b|\bengenharia de dados\b|\banalytics engineer\b|\banalista de dados\b/.test(current)
      && /\bbusiness intelligence\b|\bengenharia de dados\b|\banalytics engineer\b|\banalista de dados\b/.test(next)

    if (repeatsDomain && calculateTokenSimilarity(current, next) >= 0.7) {
      return true
    }
  }

  return false
}
```

That keeps the duplicate/noisy case blocked while preserving the explicitly allowed additive case. Add a unit test for a repeated-domain but additive two-sentence ATS summary.

---

_Reviewed: 2026-04-22T09:43:13.7019556Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
