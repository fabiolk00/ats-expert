# Quick Task 260429-pdc: Delete Dead Job Targeting Diff Code

## Goal

Remove dead code left after simplifying the Job Targeting resume review screen.

## Scope

- Delete the unused `RewriteDiffPanel` UI component and its tests.
- Delete the unused rewrite-change summary builder and its tests.
- Remove `rewriteChanges` from the active `JobTargetingExplanation` contract.
- Remove logs/metrics that existed only for rewrite-change summaries.
- Keep target recommendations, review warnings, generated resume preview, and ATS Enhancement comparison behavior intact.

## Validation

- `rg -n "RewriteDiffPanel|rewrite-diff-panel|rewriteChanges|RewriteChangeSummary|buildRewriteChangeSummary|rewrite-change-summary|architecture\\.job_targeting\\.rewrite_changes" src`
- `npm test -- src/components/resume/resume-comparison-view.test.tsx src/lib/agent/tools/pipeline.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
