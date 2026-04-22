# Phase 93 Review Fix

## Reviewer findings addressed

### WR-01: ATS-only summary hardening leaked into `job_targeting`

- Updated [rewrite-resume-full.ts](/c:/CurrIA/src/lib/agent/tools/rewrite-resume-full.ts) so the new summary-noise gate only applies to `ats_enhancement`.
- `job_targeting` keeps its prior behavior; the editorial hardening does not silently force extra retries there.

### WR-02: repeated-domain detector was too aggressive for additive summaries

- Tightened repeated-domain detection so it only flags genuinely duplicate-ish adjacent domain phrasing.
- Additive second sentences that reuse the same domain but add new stack / scope / impact context now remain valid.

## Revalidation after fix

- `npx vitest run "src/lib/agent/tools/pipeline.test.ts" "src/lib/agent/tools/rewrite-section.test.ts" "src/lib/ats/scoring/index.test.ts"`
- `npm run typecheck`

## Classification

This review fix was logic-affecting, but remained editorial-only.

- no ATS gate changed
- no ATS score policy changed
- no export / UI behavior changed
