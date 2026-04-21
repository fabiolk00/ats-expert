# Phase 49 Context - Hardening The Route Decision Architecture

## Decisions

- Preserve all current product behavior, route contracts, status codes, payload shapes, billing semantics, preview-lock semantics, and replay behavior.
- Treat this phase as architectural hardening only; do not redesign billing, export, preview lock, route public APIs, or the monolith structure.
- Keep the Phase 48 route pattern pragmatic and route-specific; do not build a generic route framework or expand the pattern to simple CRUD routes.
- Prefer explicit contracts, seam tests, and narrow extractions over broad rewrites.
- Keep `context.ts` focused on request resolution, `policy.ts` on blocking rules, `decision.ts` on orchestration and normalized outcomes, and `response.ts` on HTTP mapping only.

## Scope

- `docs/architecture/route-policy-boundaries.md`
- `docs/architecture/route-review-checklist.md`
- `docs/architecture/hotspot-watchlist.md`
- `src/lib/routes/session-generate/**`
- `src/lib/routes/file-access/**`
- `src/lib/routes/smart-generation/**`
- `src/lib/routes/session-versions/**`
- `src/lib/routes/session-compare/**`
- `src/app/api/session/[id]/generate/route.ts`
- `src/app/api/file/[sessionId]/route.ts`
- `src/app/api/profile/smart-generation/route.ts`
- route seam and precedence tests covering generate, file access, smart generation, versions, and compare

## Locked Invariants

- `response.ts` must not infer real artifact access, preview-lock semantics, or billing/export semantics from raw domain objects.
- `context.ts` must not become an alternate decision engine or embed business-semantic branching.
- `decision.ts` remains orchestration-focused; if `session-generate/decision.ts` or `smart-generation/decision.ts` grows too broad, extract only route-specific helpers.
- New critical routes must follow the explicit context/policy/decision/response checklist, but simple CRUD or low-risk routes must not be forced into the same ceremony.
- Precedence-sensitive behavior remains explicit: blocking policy wins before execution, locked outcomes never leak real artifacts or diffs, and public behavior remains unchanged.

## Canonical References

- `.planning/ROADMAP.md` - Phase 48 and 49 goals, requirements, and milestone sequencing
- `.planning/REQUIREMENTS.md` - architectural hardening requirements and traceability
- `.planning/STATE.md` - project decisions and current milestone context
- `.planning/phases/CURRIA-48-route-policy-extraction-and-decision-normalization/48-CONTEXT.md` - original Phase 48 decisions and invariants
- `.planning/phases/CURRIA-48-route-policy-extraction-and-decision-normalization/48-REVIEWS.md` - review feedback and residual regression watchlist
- `docs/architecture/route-policy-boundaries.md` - existing route boundary documentation to harden

## Specific Ideas

- Add enforceable "may do / must not do" boundaries for `context.ts`, `policy.ts`, `decision.ts`, and `response.ts`.
- Add a critical-route checklist and explicitly document when the full pattern should and should not be used.
- Add small response-mapper tests that prove mapping operates on explicit decision kinds rather than raw-state inference.
- Add precedence comments to critical routes and decision modules where order matters.
- Add a hotspot watchlist for `src/lib/routes/session-generate/decision.ts` and `src/lib/routes/smart-generation/decision.ts`.

## Deferred

- Redesigning billing/export behavior
- Redesigning preview-lock rules
- Refactoring unrelated simple routes
- Generic route platform abstractions
- Splitting the monolith
