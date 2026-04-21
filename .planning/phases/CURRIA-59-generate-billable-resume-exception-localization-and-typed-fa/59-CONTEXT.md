# Phase 59 Context

## Goal

Localize the remaining opaque exception path that still escapes after `agent.generate_file.preflight.passed`, so downstream failures inside `generateBillableResume(...)` become stage-specific, observable, and typed where safe.

## Confirmed Starting Point

- Phase 58 already hardened the ATS enhancement to `generate_file` handoff.
- Real logs proved the preflight now passes with coherent authoritative source resolution and latest version selection.
- The remaining `agent.tool.failed` + `INTERNAL_ERROR` happens after preflight, inside or immediately around the billable export path.

## Constraints

- Preserve current ATS enhancement semantics.
- Preserve billing semantics, preview-lock behavior, and successful export behavior.
- Do not redesign route architecture or flatten all failures into one new generic code.

## Implementation Focus

- Add explicit billable stage tracking inside `generateBillableResume(...)`.
- Emit stage-local `started`, `completed`, and `failed` logs.
- Narrow predictable state failures into typed failures where stable.
- Preserve `billableStage` metadata up to top-level `agent.tool.failed`.
- Add stage-failure metrics and regression coverage.
