# Phase 55: Brownfield Route Consolidation And Repo Topology Alignment - Research

**Researched:** 2026-04-20 [VERIFIED: codebase grep]  
**Domain:** Brownfield Next.js route consolidation for `compare` and `comparison` surfaces [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
**Confidence:** HIGH [VERIFIED: codebase grep]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Goal

Consolidate the winning route architecture and reduce remaining brownfield ambiguity without changing product behavior. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]

This phase exists because the repo now has a strong, explicit route pattern (`context/policy/decision/response`) but still shows residual coexistence between newer and older route styles, especially in semantically overlapping endpoints such as `compare` and `comparison`. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]

The goal is to reduce cognitive load, avoid architecture drift, and align onboarding and docs with the current reality of the codebase. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]

## Non-goals

- Do not redesign product behavior. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not change billing or export semantics. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not change preview lock semantics. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not rename large parts of the repo. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not refactor all API routes. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not broadly restructure `components/`. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not introduce new abstractions or route frameworks. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Do not create microservices or new runtime roles. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]

### Claude's Discretion

- Choose the dense route that still sits outside the winning route-layer pattern. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Extract route-local modules under `src/lib/routes/` using `context.ts`, `decision.ts`, `response.ts`, and `types.ts`, with `policy.ts` only if truly needed. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Refresh the top-level README to reflect the current repo topology. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Create `docs/architecture/components-boundaries.md`. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
- Update `architecture-scorecard.md`. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)

- `55-CONTEXT.md` does not define a `Deferred Ideas` section. Treat the listed non-goals as the effective out-of-scope boundary for this phase. [VERIFIED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-CONS-01 | Compare and comparison route ownership is explicit, the remaining dense brownfield compare surface follows the route-layer pattern, and future compare logic has one canonical architectural home. [CITED: .planning/REQUIREMENTS.md] | Keep `POST /compare` as canonical compare ownership; migrate `GET /comparison` into a thin adapter backed by route-local modules; add top-of-file status comments to both routes and document the ownership rule. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] |
| ROUTE-CONS-TEST-01 | Regression coverage proves the migrated compare or comparison surface preserves public contract, preview-aware behavior, not-found handling, and compare semantics after the extraction. [CITED: .planning/REQUIREMENTS.md] | Preserve existing `compare` seam tests; extend `comparison` coverage for 401, 404, 409, 500, and locked-preview sanitization after extraction. [VERIFIED: src/app/api/session/[id]/compare/route.test.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts] |
| ROUTE-CONS-DOC-01 | README, route-topology docs, governance artifacts, and component-boundary guidance reflect the current repo topology and the compare versus comparison canonical decision. [CITED: .planning/REQUIREMENTS.md] | Update README, `docs/architecture/architecture-scorecard.md`, `docs/architecture/approved-chokepoints.md` only if the chokepoint set changes, and add `docs/architecture/components-boundaries.md`. [CITED: docs/architecture/architecture-scorecard.md] [CITED: docs/architecture/approved-chokepoints.md] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- This file is the project source of truth for system architecture and engineering invariants. It should track the code that runs today, not aspirational legacy notes. [CITED: CLAUDE.md]
- Runtime code should work with app user IDs after the auth boundary. [CITED: CLAUDE.md]
- `cvState` is canonical resume truth. [CITED: CLAUDE.md]
- `generatedOutput.previewAccess` is the historical source of truth for locked artifact access. [CITED: CLAUDE.md]
- Route-level auth or body validation may return plain `{ error: ... }` responses outside the tool layer. [CITED: CLAUDE.md]
- Keep AI tool state changes inside `ToolPatch` and dispatcher-managed persistence. [CITED: CLAUDE.md]
- The architecture docs should match the running code, not legacy or aspirational structure. [CITED: CLAUDE.md]

## Summary

