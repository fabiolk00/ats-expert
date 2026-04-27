# Phase 108 Review Fix

## Reviewed Findings Resolved

### WR-01

- Issue: the first generic extraction rewrite dropped multi-word signals such as `Power BI` in low-confidence fallback paths.
- Fix:
  - replaced the old domain-specific phrase list with a generic lexical extractor
  - added phrase n-grams from longer JD segments
  - tightened generic stop-word filtering
- Proof:
  - `build-targeting-plan.test.ts` now confirms multi-word signal preservation in the fallback scenario

### WR-02

- Issue: semantic fallback output from the LLM could be trusted without grounding to real resume terms or spans.
- Fix:
  - grounded `matchedResumeTerms` and `supportingResumeSpans` back to actual `resumeEvidence`
  - downgraded ungrounded fallback results to `unsupported_gap`
  - inferred supporting spans only from evidence that actually exists in the resume
- Proof:
  - `evidence-classifier.test.ts` now covers ungrounded fallback downgrade

### WR-03

- Issue: once `targetEvidence` existed, validation returned early and could skip the target-role self-presentation backstop.
- Fix:
  - kept evidence-aware validation
  - restored a low-confidence/self-presentation guard by checking leading role claims in the optimized summary against allowed direct/normalized role evidence and original role history
- Proof:
  - `validate-rewrite.test.ts` now covers unsupported target-role self-presentation even when `targetEvidence` is present

## Regression Check

- `npm run typecheck`
- `npx vitest run src/lib/agent/job-targeting/evidence-classifier.test.ts src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/pipeline.test.ts src/app/api/profile/ats-enhancement/route.test.ts src/app/api/profile/smart-generation/route.test.ts src/app/api/session/[id]/route.test.ts`

All passed after the fixes.
