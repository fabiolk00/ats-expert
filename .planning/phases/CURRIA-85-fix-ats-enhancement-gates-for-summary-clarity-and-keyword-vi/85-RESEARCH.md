# Phase 85 Research

## Code Path Map

### Summary clarity gate

- `src/lib/agent/ats-enhancement-pipeline.ts`
- `src/lib/ats/scoring/index.ts`
- `src/lib/ats/scoring/quality-gates.ts`

The old gate treated summary improvement mostly as "changed and longer", which conflicted with the rewrite strategy that explicitly aims for concise executive summaries.

### Keyword visibility gate

- `src/lib/agent/tools/rewrite-resume-full.ts`
- `src/lib/ats/scoring/index.ts`
- `src/lib/ats/scoring/quality-gates.ts`
- `src/lib/ats/score.ts`

In `ats_enhancement`, `optimizationSummary.keywordCoverageImprovement` was usually `undefined`, so the gate fell back to `scoreATS(...).breakdown.keywords` without a JD. That score is mainly an action-verb proxy, not a real ATS keyword visibility signal.

## Root Cause

1. Summary clarity used a size-biased heuristic instead of structural quality.
2. ATS enhancement did not emit an explicit keyword visibility signal.
3. The no-JD fallback keyword score was too weak to be the primary decision input.
