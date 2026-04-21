# Phase 69 Context

## Goal

Add production-safe observability around the Phase 68 editorial guard so the team can measure premium-bullet detection, metric regressions, recovery-path usage, and final preservation outcomes in ATS enhancement flows.

## Constraints

- Do not redesign the premium-bullet detector.
- Do not change ATS Readiness v2 behavior, floor 89, cap 95, or exact-vs-range semantics.
- Do not log resume text, names, or raw bullet content.

## Key integration points

- `src/lib/agent/tools/metric-impact-guard.ts`
- `src/lib/agent/tools/validate-rewrite.ts`
- `src/lib/agent/ats-enhancement-pipeline.ts`
- `src/lib/observability/metric-events.ts`

## Expected evidence

- Structured events for premium detection, regression detection, recovery selection, and final preservation result
- Counter metrics for each editorial outcome
- Regression coverage proving the payloads contain counts/flags only
