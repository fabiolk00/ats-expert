# OpenAI Model Rollback and Incident Playbook

This document defines how to respond if the selected OpenAI model combination causes quality, cost, or stability problems.

## Primary rollback triggers

Rollback should be considered immediately if any of the following occurs:

- Portuguese quality is materially worse than the approved gate result
- error rate exceeds `1%` and does not recover quickly
- p95 latency exceeds `10s` for a sustained period
- cost projects materially above the approved baseline
- structured tools begin failing with repeated `LLM_INVALID_OUTPUT`
- user-facing resume quality complaints appear in the first 24-72 hours

## Decision tree

### 1. If the selected combo regresses in production

Actions:
- verify actual production model usage from `api_usage`
- confirm prompts and model routing match the approved combination
- if misconfiguration is found, fix config first
- if quality still regresses, rollback to the last known-good combo

### 2. If the selected combo is too expensive

Actions:
- confirm whether a cheaper approved combo exists
- if yes, switch to the cheaper approved combo
- if not, hold rollout until product accepts the higher cost

### 3. If no tested combo remains acceptable

Actions:
- do not auto-promote a new combo
- restore the last known-good combo
- reopen prompt or provider evaluation only if needed

## Technical rollback checklist

- [ ] Identify the last known-good commit
- [ ] Confirm which combo was approved:
  - [ ] `combo_a`
  - [ ] `combo_b`
  - [ ] `combo_c`
- [ ] Revert or reconfigure `OPENAI_MODEL_COMBO` as needed
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
# AI Model Incident

- Date:
- Owner:
- Model combo at incident:
- Trigger:
- User impact:
- Metrics affected:
- Immediate action:
- Final resolution:
- Follow-up items:
```

## Default rollback recommendation

If the team is unsure during an incident:

- prefer the safer combo over the cheaper one
- protect resume quality first
- only promote a different combo after a fresh quality review and technical validation

