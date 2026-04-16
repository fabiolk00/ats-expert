---
phase: 38-refactor-api-agent-into-a-lightweight-orchestrator
plan: 01
subsystem: api
title: Thin agent route orchestration and async dispatch handoff
tags: [nextjs, sse, agent, jobs, orchestration]
requires: [phase-37-durable-job-contracts]
provides:
  - thin-api-agent-route
  - request-orchestrator
  - action-classification
  - async-dispatch-handoff
  - sync-chat-regression-coverage
patterns:
  - route-delegation
  - text-only-async-acknowledgement
  - lightweight-pre-loop-setup
requirements-completed:
  - ORCH-01
  - ORCH-02
---

# Phase 38 Plan 01 Summary

Thin `/api/agent` delegation now sits over a request orchestrator that classifies heavy agent actions into durable jobs while preserving synchronous SSE chat behavior for lightweight prompts.

## What Changed

- Reduced [src/app/api/agent/route.ts](/c:/CurrIA/src/app/api/agent/route.ts) to a thin public wrapper around [src/lib/agent/request-orchestrator.ts](/c:/CurrIA/src/lib/agent/request-orchestrator.ts).
- Added explicit action classification in [src/lib/agent/action-classification.ts](/c:/CurrIA/src/lib/agent/action-classification.ts) so lightweight chat remains synchronous and heavy ATS, targeting, and artifact actions route to async durable dispatch.
- Added [src/lib/agent/async-dispatch.ts](/c:/CurrIA/src/lib/agent/async-dispatch.ts) to create durable jobs with deterministic idempotency keys and return text-only acknowledgement messages for async work.
- Kept [src/lib/agent/pre-loop-setup.ts](/c:/CurrIA/src/lib/agent/pre-loop-setup.ts) lightweight by removing inline ATS enhancement and job-targeting execution from request setup.
- Added async acknowledgement persistence in [src/lib/agent/agent-persistence.ts](/c:/CurrIA/src/lib/agent/agent-persistence.ts) so transcript ordering stays consistent when async jobs are dispatched.
- Replaced the oversized route regression suites with focused sync/async boundary coverage in:
  - [src/app/api/agent/route.test.ts](/c:/CurrIA/src/app/api/agent/route.test.ts)
  - [src/app/api/agent/route.sse.test.ts](/c:/CurrIA/src/app/api/agent/route.sse.test.ts)
  - [src/lib/agent/request-orchestrator.test.ts](/c:/CurrIA/src/lib/agent/request-orchestrator.test.ts)
  - [src/lib/agent/action-classification.test.ts](/c:/CurrIA/src/lib/agent/action-classification.test.ts)
  - [src/lib/agent/pre-loop-setup.test.ts](/c:/CurrIA/src/lib/agent/pre-loop-setup.test.ts)
  - [src/lib/agent/agent-persistence.test.ts](/c:/CurrIA/src/lib/agent/agent-persistence.test.ts)

## Verification

- `npm run typecheck`
- `npx vitest run src/lib/agent/action-classification.test.ts src/lib/agent/request-orchestrator.test.ts src/lib/agent/pre-loop-setup.test.ts src/lib/agent/agent-persistence.test.ts src/app/api/agent/route.test.ts src/app/api/agent/route.sse.test.ts`

## Notes

- Heavy ATS, targeting, and artifact work is no longer executed inline from the active request path, but some legacy helper code still exists in [src/lib/agent/agent-loop.ts](/c:/CurrIA/src/lib/agent/agent-loop.ts) and is expected to be removed or bypassed more fully as Phase 39 moves processors behind durable workers.
