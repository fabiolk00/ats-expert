# OpenAI Migration Rollback and Incident Playbook

This document defines how to respond if the Anthropic-to-OpenAI rollout causes quality, cost, or stability problems.

## Primary rollback triggers

Rollback should be considered immediately if any of the following occurs:

- Portuguese quality is materially worse than the approved gate result
- error rate exceeds `1%` and does not recover quickly
- p95 latency exceeds `10s` for a sustained period
- cost projects materially above the approved baseline
- structured tools begin failing with repeated `LLM_INVALID_OUTPUT`
- user-facing resume quality complaints appear in the first 24-72 hours

## Decision tree

### 1. If the Portuguese gate result was PASS and production still regresses

Actions:
- verify actual production model usage from `api_usage`
- confirm prompts and model routing match the approved candidate
- if misconfiguration is found, fix config first
- if quality still regresses, rollback to the last known-good provider state

### 2. If the Portuguese gate result was CONDITIONAL

Actions:
- do not stay in an all-in OpenAI state
- move to the approved hybrid routing immediately
- confirm:
  - GPT handles ingestion, gap analysis, OCR, and any approved chat flows
  - Claude handles `rewrite_section` and `create_target_resume`

### 3. If the Portuguese gate result was FAIL

Actions:
- do not ship full OpenAI
- revert the runtime provider to Claude
- update docs so they no longer present OpenAI as the chosen provider

## Technical rollback checklist

- [ ] Identify the last known-good commit
- [ ] Confirm which provider strategy was approved:
  - [ ] OpenAI full
  - [ ] Hybrid
  - [ ] Claude
- [ ] Revert or reconfigure model routing as needed
- [ ] Re-run:
  - [ ] `npm run typecheck`
  - [ ] `npm test`
  - [ ] `npm run build`
- [ ] Deploy the rollback target
- [ ] Verify `/api/agent` works in production after rollback
- [ ] Verify rewrite and target resume flows after rollback

## Business rollback checklist

- [ ] Notify engineering of the rollback reason
- [ ] Notify support or ops if user-facing quality issues occurred
- [ ] Record incident summary
- [ ] Record whether the issue was:
  - [ ] quality
  - [ ] cost
  - [ ] latency
  - [ ] malformed outputs
  - [ ] runtime errors

## Incident summary template

```md
# AI Migration Incident

- Date:
- Owner:
- Provider state at incident:
- Trigger:
- User impact:
- Metrics affected:
- Immediate action:
- Final resolution:
- Follow-up items:
```

## Default rollback recommendation

If the team is unsure during an incident:

- prefer the safer provider state over the cheaper one
- protect resume quality first
- only return to OpenAI full after a fresh quality review and technical validation