The winning route architecture is already live on `POST /api/session/[id]/compare`: the route is 16 lines, delegates to `src/lib/routes/session-compare/{context,decision,response,types}.ts`, and already carries compare-specific invariants plus focused tests. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/lib/routes/session-compare/context.ts] [VERIFIED: src/lib/routes/session-compare/decision.ts] [VERIFIED: src/lib/routes/session-compare/response.ts] [VERIFIED: src/lib/routes/session-compare/types.ts] [VERIFIED: src/app/api/session/[id]/compare/route.test.ts]

The remaining brownfield target is `GET /api/session/[id]/comparison`: the route is 90 lines, mixes auth, ownership, optimized-preview sanitization, generation-type derivation, ATS scoring, fallback scoring, and HTTP mapping inline, and it is the route currently called by the dashboard comparison page through `getResumeComparison()`. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [VERIFIED: src/lib/dashboard/workspace-client.ts] [VERIFIED: src/components/resume/resume-comparison-page.tsx]

The smallest safe consolidation is semantic, not public-path removal: `compare` should remain the canonical owner for compare semantics and future compare-related architectural guidance, while `comparison` should remain a compatibility/dashboard surface with unchanged `GET` contract but be extracted into its own thin route-layer modules. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]

**Primary recommendation:** Keep `POST /compare` as canonical compare ownership, migrate `GET /comparison` to `src/lib/routes/session-comparison/*` as a thin compatibility adapter, and update README plus governance docs to state that `comparison` is dashboard-specific compatibility while `compare` is the canonical compare architecture seam. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/architecture-scorecard.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | `14.2.3` [VERIFIED: package.json] | Route handlers and route colocation. [VERIFIED: package.json] | The current route surfaces are already App Router handlers, so Phase 55 should stay inside the existing route-handler model. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] |
| Zod | `^3.23.8` [VERIFIED: package.json] | Request-body validation where a compare route accepts payload input. [VERIFIED: package.json] | `session-compare/context.ts` already uses Zod for the snapshot compare payload; reuse that pattern instead of introducing a second validation style. [VERIFIED: src/lib/routes/session-compare/context.ts] |
| Vitest | `^1.6.0` [VERIFIED: package.json] | Route seam and decision-module regression tests. [VERIFIED: package.json] | The compare route, preview-lock regression flow, and route helpers are already tested with Vitest, so Phase 55 should extend that same lane. [VERIFIED: src/app/api/session/[id]/compare/route.test.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts] [VERIFIED: src/app/api/preview-lock-transverse.test.ts] |

### Supporting

