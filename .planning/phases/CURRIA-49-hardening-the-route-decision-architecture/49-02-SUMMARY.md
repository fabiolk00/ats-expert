---
phase: CURRIA-49-hardening-the-route-decision-architecture
plan: "02"
subsystem: route-architecture
tags: [routes, file-access, smart-generation, session-generate]
requires:
  - phase: 49-01
    provides: Route boundary contract and seam guardrails
provides:
  - Request-focused contexts for file access and smart generation
  - Session-generate policy, decision, and response boundaries with explicit ordering
affects: [file-access, smart-generation, session-generate]
key-files:
  created: [src/lib/routes/session-generate/response.test.ts]
  modified: [src/lib/routes/file-access/context.ts, src/lib/routes/file-access/decision.ts, src/lib/routes/file-access/response.ts, src/lib/routes/file-access/types.ts, src/lib/routes/smart-generation/context.ts, src/lib/routes/smart-generation/decision.ts, src/lib/routes/smart-generation/readiness.ts, src/lib/routes/smart-generation/generation-validation.ts, src/lib/routes/smart-generation/session-bootstrap.ts, src/lib/routes/smart-generation/result-normalization.ts, src/lib/routes/smart-generation/types.ts, src/lib/routes/session-generate/policy.ts, src/lib/routes/session-generate/decision.ts, src/lib/routes/session-generate/response.ts, src/lib/routes/session-generate/types.ts, src/lib/routes/session-generate/outcome-builders.ts, src/app/api/session/[id]/generate/route.ts]
requirements-completed: [ROUTE-ARCH-01, ROUTE-ARCH-TEST-01]
completed: 2026-04-20
---

# Phase 49 Plan 02 Summary

- Moved file-access semantic normalization out of `context.ts` and into explicit decision helpers so the response layer only maps decision kinds.
- Slimmed `smart-generation/context.ts` back to request resolution and shifted workflow semantics to route-local helpers and decision logic.
- Extracted the remaining inline `session-generate` policy into `policy.ts`, kept `decision.ts` orchestration-focused, and moved response-facing payload builders into `outcome-builders.ts`.
