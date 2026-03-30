# OpenAI Model Selection Checklist

This checklist tracks the end-to-end rollout of OpenAI model selection, validation, and launch.

Use it together with:

- [openai-model-selection-matrix.md](/c:/CurrIA/docs/openai-model-selection-matrix.md)
- [openai-portuguese-quality-gate.md](/c:/CurrIA/docs/openai-portuguese-quality-gate.md)
- [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [openai-migration-monitoring.md](/c:/CurrIA/docs/openai-migration-monitoring.md)
- [openai-migration-rollback.md](/c:/CurrIA/docs/openai-migration-rollback.md)

## Phase 1 - OpenAI Cost and Quality Matrix (5-6 hours)

Owner:
Target date:
Status:

- [ ] Recruit a native Brazilian Portuguese evaluator
- [ ] Confirm evaluator background is suitable for resume-quality review
- [ ] Prepare 10 samples covering multiple industries and seniority levels
- [ ] Confirm the sample mix covers:
  - [ ] `rewrite_section`
  - [ ] `create_target_resume`
  - [ ] conversational agent output
- [ ] Generate `combo_a` outputs for all samples
- [ ] Generate `combo_b` outputs for all samples
- [ ] Generate `combo_c` outputs for all samples
- [ ] Remove model labels before human evaluation
- [ ] Score all samples using the official rubric
- [ ] Record results in [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [ ] Compute quality and average cost per sample for each combo
- [ ] Make final model decision:
  - [ ] `COMBO_A`
  - [ ] `COMBO_B`
  - [ ] `COMBO_C`
  - [ ] `HOLD`

Gate:
- a selected combo should be `>= 4.0` to proceed without explicit exception handling

## Phase 2 - Code Review and Validation (2-3 hours)

Owner:
Target date:
Status:

- [ ] Confirm `OPENAI_MODEL_COMBO` is set intentionally for the test or launch
- [ ] Confirm the OpenAI client is centralized in [client.ts](/c:/CurrIA/src/lib/openai/client.ts)
- [ ] Confirm model routing in [config.ts](/c:/CurrIA/src/lib/agent/config.ts):
  - [ ] selected combo is correct
  - [ ] `agent` model is correct
  - [ ] `structured` model is correct
  - [ ] `vision` model is correct
- [ ] Confirm usage tracking in [usage-tracker.ts](/c:/CurrIA/src/lib/agent/usage-tracker.ts) uses:
  - [ ] `model`
  - [ ] `inputTokens`
  - [ ] `outputTokens`
  - [ ] dynamic pricing by model
- [ ] Confirm OpenAI response parsing is correct:
  - [ ] `choices[0].message.content`
  - [ ] `tool_calls`
  - [ ] `prompt_tokens`
  - [ ] `completion_tokens`
- [ ] Confirm the `/api/agent` SSE contract is unchanged for the frontend
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Run `npm run build`

Gate:
- all four commands must pass before any staging or production rollout

## Phase 3 - Documentation Updates (1-2 hours)

Owner:
Target date:
Status:

- [ ] Update [README.md](/c:/CurrIA/README.md) with the final selected combo
- [ ] Update [CLAUDE.md](/c:/CurrIA/CLAUDE.md) with the final model rationale
- [ ] Update [openai-model-selection-matrix.md](/c:/CurrIA/docs/openai-model-selection-matrix.md) with the approved outcome if needed
- [ ] Finalize [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [ ] Confirm [architecture-overview.md](/c:/CurrIA/docs/architecture-overview.md) reflects the final model state
- [ ] Confirm env docs reference `OPENAI_MODEL_COMBO`

Gate:
- docs must match the actual runtime combo

## Phase 4 - Deployment Preparation (1-2 hours)

Owner:
Target date:
Status:

- [ ] Deploy the approved combo to staging
- [ ] Run smoke tests for:
  - [ ] `/api/agent`
  - [ ] resume rewrite flow
  - [ ] target resume flow
  - [ ] OCR flow
- [ ] Set up the monitoring views from [openai-migration-monitoring.md](/c:/CurrIA/docs/openai-migration-monitoring.md)
- [ ] Record the pre-launch cost baseline
- [ ] Record the pre-launch latency baseline
- [ ] Confirm incident response ownership using [openai-migration-rollback.md](/c:/CurrIA/docs/openai-migration-rollback.md)
- [ ] Confirm rollback procedure is understood before production

Gate:
- staging must be healthy and monitoring must be active before production rollout

## Phase 5 - Production Deployment (30 min - 2 hours)

Owner:
Target date:
Status:

- [ ] Final model decision approved
- [ ] Final model state reflected in code and docs
- [ ] Final commit created with the test-results reference
- [ ] Push to `main`
- [ ] Deploy to production
- [ ] Monitor the first 30 minutes actively
- [ ] Verify:
  - [ ] end-to-end agent flow works
  - [ ] rewrite quality is acceptable
  - [ ] target resume flow works
  - [ ] no abnormal error spikes

Gate:
- no critical incident during the first 30 minutes

## Phase 6 - Post-Launch Validation (Days 1-7)

Owner:
Target date:
Status:

- [ ] Review daily error rate
- [ ] Review daily cost trend
- [ ] Review daily latency trend
- [ ] Review Portuguese quality feedback from real usage
- [ ] Review 3-day average cost
- [ ] Review 3-day average latency
- [ ] Confirm zero critical issues in the first 24 hours
- [ ] Sign off the selected combo when stable

Success thresholds:
- error rate `< 1%`
- monthly cost trend in expected range
- p95 latency `< 10s`
- zero critical launch issues

## Final sign-off

- Final combo:
- Approved by:
- Approval date:
- Notes:
