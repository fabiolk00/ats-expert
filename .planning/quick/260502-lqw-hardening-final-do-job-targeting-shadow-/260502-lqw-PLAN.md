# Quick Task 260502-lqw: Job Targeting Compatibility Hardening

**Date:** 2026-05-02
**Status:** Completed

## Goal

Harden the new `JobCompatibilityAssessment` architecture for production observation without prematurely making it the source of truth.

## Ordered Execution

1. Add feature flags and shadow-mode pipeline behavior.
2. Add safe shadow comparison logs and cutover policy docs.
3. Fix deterministic score weighting for absent dimensions.
4. Add catalog governance fields and validators.
5. Restrict optional LLM ambiguity resolver so it cannot promote claims to supported.
6. Add section rewrite plan and generated claim traces.
7. Make structured validation consume traces and fail missing traces for new generated text.
8. Add evidence source confidence and weak/negative qualifier handling.
9. Mark legacy adapters deprecated and guard import count.
10. Add feedback endpoint/storage contract and divergence analysis script.
11. Add mutation/adversarial tests and strengthen hardcode guard.
12. Verify low-fit override never releases factual violations.

## Key Files

- `src/lib/agent/job-targeting-pipeline.ts`
- `src/lib/agent/job-targeting/compatibility/**`
- `src/lib/agent/job-targeting/catalog/**`
- `src/lib/agent/tools/rewrite-resume-full.ts`
- `src/lib/agent/tools/rewrite-section.ts`
- `src/lib/agent/tools/validate-rewrite.ts`
- `src/lib/agent/job-targeting/validation-policy.ts`
- `src/types/agent.ts`
- `src/types/cv.ts`
- `src/app/api/job-targeting/feedback/route.ts`
- `docs/job-targeting/*.md`
- `scripts/job-targeting/analyze-shadow-divergence.ts`

## Verification

- Targeted Vitest suite for job targeting compatibility, pipeline, rewrite validation, override, and feedback.
- `npm run typecheck`.
- Hardcode guard must still pass.
- Golden cases must still pass.

## Result

- Implemented shadow-mode feature flags, safe comparison logging, cutover docs, and divergence analysis script.
- Hardened catalog governance, deterministic scoring, LLM resolver limits, source-confidence matching, weak/negative qualifier handling, rewrite traces, and structured validation.
- Added feedback persistence/API, legacy adapter deprecation/usage guard, mutation/adversarial coverage, and source-of-truth cutover safeguards.

## Final Verification

- `npx vitest run src/lib/agent/job-targeting/__tests__ src/lib/agent/job-targeting/evidence-classifier.test.ts src/lib/agent/job-targeting/job-targeting-compatibility-regression.test.ts src/lib/agent/job-targeting/low-fit-warning-gate.test.ts src/lib/agent/job-targeting/score-breakdown.test.ts src/lib/agent/job-targeting/target-recommendations.test.ts src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/pipeline.test.ts src/app/api/job-targeting/feedback/route.test.ts src/lib/db/schema-guardrails.test.ts` passed: 27 files, 200 tests.
- `npm run typecheck` passed.
- `npm test` passed.
- `git diff --check` passed, with only existing CRLF normalization warnings.
- `src/lib/agent/job-targeting/__tests__/hardcode-guard.test.ts` passed.
