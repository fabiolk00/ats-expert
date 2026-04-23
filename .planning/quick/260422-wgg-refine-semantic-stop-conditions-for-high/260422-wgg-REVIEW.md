## ISSUES FOUND

**Task:** 260422-wgg
**Plan checked:** `260422-wgg-PLAN.md`
**Verdict:** Close, but not sufficient yet. The plan is directionally correct for phrase-boundary refinement, but it leaves one active expansion seam underspecified and does not yet lock the no-whole-line-noise guarantee through the real validation path.

### Blockers

**1. [key seam] Task 1 does not explicitly cover the non-separator phrase-closure path**

- Plan refs: `260422-wgg-PLAN.md:21-27`
- Code refs: `src/lib/resume/cv-highlight-artifact.ts:591-628`, `src/lib/resume/cv-highlight-artifact.ts:666-693`, `src/lib/resume/cv-highlight-artifact.ts:844-845`
- Why it matters: the goal is "smallest complete meaningful phrase" closure, but `normalizeHighlightSpanBoundaries(...)` has two right-expansion paths: `expandRangeRightAcrossSeparator(...)` and `expandRangeRightForPhraseClosure(...)`. The plan names `readShortContinuationEnd(...)` and `shouldExpandAcrossBoundary(...)`, but not `shouldPreferPhraseClosure(...)` / `expandRangeRightForPhraseClosure(...)`. An executor could refine separator crossing and still leave direct phrase-closure behavior inconsistent with the new stop semantics.
- Fix: make Task 1 explicitly include all right-expansion seams used by `normalizeHighlightSpanBoundaries(...)`, especially `shouldPreferPhraseClosure(...)` and `expandRangeRightForPhraseClosure(...)`.

### Warnings

**1. [test gap] Whole-line noise is not proven end-to-end**

- Plan refs: `260422-wgg-PLAN.md:5`, `260422-wgg-PLAN.md:11`, `260422-wgg-PLAN.md:44-60`
- Current test refs: `src/lib/resume/cv-highlight-artifact.test.ts:272-296`, `src/lib/resume/cv-highlight-artifact.test.ts:365-469`
- Why it matters: the current suite proves editorial coverage thresholds in isolation and local boundary behavior in isolation, but not the combined path `normalizeHighlightSpanBoundaries(...) -> validateAndResolveHighlights(...)` on a long realistic bullet. That means a regression could still widen a detector-truncated span into noisy near-whole-line coverage without a targeted test catching the actual pipeline effect.
- Fix: add at least one `validateAndResolveHighlights(...)` regression for a long bullet where a truncated span should close locally but must not widen into a broad promotional or near-whole-line span.

**2. [test seam] Task 3 only re-runs detector tests; it does not lock the changed behavior at the detector boundary**

- Plan refs: `260422-wgg-PLAN.md:67-78`
- Current test refs: `src/lib/agent/tools/detect-cv-highlights.test.ts:102-134`
- Why it matters: the detector suite is mostly payload-shape and fail-closed coverage. It currently has only a basic normalized-range assertion, not a case shaped like this bug. Re-running the suite is useful, but it does not prove the downstream contract for a truncated highlight that should now stop at the right semantic boundary.
- Fix: add one detector-facing regression where the mocked model returns a truncated-but-nearly-correct range and the final resolved output stays compact, avoids pipe grouping, and does not widen into whole-line noise.

### Recommendation

Revise the plan before execution:

1. Expand Task 1 so it explicitly covers both right-expansion seams inside `normalizeHighlightSpanBoundaries(...)`.
2. Expand Task 2 with an end-to-end `validateAndResolveHighlights(...)` regression for long-bullet compactness / whole-line-noise protection.
3. Expand Task 3 with one detector-facing semantic-boundary fixture instead of only rerunning existing tests.

With those additions, the plan should be sufficient for the stated goal.
