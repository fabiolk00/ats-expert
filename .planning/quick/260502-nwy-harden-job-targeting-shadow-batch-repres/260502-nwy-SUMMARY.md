# Quick Task 260502-nwy Summary

## Outcome

Hardened the Job Targeting shadow batch runner so 500-case validation reports cannot be mistaken for cutover evidence unless the run is representative, persisted, and rewrite-validated.

## Key Changes

- `JobTargetingShadowCase` now accepts optional `gapAnalysis`.
- Batch results now include `gapAnalysisSource` and `runConfig`.
- Runner uses provided gap analysis, synthetic fallback, or real `analyzeGap` via `--use-real-gap-analysis`.
- Runner supports optional rewrite/trace validation via `--include-rewrite-validation`, using existing `rewriteResumeFull` and structured claim validation without file generation or billing.
- Analyzer aggregates run config, gap-analysis source counts, pipeline representativeness, and rewrite validation coverage.
- `CUTOVER_READY` is now conservative: it stays false for synthetic gap analysis, missing persistence, missing rewrite validation, factual validation issues, blocked rewrite validation, or failed cases.
- Cutover docs now show official `--persist`, real-gap, analyzer, and rewrite-validation sample commands.

## Verification

- `npx vitest run scripts/job-targeting/run-shadow-batch.test.ts scripts/job-targeting/analyze-shadow-divergence.test.ts src/lib/agent/job-targeting/shadow-batch-runner.test.ts`
- `npm run typecheck`
- `npm test`