| Library/Module | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `src/lib/routes/shared/response.ts` | repo-local [VERIFIED: src/app/api/session/[id]/compare/route.ts] | Converts blocked route results into `NextResponse`. [VERIFIED: src/app/api/session/[id]/compare/route.ts] | Use in thin route adapters that return early on auth, ownership, or parse failures. [VERIFIED: src/app/api/session/[id]/compare/route.ts] |
| `sanitizeGeneratedCvStateForClient()` and `getPreviewLockSummary()` | repo-local [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Preserve locked-preview sanitization on the dashboard comparison surface. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Reuse in extracted `session-comparison/decision.ts`; do not reimplement locked-preview branching. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/preview-lock-policy.md] |
| `compareCVStates()` plus compare invariants | repo-local [VERIFIED: src/lib/routes/session-compare/decision.ts] | Canonical snapshot diff and locked-diff enforcement. [VERIFIED: src/lib/routes/session-compare/decision.ts] | Keep in the canonical `session-compare` seam only. [VERIFIED: src/lib/routes/session-compare/decision.ts] [CITED: docs/architecture/approved-chokepoints.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keeping both public paths with explicit ownership. [VERIFIED: codebase grep] | Collapse `comparison` into `compare` and repoint the dashboard now. [ASSUMED] | This phase would stop being behavior-preserving because the routes have different methods, payloads, consumers, and response shapes today. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [VERIFIED: src/lib/dashboard/workspace-client.ts] |
| Creating `src/lib/routes/session-comparison/*` for the extracted dashboard route. [VERIFIED: src/lib/routes/session-compare/context.ts] | Force `comparison` logic into `src/lib/routes/session-compare/*`. [ASSUMED] | That would blur two distinct contracts again: snapshot diff versus original-vs-optimized dashboard comparison. [VERIFIED: src/types/dashboard.ts] [VERIFIED: src/lib/routes/session-compare/types.ts] |

**Installation:** No new packages are needed for this phase. [VERIFIED: package.json]

**Version verification:** `next@14.2.3`, `zod@^3.23.8`, and `vitest@^1.6.0` are the versions declared in the repo today. [VERIFIED: package.json]

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── app/api/session/[id]/compare/route.ts        # canonical snapshot compare adapter
├── app/api/session/[id]/comparison/route.ts     # compatibility/dashboard adapter
└── lib/routes/
   ├── session-compare/                          # canonical compare semantics
   └── session-comparison/                       # extracted dashboard-specific comparison seam
```

The extraction target should be a new `src/lib/routes/session-comparison/` directory, not a rewrite of `session-compare/`, because the two routes expose different public contracts today. [VERIFIED: src/lib/routes/session-compare/types.ts] [VERIFIED: src/types/dashboard.ts]

### Pattern 1: Canonical Compare Ownership

**What:** `POST /api/session/[id]/compare` owns generic compare semantics for arbitrary left/right snapshot refs and locked-diff enforcement. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/lib/routes/session-compare/types.ts]  
**When to use:** Any future compare work that deals with base/version/target snapshot refs, compare diff generation, or preview-aware locked compare behavior should land under `src/lib/routes/session-compare/*`. [VERIFIED: src/lib/routes/session-compare/decision.ts] [CITED: docs/preview-lock-policy.md]

**Example:**

```typescript
// Source: src/app/api/session/[id]/compare/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const contextResult = await resolveSessionCompareContext(req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const decision = await decideSessionCompare(contextResult.context)
  return toSessionCompareResponse(decision)
}
```

This route is already the reference implementation for the thin-adapter pattern in this area of the repo. [VERIFIED: src/app/api/session/[id]/compare/route.ts]

### Pattern 2: Compatibility Comparison Extraction

**What:** `GET /api/session/[id]/comparison` should stay public and behaviorally unchanged, but it should be split into `context.ts`, `decision.ts`, `response.ts`, and `types.ts` so the route body becomes a thin adapter. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]  
**When to use:** Use this only for the dashboard-facing original-vs-optimized comparison contract consumed by `ResumeComparisonPage`. [VERIFIED: src/components/resume/resume-comparison-page.tsx] [VERIFIED: src/lib/dashboard/workspace-client.ts]

**Recommended module split:**  
- `context.ts`: auth resolution, ownership check, session load. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
- `decision.ts`: resolve sanitized optimized state, generation type, label, ATS analyses or fallback scores, and normalized success or failure outcomes. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
- `response.ts`: map normalized decisions to `401`, `404`, `409`, `500`, or `200` JSON without recomputing semantics. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]  
- `policy.ts`: omit unless a real reusable blocking gate appears; the current route does not justify a separate policy layer. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]

### Anti-Patterns to Avoid

- **Do not repoint the dashboard to `/compare` in this phase:** the dashboard fetcher calls `GET /api/session/${sessionId}/comparison`, and the page expects a `ResumeComparisonResponse`, not the snapshot-diff contract. [VERIFIED: src/lib/dashboard/workspace-client.ts] [VERIFIED: src/components/resume/resume-comparison-page.tsx] [VERIFIED: src/types/dashboard.ts]
- **Do not move the `409` “No optimized resume found” case into `context.ts`:** that is an availability decision about derived resume state, not raw request resolution. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]
- **Do not reinterpret preview lock in `response.ts`:** compare lock interpretation is already documented as a decision-layer concern, and the dashboard route must keep using the existing sanitization helpers. [CITED: docs/architecture/route-policy-boundaries.md] [CITED: docs/preview-lock-policy.md] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]
- **Do not merge score computation with UI-specific wording outside a decision seam:** the current route derives `generationType`, score label, and fallback scoring together; extraction should preserve that grouping instead of scattering it across the route or component. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locked compare diff handling. [CITED: docs/preview-lock-policy.md] | A new ad hoc “if locked then strip diff” branch inside the route. [ASSUMED] | `assertLockedCompareHasNoDiff()` and the existing `session-compare` decision flow. [VERIFIED: src/lib/routes/session-compare/decision.ts] [VERIFIED: src/lib/routes/session-compare/response.ts] | The chokepoint is already approved and tested; duplicating it creates policy drift. [CITED: docs/architecture/approved-chokepoints.md] |
| Locked dashboard preview sanitization. [CITED: docs/preview-lock-policy.md] | A new synthetic-preview formatter in `comparison/route.ts`. [ASSUMED] | `sanitizeGeneratedCvStateForClient()` and `getPreviewLockSummary()`. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Current behavior already depends on these helpers, including the locked-preview contract tested in `comparison/route.test.ts`. [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts] |
| Snapshot diff generation. [VERIFIED: src/lib/routes/session-compare/decision.ts] | Inline field-by-field diff logic in either route. [ASSUMED] | `compareCVStates()`. [VERIFIED: src/lib/routes/session-compare/decision.ts] | The diff contract is already centralized and covered separately. [VERIFIED: src/lib/cv/compare.test.ts] |

**Key insight:** The brownfield problem is architectural placement, not missing primitives; Phase 55 should reuse the existing compare, preview-lock, and dashboard helper seams instead of inventing new ones. [VERIFIED: codebase grep] [CITED: docs/architecture/approved-chokepoints.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None found. Route ownership and topology live in code and docs, not in persisted compare/comparison records discovered by this phase scan. [VERIFIED: codebase grep] | None. Code edit only. [VERIFIED: codebase grep] |
| Live service config | None found in repo-managed route consumers; the active caller is the dashboard fetcher in code. [VERIFIED: src/lib/dashboard/workspace-client.ts] | None. Code edit only. [VERIFIED: src/lib/dashboard/workspace-client.ts] |
| OS-registered state | None found. This phase does not change CLIs, workers, task registration, or service names. [VERIFIED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md] | None. [VERIFIED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md] |
| Secrets/env vars | None found. The route logic under review does not introduce or rename env keys. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | None. [VERIFIED: codebase grep] |
| Build artifacts | None found. No installed-package or generated-artifact naming migration is implied by the recommended extraction. [VERIFIED: codebase grep] | None. [VERIFIED: codebase grep] |

## Common Pitfalls

### Pitfall 1: Treating `compare` and `comparison` as duplicates

**What goes wrong:** The planner collapses both routes into one work item and accidentally changes method, request shape, or response shape. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
**Why it happens:** The names are similar, but `compare` is a POST snapshot-diff API and `comparison` is a GET dashboard view model API. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [VERIFIED: src/types/dashboard.ts]  
**How to avoid:** Canonicalize semantic ownership in docs and top-of-file comments, but keep both public contracts unchanged in this phase. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md]  
**Warning signs:** Dashboard code starts calling `/compare`, or compare types start importing `ResumeComparisonResponse`. [VERIFIED: src/lib/dashboard/workspace-client.ts] [VERIFIED: src/types/dashboard.ts]

### Pitfall 2: Moving business availability into `context.ts`

**What goes wrong:** `context.ts` starts deciding whether an optimized resume exists or whether scoring should happen. [CITED: docs/architecture/route-policy-boundaries.md]  
**Why it happens:** Brownfield routes often hide “just one more branch” inside request-loading code. [CITED: docs/architecture/route-policy-boundaries.md]  
**How to avoid:** Keep `context.ts` limited to auth, ownership, and session load; return `409` and `500` from normalized decision outcomes instead. [CITED: docs/architecture/route-policy-boundaries.md] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
**Warning signs:** `context.ts` imports ATS scoring or preview helpers. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]

### Pitfall 3: Changing locked-preview behavior while “just refactoring”

**What goes wrong:** Real optimized content or meaningful diff data leaks on historically locked artifacts, or score computation changes because the sanitization order changed. [CITED: docs/preview-lock-policy.md] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
**Why it happens:** The dashboard route sanitizes `optimizedCvState` before building resume text and scoring, so extraction can accidentally reorder that flow. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]  
**How to avoid:** Preserve helper call order exactly in the extracted decision module and keep the existing locked-preview tests green. [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts]  
**Warning signs:** The extracted code starts scoring `session.agentState.optimizedCvState` directly after lock sanitization was supposed to occur. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]

## Code Examples

Verified patterns from the current codebase:

### Thin Critical Route Adapter

```typescript
// Source: src/app/api/session/[id]/compare/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const contextResult = await resolveSessionCompareContext(req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const decision = await decideSessionCompare(contextResult.context)
  return toSessionCompareResponse(decision)
}
```

This is the pattern Phase 55 should replicate for `comparison/route.ts`. [VERIFIED: src/app/api/session/[id]/compare/route.ts]

### Locked Compare Decision Guardrail

```typescript
// Source: src/lib/routes/session-compare/decision.ts
if (left.previewLocked || right.previewLocked) {
  const lockedDecision = {
    kind: 'locked',
    body: {
      sessionId: context.session.id,
      locked: true,
      reason: 'preview_locked',
      left: toCompareResponseRef(left),
      right: toCompareResponseRef(right),
    },
  }

  assertLockedCompareHasNoDiff(lockedDecision)
  return lockedDecision
}
```

This is the canonical compare invariant that should stay in `session-compare`, not be copied into `comparison`. [VERIFIED: src/lib/routes/session-compare/decision.ts] [CITED: docs/preview-lock-policy.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dense route bodies carried request loading, semantics, and HTTP mapping together. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Critical routes now use explicit `context` / `decision` / `response` seams. [CITED: docs/architecture/route-policy-boundaries.md] | This was established across Phases 48-54 in the roadmap and proof pack. [CITED: .planning/ROADMAP.md] [CITED: docs/architecture/architecture-scorecard.md] | Phase 55 should finish the remaining brownfield route without expanding the pattern into low-risk CRUD routes. [CITED: docs/architecture/route-policy-boundaries.md] |
| Compare naming is semantically ambiguous at the repo surface. [VERIFIED: codebase grep] | `compare` already matches the winning architecture; `comparison` is the remaining compatibility-shaped brownfield route. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | As of the current repo snapshot on 2026-04-20. [VERIFIED: codebase grep] | Docs and comments should resolve ownership explicitly without changing public behavior. [CITED: .planning/phases/CURRIA-55-brownfield-route-consolidation-and-repo-topology-alignment/55-CONTEXT.md] |

**Deprecated/outdated:** The inline `comparison/route.ts` architecture is outdated relative to the current critical-route standard and should be migrated, but the public `/comparison` endpoint itself is not deprecated in this phase. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Collapsing `/comparison` into `/compare` now would require a behavior change beyond Phase 55 scope. [ASSUMED] | Standard Stack / Alternatives Considered | Medium. The plan would need a larger migration and consumer update wave. |
| A2 | Creating `src/lib/routes/session-comparison/*` is cleaner than extending `session-compare/*` for the dashboard-only contract. [ASSUMED] | Standard Stack / Alternatives Considered | Low. The planner could still keep the same behavior if it chooses different internal folder naming. |

## Open Questions

1. **Should `approved-chokepoints.md` list `session-comparison/decision.ts` after extraction?** [CITED: docs/architecture/approved-chokepoints.md]
   - What we know: the current approved route decision layers include `session-compare`, `session-versions`, `session-generate`, `smart-generation`, and `file-access`, but not `comparison`. [CITED: docs/architecture/approved-chokepoints.md]
   - What's unclear: whether the dashboard comparison route should be treated as a new approved chokepoint or documented only as a compatibility route outside that list. [CITED: docs/architecture/approved-chokepoints.md]
   - Recommendation: default to leaving the approved chokepoint list unchanged unless the extracted `comparison` decision grows into a policy-sensitive seam that reviewers must monitor explicitly. [CITED: docs/architecture/approved-chokepoints.md] [VERIFIED: src/app/api/session/[id]/comparison/route.ts]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^1.6.0`. [VERIFIED: package.json] |
| Config file | `vitest.config.ts`. [VERIFIED: vitest.config.ts] |
| Quick run command | `npx vitest run src/app/api/session/[id]/compare/route.test.ts src/app/api/session/[id]/comparison/route.test.ts src/lib/routes/session-compare/decision.test.ts src/lib/routes/session-compare/response.test.ts src/app/api/preview-lock-transverse.test.ts`. [VERIFIED: codebase grep] |
| Full suite command | `npm test`. [VERIFIED: package.json] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-CONS-01 | `compare` remains the canonical snapshot-diff seam and `comparison` becomes a thin compatibility adapter without contract changes. [CITED: .planning/REQUIREMENTS.md] | route seam + unit | `npx vitest run src/app/api/session/[id]/compare/route.test.ts src/app/api/session/[id]/comparison/route.test.ts`. [VERIFIED: codebase grep] | `compare`: ✅, `comparison`: ✅. [VERIFIED: codebase grep] |
| ROUTE-CONS-TEST-01 | Locked-preview, not-found, and compare semantics remain unchanged after extraction. [CITED: .planning/REQUIREMENTS.md] | route seam + transverse | `npx vitest run src/app/api/session/[id]/comparison/route.test.ts src/app/api/session/[id]/compare/route.test.ts src/app/api/preview-lock-transverse.test.ts`. [VERIFIED: codebase grep] | ✅, but `comparison` lacks some branch coverage today. [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts] |
| ROUTE-CONS-DOC-01 | README and governance docs reflect the canonical ownership decision. [CITED: .planning/REQUIREMENTS.md] | manual + audit | `npm run audit:route-architecture`. [VERIFIED: package.json] | Audit exists; doc-specific assertions do not. [VERIFIED: package.json] |

### Sampling Rate

- **Per task commit:** run the focused Vitest command above. [VERIFIED: codebase grep]
- **Per wave merge:** run `npm run audit:route-architecture` and the focused Vitest command. [VERIFIED: package.json]
- **Phase gate:** run `npm test` before `/gsd-verify-work`. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `src/lib/routes/session-comparison/decision.test.ts` — needed if the extraction creates a decision module with `409`, lock-sanitization, and score-fallback branches. [ASSUMED]
- [ ] `src/lib/routes/session-comparison/response.test.ts` — needed if the extraction creates normalized response mapping similar to `session-compare/response.ts`. [ASSUMED]
- [ ] Extend `src/app/api/session/[id]/comparison/route.test.ts` for `401`, `404`, `409`, and `500` branches; it currently covers only the success-scoring path and the locked-preview path. [VERIFIED: src/app/api/session/[id]/comparison/route.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | `getCurrentAppUser()` stays at the route boundary. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [VERIFIED: src/lib/routes/session-compare/context.ts] |
| V3 Session Management | no direct session-cookie change. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Existing auth/session framework unchanged. [VERIFIED: codebase grep] |
| V4 Access Control | yes. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Ownership stays enforced through `getSession(params.id, appUser.id)`. [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [VERIFIED: src/lib/routes/session-compare/context.ts] |
| V5 Input Validation | yes. [VERIFIED: src/lib/routes/session-compare/context.ts] | Use Zod for compare request bodies and typed decision unions for normalized route outcomes. [VERIFIED: src/lib/routes/session-compare/context.ts] [VERIFIED: src/lib/routes/session-compare/types.ts] |
| V6 Cryptography | no. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | No crypto changes in this phase. [VERIFIED: codebase grep] |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session IDOR on compare/comparison reads. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] | Elevation of Privilege | Keep auth plus ownership checks in `context.ts` or equivalent route-boundary loading. [VERIFIED: src/lib/routes/session-compare/context.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] |
| Locked-preview data disclosure through diff or optimized content. [CITED: docs/preview-lock-policy.md] | Information Disclosure | Keep `session-compare` lock invariants and reuse `sanitizeGeneratedCvStateForClient()` for the dashboard route. [VERIFIED: src/lib/routes/session-compare/decision.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] |
| Semantic drift from route-layer violations. [CITED: docs/architecture/route-policy-boundaries.md] | Tampering | Keep route bodies thin and avoid moving policy or HTTP shaping back into dense route code. [CITED: docs/architecture/route-policy-boundaries.md] |

## Sources

### Primary (HIGH confidence)

- `src/app/api/session/[id]/compare/route.ts` - canonical compare route topology and thin adapter. [VERIFIED: src/app/api/session/[id]/compare/route.ts]
- `src/lib/routes/session-compare/context.ts` - request parsing and ownership pattern. [VERIFIED: src/lib/routes/session-compare/context.ts]
- `src/lib/routes/session-compare/decision.ts` - canonical compare semantics and locked-diff invariant. [VERIFIED: src/lib/routes/session-compare/decision.ts]
- `src/app/api/session/[id]/comparison/route.ts` - brownfield migration target and current mixed responsibilities. [VERIFIED: src/app/api/session/[id]/comparison/route.ts]
- `src/lib/dashboard/workspace-client.ts` and `src/components/resume/resume-comparison-page.tsx` - live consumer path for `/comparison`. [VERIFIED: src/lib/dashboard/workspace-client.ts] [VERIFIED: src/components/resume/resume-comparison-page.tsx]
- `docs/architecture/route-policy-boundaries.md` - approved critical-route layering rules. [CITED: docs/architecture/route-policy-boundaries.md]
- `docs/preview-lock-policy.md` - locked compare and locked preview constraints. [CITED: docs/preview-lock-policy.md]
- `docs/architecture/approved-chokepoints.md` and `docs/architecture/architecture-scorecard.md` - governance scope to update. [CITED: docs/architecture/approved-chokepoints.md] [CITED: docs/architecture/architecture-scorecard.md]

### Secondary (MEDIUM confidence)

- `README.md` - current topology and onboarding text that needs alignment. [CITED: README.md]
- `.planning/ROADMAP.md` and `.planning/STATE.md` - milestone context showing Phases 48-54 established the winning route pattern before Phase 55. [CITED: .planning/ROADMAP.md] [CITED: .planning/STATE.md]

### Tertiary (LOW confidence)

- None. All material claims above were verified against the current codebase or current project docs. [VERIFIED: codebase grep]

## Metadata

**Confidence breakdown:**  
- Standard stack: HIGH - this phase reuses the repo’s existing Next.js, Zod, and Vitest stack with no new dependencies. [VERIFIED: package.json]  
- Architecture: HIGH - the ownership and migration target are directly visible in the live route files, tests, and architecture docs. [VERIFIED: src/app/api/session/[id]/compare/route.ts] [VERIFIED: src/app/api/session/[id]/comparison/route.ts] [CITED: docs/architecture/route-policy-boundaries.md]  
- Pitfalls: HIGH - the main failure modes are already exposed by current public consumers and preview-lock docs. [VERIFIED: src/lib/dashboard/workspace-client.ts] [CITED: docs/preview-lock-policy.md]

**Research date:** 2026-04-20 [VERIFIED: codebase grep]  
**Valid until:** 2026-05-20 for this repo snapshot, or until either compare route contract changes. [VERIFIED: codebase grep]
