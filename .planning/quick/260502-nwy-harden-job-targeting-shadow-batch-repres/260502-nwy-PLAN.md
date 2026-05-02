# Quick Task 260502-nwy: Harden Job Targeting Shadow Batch Representativeness

**Date:** 2026-05-02
**Status:** Completed

## Goal

Make the Job Targeting shadow batch runner safe to use as cutover evidence by recording execution mode, supporting provided or real gap analysis, adding conservative report representativeness checks, and optionally exercising rewrite trace validation without generating artifacts or charging credits.

## Tasks

1. Extend shadow case/result contracts with optional `gapAnalysis`, `gapAnalysisSource`, `runConfig`, and richer validation snapshots.
2. Update the batch runner to use provided gap analysis, optionally call real `analyzeGap`, default to deterministic synthetic fallback, and carry run config into every JSONL result.
3. Add optional rewrite/trace validation using the existing `rewriteResumeFull` and structured claim validation path, without artifact generation or billing.
4. Harden the analyzer so `CUTOVER_READY` is false when representativeness is partial, persistence is missing, rewrite validation is missing, or case failures/factual violations exist.
5. Update docs and tests for runner/analyzer behavior, including persistence, run config, gap-analysis source, and rewrite validation coverage.

## Verification

- Focused runner/analyzer tests.
- `npm run typecheck`
- `npm test`

## Results

- `npx vitest run scripts/job-targeting/run-shadow-batch.test.ts scripts/job-targeting/analyze-shadow-divergence.test.ts src/lib/agent/job-targeting/shadow-batch-runner.test.ts` passed.
- `npm run typecheck` passed.
- `npm test` passed.
