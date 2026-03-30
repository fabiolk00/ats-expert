# OpenAI Migration Checklist

This checklist tracks the end-to-end rollout of the Anthropic-to-OpenAI migration.

Use it together with:

- [openai-portuguese-quality-gate.md](/c:/CurrIA/docs/openai-portuguese-quality-gate.md)
- [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [openai-migration-monitoring.md](/c:/CurrIA/docs/openai-migration-monitoring.md)
- [openai-migration-rollback.md](/c:/CurrIA/docs/openai-migration-rollback.md)

## Phase 1 - Portuguese Quality Validation (5-6 hours)

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
- [ ] Generate Claude Haiku outputs for all samples
- [ ] Generate GPT-5 Mini outputs for all samples
- [ ] Remove provider labels before human evaluation
- [ ] Score all samples using the official rubric
- [ ] Record results in [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [ ] Compute GPT global average
- [ ] Make final gate decision:
  - [ ] `OPENAI FULL`
  - [ ] `HYBRID`
  - [ ] `REVERT TO CLAUDE`

Gate:
- GPT average must be `>= 4.0` to proceed with full OpenAI rollout

## Phase 2 - Code Review and Validation (2-3 hours)

Owner:
Target date:
Status:

- [ ] Search for remaining Anthropic runtime references
- [ ] Confirm the OpenAI client is centralized in [client.ts](/c:/CurrIA/src/lib/openai/client.ts)
- [ ] Confirm model routing in [config.ts](/c:/CurrIA/src/lib/agent/config.ts):
  - [ ] `agent = gpt-5.4-mini`
  - [ ] `structured = gpt-5-mini`
  - [ ] `vision = gpt-5-mini`
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

- [ ] Update [README.md](/c:/CurrIA/README.md) with the final provider decision
- [ ] Update [CLAUDE.md](/c:/CurrIA/CLAUDE.md) with the final provider rationale
- [ ] Finalize [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)
- [ ] Confirm [architecture-overview.md](/c:/CurrIA/docs/architecture-overview.md) reflects the final provider state
- [ ] Confirm [error-codes.md](/c:/CurrIA/docs/error-codes.md) does not reference the wrong provider
- [ ] Confirm env docs reference the final provider key(s)

Gate:
- docs must match the actual runtime strategy: OpenAI full, hybrid, or Claude revert

## Phase 4 - Deployment Preparation (1-2 hours)

Owner:
Target date:
Status:

- [ ] Deploy the migration candidate to staging
- [ ] Run smoke tests for:
  - [ ] `/api/agent`
  - [ ] resume rewrite flow
  - [ ] target resume flow
  - [ ] OCR flow
- [ ] Set up the migration monitoring views from [openai-migration-monitoring.md](/c:/CurrIA/docs/openai-migration-monitoring.md)
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

- [ ] Final provider decision approved
- [ ] Final provider state reflected in code and docs
- [ ] Final commit created with the Portuguese test results reference
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
- [ ] Sign off the migration when stable

Success thresholds:
- error rate `< 1%`
- monthly cost trend in expected range
- p95 latency `< 10s`
- zero critical launch issues

## Final sign-off

- Final provider:
- Approved by:
- Approval date:
- Notes:
