# Phase 60 Context

## Goal

Identify why pending resume-generation persistence is failing after the Phase 59 stage-localization work, and narrow that hotspot so create vs reuse failures become directly diagnosable.

## Starting Point

- Phase 58 fixed the intake and post-persistence handoff seam.
- Phase 59 localized the remaining opaque downstream failure to the pending-generation persistence stage.
- The current hotspot is the `createPendingResumeGeneration(...)` path used by ATS-without-target export.

## Focus

- Preserve current product and billing semantics.
- Split create vs reuse diagnostics.
- Capture raw DB code/details/hint where available.
- Narrow the failure code emitted for this hotspot.
