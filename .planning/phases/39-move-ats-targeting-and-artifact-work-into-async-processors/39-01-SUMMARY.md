---
phase: 39-move-ats-targeting-and-artifact-work-into-async-processors
plan: 01
subsystem: jobs
title: Durable ATS, targeting, and artifact processors
tags: [jobs, agent, artifacts, async, vitest]
requires:
  - phase-37-durable-job-contracts
  - phase-38-orchestrator-handoff
provides:
  - same-app-durable-job-runtime
  - ats-and-targeting-job-processors
  - artifact-generation-durable-handoff
  - preserved-last-good-optimized-state
  - focused-runtime-and-route-regressions
patterns:
  - queue-microtask-runtime-kickoff
  - claim-fenced-terminal-writes
  - durable-artifact-lineage
  - last-good-state-preservation
requirements-completed:
  - JOB-02
  - ART-01
  - STATE-01
---

# Phase 39 Plan 01 Summary

Heavy ATS enhancement, job targeting, and artifact generation now run through the durable jobs foundation instead of staying on the synchronous request path.

## What Changed

- Added [src/lib/jobs/runtime.ts](/c:/CurrIA/src/lib/jobs/runtime.ts) plus typed processors under [src/lib/jobs/processors](/c:/CurrIA/src/lib/jobs/processors) so ATS, targeting, and artifact jobs can be claimed, dispatched, completed, and failed through one same-app runtime.
- Updated [src/lib/agent/async-dispatch.ts](/c:/CurrIA/src/lib/agent/async-dispatch.ts) so heavy `/api/agent` actions immediately kick the durable runtime after job creation instead of stopping at persistence.
- Updated [src/lib/agent/ats-enhancement-pipeline.ts](/c:/CurrIA/src/lib/agent/ats-enhancement-pipeline.ts) and [src/lib/agent/job-targeting-pipeline.ts](/c:/CurrIA/src/lib/agent/job-targeting-pipeline.ts) so failed validation or persist-version paths preserve the previous valid optimized snapshot and last-good metadata.
- Updated [src/lib/resume-generation/generate-billable-resume.ts](/c:/CurrIA/src/lib/resume-generation/generate-billable-resume.ts) so a claimed worker can resume an existing pending `resume_generation` record instead of reporting perpetual in-progress status.
- Refactored [src/app/api/session/[id]/generate/route.ts](/c:/CurrIA/src/app/api/session/[id]/generate/route.ts) into a thin durable handoff that keeps auth, trust, career-fit, and source-of-truth checks intact while returning immediate durable metadata only when it is already known.
- Added focused regression coverage in:
  - [src/lib/jobs/runtime.test.ts](/c:/CurrIA/src/lib/jobs/runtime.test.ts)
  - [src/lib/agent/tools/pipeline.test.ts](/c:/CurrIA/src/lib/agent/tools/pipeline.test.ts)
  - [src/lib/resume-generation/generate-billable-resume.test.ts](/c:/CurrIA/src/lib/resume-generation/generate-billable-resume.test.ts)
  - [src/app/api/session/[id]/generate/route.test.ts](/c:/CurrIA/src/app/api/session/[id]/generate/route.test.ts)
  - [src/app/api/agent/route.sse.test.ts](/c:/CurrIA/src/app/api/agent/route.sse.test.ts)

## Verification

- `npm run typecheck`
- `npx vitest run src/lib/jobs/runtime.test.ts src/lib/agent/tools/pipeline.test.ts src/lib/resume-generation/generate-billable-resume.test.ts src/lib/jobs/source-of-truth.test.ts "src/app/api/session/[id]/generate/route.test.ts" src/app/api/agent/route.sse.test.ts`
- `npx vitest run src/lib/agent/request-orchestrator.test.ts`

## Notes

- This phase keeps the runtime in-process on top of the Phase 37 durable `jobs` table; it does not introduce a second queue or worker service.
- `/api/profile/smart-generation` and other setup-flow async UX changes remain untouched here, as planned.
