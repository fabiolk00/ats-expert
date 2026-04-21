---
phase: 55-brownfield-route-consolidation-and-repo-topology-alignment
plan: 02
subsystem: docs
tags: [architecture, governance, onboarding, routes, nextjs]
requires:
  - phase: 55-brownfield-route-consolidation-and-repo-topology-alignment
    provides: compare/comparison route ownership and extracted comparison route seam
provides:
  - concise repo topology guidance aligned to the current monolith
  - explicit compare versus comparison ownership documentation
  - pragmatic feature-local versus shared component placement rules
  - governance artifacts updated to reflect the resolved comparison ambiguity
affects: [readme, architecture-docs, route-governance, contributor-onboarding]
tech-stack:
  added: []
  patterns: [thin-route-adapter, brownfield-doc-alignment, feature-local-first-ui]
key-files:
  created:
    - docs/architecture/components-boundaries.md
  modified:
    - README.md
    - docs/architecture/route-policy-boundaries.md
    - docs/architecture/architecture-scorecard.md
    - docs/architecture/hotspot-watchlist.md
key-decisions:
  - "README stays onboarding-focused and links to architecture docs instead of restating them."
  - "POST /api/session/[id]/compare is documented as canonical, while GET /api/session/[id]/comparison remains compatibility-only."
  - "approved-chokepoints.md remains unchanged because session-comparison/decision.ts does not justify promotion into the monitored chokepoint set."
patterns-established:
  - "Use src/lib/routes/* only for semantically dense routes, not as a repo-wide rule for CRUD handlers."
  - "Keep UI feature-local by default and promote components to shared folders only after stable multi-feature reuse appears."
requirements-completed: [ROUTE-CONS-DOC-01]
duration: 10 min
completed: 2026-04-21
---

# Phase 55 Plan 02: Brownfield Route Consolidation And Repo Topology Alignment Summary

**README, route-boundary docs, and governance artifacts now describe compare as canonical, comparison as compatibility-only, and feature-local UI as the default brownfield placement**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-21T00:53:00Z
- **Completed:** 2026-04-21T01:03:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Refreshed `README.md` so onboarding points to the current architecture entry points and documents the `src/lib/routes/*` pattern without turning the README into a deep design document.
- Added `docs/architecture/components-boundaries.md` with explicit feature-local versus shared component promotion rules for the brownfield monolith.
- Updated route governance docs to reflect that `POST /compare` is canonical, `GET /comparison` is compatibility-only, and the comparison ambiguity is resolved without expanding approved chokepoints.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refresh onboarding and component-boundary guidance for the current topology** - `123bab5` (docs)
2. **Task 2: Update governance artifacts to reflect the consolidation outcome** - `c8c9610` (docs)

## Files Created/Modified

- `README.md` - Condensed onboarding guidance, current repo topology, and architecture doc entry points.
- `docs/architecture/components-boundaries.md` - New component placement policy for feature-local and shared UI.
- `docs/architecture/route-policy-boundaries.md` - Canonical compare ownership and compatibility-only comparison guidance.
- `docs/architecture/architecture-scorecard.md` - Records reduced compare/comparison ambiguity while keeping the hotspot count unchanged.
- `docs/architecture/hotspot-watchlist.md` - Marks the comparison route ambiguity as resolved and keeps the active hotspot set focused.

## Decisions Made

- Kept the README concise and onboarding-friendly by linking to architecture references instead of duplicating deep governance detail.
- Documented `compare` and `comparison` as separate route contracts with different ownership rather than implying a future merge.
- Left `docs/architecture/approved-chokepoints.md` unchanged because the extracted comparison decision seam is not a new policy chokepoint that reviewers need to monitor separately.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PowerShell required `-LiteralPath` to read route files under `src/app/api/session/[id]/...` because `[id]` is otherwise treated as a wildcard pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Contributor-facing docs now match the implemented compare/comparison consolidation.
- Governance artifacts remain aligned with the current route architecture without broadening the approved chokepoint set.

## Self-Check: PASSED

- Verified the summary and all plan-touched documentation files exist in the workspace.
- Verified task commits `123bab5` and `c8c9610` exist in git history.
