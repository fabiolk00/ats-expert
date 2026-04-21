# Phase 55 Context

## Goal

Consolidate the winning route architecture and reduce remaining brownfield ambiguity without changing product behavior.

This phase exists because the repo now has a strong, explicit route pattern (`context/policy/decision/response`) but still shows residual coexistence between newer and older route styles, especially in semantically overlapping endpoints such as `compare` and `comparison`.

The goal is to reduce cognitive load, avoid architecture drift, and align onboarding and docs with the current reality of the codebase.

## Non-goals

- Do not redesign product behavior.
- Do not change billing or export semantics.
- Do not change preview lock semantics.
- Do not rename large parts of the repo.
- Do not refactor all API routes.
- Do not broadly restructure `components/`.
- Do not introduce new abstractions or route frameworks.
- Do not create microservices or new runtime roles.

## Workstreams

### Workstream 1: Canonicalize compare vs comparison

- Inventory `src/app/api/session/[id]/compare/route.ts` and `src/app/api/session/[id]/comparison/route.ts`.
- Capture purpose, input contract, output contract, current callers or UI consumers, overlap, architectural style, and whether each route is canonical or compatibility only.
- Decide canonical ownership for future compare-related logic.
- Add short top-of-file comments to both routes stating canonical versus compatibility status.
- Document the decision in architecture docs.

### Workstream 2: Migrate the brownfield compare or comparison handler to the winning pattern

- Choose the dense route that still sits outside the winning route-layer pattern.
- Extract route-local modules under `src/lib/routes/` using `context.ts`, `decision.ts`, `response.ts`, and `types.ts`, with `policy.ts` only if truly needed.
- Turn the route handler into a thin adapter.
- Preserve public behavior exactly, including status codes, payload shape, compare semantics, and preview-aware behavior.
- Add or extend regression tests if needed.

### Workstream 3: Add topology clarity to README

- Refresh the top-level README to reflect the current repo topology.
- Point readers to canonical architecture docs without duplicating deep details.
- Keep onboarding concise and high signal.

### Workstream 4: Add a `components/` policy

- Create `docs/architecture/components-boundaries.md`.
- Define when a component should stay feature-local versus be promoted to shared.
- Document anti-patterns without triggering a mass component refactor.

### Workstream 5: Update architecture governance artifacts

- Update `architecture-scorecard.md`.
- Update `hotspot-watchlist.md` if compare or comparison was a hotspot.
- Update `approved-chokepoints.md` only if canonical ownership changes.

## Acceptance Criteria

- Any contributor can answer which route should receive future compare behavior.
- There is no ambiguity about whether `comparison` is legacy or canonical.
- The remaining dense brownfield route matches the winning route architecture.
- Public behavior stays unchanged.
- README reflects the current topology.
- `components/` placement policy is documented.
- Architecture governance docs acknowledge the consolidation.
