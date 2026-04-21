# Phase 66 Context

## Goal

Reduce the residual ambiguity caused by legacy raw ATS diagnostic naming so future work cannot easily confuse internal heuristic ATS telemetry with the ATS Readiness v2 product contract.

## Constraints

- Preserve ATS Readiness v2 behavior, including exact versus estimated-range display semantics.
- Keep compatibility adapters where older consumers still expect legacy `atsScore`.
- Avoid destructive persistence migrations; prefer naming cleanup and explicit adapters.
- Keep product-facing paths on ATS Readiness v2 only.

## Main Risks

- Leaving `atsScore` as the default internal name in runtime and persistence code would keep inviting future semantic regressions.
- Renaming too aggressively could break compatibility surfaces that still legitimately expose the legacy field.
- Tests and helpers can silently reintroduce the old naming if not cleaned up alongside the runtime.
