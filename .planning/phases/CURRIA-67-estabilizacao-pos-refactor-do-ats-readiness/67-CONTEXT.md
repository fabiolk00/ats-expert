# Phase 67 Context

## Goal

Stabilize the post-refactor ATS Readiness system without reopening the scoring architecture by:
- instrumenting legacy compatibility-field usage
- documenting the canonical semantic boundary
- keeping legacy sunset decisions data-driven

## In Scope

- Telemetry for legacy `atsScore` compatibility seams
- Short onboarding note explaining ATS Readiness v2 versus internal heuristic ATS diagnostics
- Regression coverage proving compatibility telemetry does not disturb the product contract

## Out of Scope

- Any redesign of ATS Readiness scoring
- Threshold changes to floor 89 or cap 95
- Reopening exact versus estimated-range behavior
