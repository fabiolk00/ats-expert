# Phase 49: Hardening The Route Decision Architecture - Research

**Researched:** 2026-04-20
**Domain:** Route-boundary hardening for semantically dense Next.js App Router handlers
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `.planning/phases/CURRIA-49-hardening-the-route-decision-architecture/49-CONTEXT.md`. [VERIFIED: 49-CONTEXT.md]

### Locked Decisions
- Preserve all current product behavior, route contracts, status codes, payload shapes, billing semantics, preview-lock semantics, and replay behavior.
- Treat this phase as architectural hardening only; do not redesign billing, export, preview lock, route public APIs, or the monolith structure.
- Keep the Phase 48 route pattern pragmatic and route-specific; do not build a generic route framework or expand the pattern to simple CRUD routes.
- Prefer explicit contracts, seam tests, and narrow extractions over broad rewrites.
- Keep `context.ts` focused on request resolution, `policy.ts` on blocking rules, `decision.ts` on orchestration and normalized outcomes, and `response.ts` on HTTP mapping only.

### Claude's Discretion
None. [VERIFIED: 49-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- Redesigning billing/export behavior
- Redesigning preview-lock rules
- Refactoring unrelated simple routes
- Generic route platform abstractions
- Splitting the monolith
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-ARCH-01 | Critical route modules keep explicit context, policy, decision, and response boundaries so request resolution, policy gating, orchestration, and HTTP mapping do not collapse back into semantically mixed route code. [VERIFIED: REQUIREMENTS.md] | Use route-specific `context/policy/decision/response` seams only for semantically dense routes; keep simple read routes on `context/decision/response`; add boundary docs that state may-do/must-not-do rules per module. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md] |
| ROUTE-ARCH-TEST-01 | Mapper integrity, precedence-sensitive decisions, and artifact-lock invariants are covered by focused seam tests that prove public behavior stays unchanged while architectural boundaries remain enforced. [VERIFIED: REQUIREMENTS.md] | Add unit seams around response mappers and precedence helpers, then keep route regression tests for generate, file, smart-generation, versions, and compare unchanged as public-contract proof. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md] |
| ROUTE-ARCH-GUARD-01 | Route architecture documentation, review checklists, and hotspot watchlists make the critical pattern enforceable for dense policy routes without expanding it into low-risk CRUD surfaces. [VERIFIED: REQUIREMENTS.md] | Create `docs/architecture/route-review-checklist.md` and `docs/architecture/hotspot-watchlist.md`; scope the checklist to dense routes triggered by precedence, preview locks, billing gates, or durable-job semantics. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Preserve the existing brownfield product surface unless scope changes explicitly. [VERIFIED: CLAUDE.md]
- Prefer reliability, billing safety, observability, and verification over new feature breadth. [VERIFIED: CLAUDE.md]
- Keep route handlers thin, validate external input with `zod`, and prefer structured logs via `logInfo`, `logWarn`, and `logError`. [VERIFIED: CLAUDE.md]
- Treat `cvState` as canonical truth and `agentState` as operational context only. [VERIFIED: CLAUDE.md]
- Preserve the monolith structure and prefer small, test-backed changes over broad rewrites, especially on agent, billing, and profile-import paths. [VERIFIED: CLAUDE.md]

## Summary

Phase 49 should be planned as an enforcement pass over the Phase 48 route seams, not as another extraction phase. The five targeted surfaces already use route-specific modules under `src/lib/routes/**`, and the route handlers are already thin adapters over those modules. [VERIFIED: codebase grep] [VERIFIED: 48-CONTEXT.md] [VERIFIED: 49-CONTEXT.md]

The biggest planning risk is architectural backslide inside large route modules rather than missing framework pieces. `session-generate/context.ts` is 153 lines, `session-generate/decision.ts` is 177 lines, `file-access/context.ts` is 156 lines, `smart-generation/decision.ts` is 150 lines, and `session-compare/decision.ts` is 164 lines; those are reasonable hotspots for boundary rules, seam tests, and route-specific helper extraction, but not evidence that a generic route platform is needed. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

The planner should therefore bias toward three outputs: explicit boundary docs, focused mapper and precedence tests, and a limited hotspot watchlist for dense routes only. That matches the locked decisions, preserves current public behavior, and avoids spreading the ceremony into lower-risk CRUD handlers. [VERIFIED: 49-CONTEXT.md] [VERIFIED: REQUIREMENTS.md]

**Primary recommendation:** Harden the existing route-specific seams with docs plus seam tests, and only extract additional helpers inside `session-generate` and `smart-generation` when a single decision module is carrying multiple independent precedence branches. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | `14.2.3` in repo; npm latest `16.2.4` on 2026-04-20 [VERIFIED: package.json] [VERIFIED: npm registry] | Route handlers remain the public surface for the five target routes. [VERIFIED: codebase grep] | The route files already use `NextRequest`/`NextResponse` handlers, so Phase 49 should preserve that surface and harden internals only. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md] |
| TypeScript | `5.4.5` in repo [VERIFIED: package.json] | Typed route contexts and decision unions. [VERIFIED: codebase grep] | The current route modules already depend on discriminated result unions and typed context objects; boundary hardening should deepen those contracts rather than replace them. [VERIFIED: codebase grep] |
| Zod | `3.23.8` in repo; npm latest `4.3.6` on 2026-04-20 [VERIFIED: package.json] [VERIFIED: npm registry] | Input validation in `context.ts`. [VERIFIED: codebase grep] | `session-generate`, `smart-generation`, `session-versions`, and `session-compare` already validate request shape at the context boundary with Zod; keep that pattern. [VERIFIED: codebase grep] [VERIFIED: CLAUDE.md] |
| Vitest | `1.6.0` in repo; npm latest `4.1.4` on 2026-04-20 [VERIFIED: package.json] [VERIFIED: npm registry] | Seam tests and route regressions. [VERIFIED: package.json] [VERIFIED: codebase grep] | Existing route and decision tests already run on Vitest, so Phase 49 should add seam coverage there instead of introducing a second test stack. [VERIFIED: codebase grep] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/routes/shared/response` | repo-local helper [VERIFIED: codebase grep] | Converts normalized route HTTP payloads into `NextResponse`. [VERIFIED: codebase grep] | Use for blocked context results so route handlers do not rebuild low-level response plumbing. [VERIFIED: codebase grep] |
| `@/lib/generated-preview/locked-preview` | repo-local helper [VERIFIED: codebase grep] | Canonical preview-lock summary, placeholder PDF URL, and artifact leakage assertions. [VERIFIED: codebase grep] | Use whenever file or generation flows might expose artifact metadata or preview-locked output. [VERIFIED: codebase grep] |
| `@/lib/cv/preview-sanitization` | repo-local helper [VERIFIED: codebase grep] | Sanitizes versions and compare snapshots for locked previews. [VERIFIED: codebase grep] | Use for versions and compare instead of reconstructing preview lock logic in route decisions or responses. [VERIFIED: codebase grep] |
| `@/lib/security/request-trust` | repo-local helper [VERIFIED: codebase grep] | Trusted mutation gating for write routes. [VERIFIED: codebase grep] | Use in `context.ts` for mutation routes; Phase 49 should not move trust decisions into response or execution layers. [VERIFIED: codebase grep] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route-specific dense-route seams | A generic route framework | Rejected for this phase because the locked scope explicitly forbids generic platform abstraction and the current duplication is still route-shaped, not framework-shaped. [VERIFIED: 49-CONTEXT.md] [VERIFIED: 48-CONTEXT.md] |
| Small route-specific helper extractions | Broad module rewrites | Rejected because the project constraint is small, test-backed change and the current hotspots already have partial helper splits such as `job-reuse.ts`, `state-persistence.ts`, `readiness.ts`, and `session-bootstrap.ts`. [VERIFIED: CLAUDE.md] [VERIFIED: codebase grep] |

**Installation:**
```bash
# No new packages recommended for Phase 49.
```

**Version verification:** Repo versions came from `package.json`, and npm-latest versions were checked on 2026-04-20 with `npm view next version`, `npm view vitest version`, and `npm view zod version`. [VERIFIED: package.json] [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/app/api/.../route.ts              # Thin HTTP adapter only
src/lib/routes/<route>/context.ts     # Auth, ownership, request parsing, typed context
src/lib/routes/<route>/policy.ts      # Blocking gates only when the route has precedence-sensitive blockers
src/lib/routes/<route>/decision.ts    # Orchestration and normalized decision unions
src/lib/routes/<route>/response.ts    # HTTP mapping and logging only
src/lib/routes/<route>/*.test.ts      # Seam tests for helpers, mappers, and precedence
docs/architecture/*.md                # Boundary rules, checklist, hotspot watchlist
```

### Pattern 1: Dense Route Quartet
**What:** Use `context.ts`, `policy.ts`, `decision.ts`, and `response.ts` for routes that combine request trust, policy precedence, durable execution state, billing semantics, or preview-lock behavior. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep]

**When to use:** Apply this full quartet only when the route has at least one true blocking policy layer before execution plus a nontrivial response mapper. `session-generate` is the canonical example because it resolves auth and trust, blocks active exports, preserves billing-reconciliation precedence, executes durable job orchestration, and maps normalized outcomes back to unchanged HTTP payloads. [VERIFIED: codebase grep] [VERIFIED: 48-REVIEWS.md]

**Example:**
```typescript
// Source: src/app/api/session/[id]/generate/route.ts [VERIFIED: codebase grep]
const contextResult = await resolveSessionGenerateContext(req, params)
if (contextResult.kind === 'blocked') {
  return toNextJsonResponse(contextResult.response)
}

const policyDecision = await evaluateSessionGeneratePolicy(contextResult.context)
if (policyDecision.kind !== 'allow') {
  return toSessionGeneratePolicyResponse(contextResult.context, policyDecision)
}

const executionDecision = await executeSessionGenerateFlow(contextResult.context)
return toSessionGenerateExecutionResponse(contextResult.context, executionDecision)
```

### Pattern 2: Dense Read Route Trio
**What:** Use `context.ts`, `decision.ts`, and `response.ts` without `policy.ts` for read routes whose main risk is sanitized output, not pre-execution gating. [VERIFIED: codebase grep]

**When to use:** `file-access`, `session-versions`, and `session-compare` already fit this shape because they mostly resolve viewer context, normalize snapshot or artifact access decisions, and map them to HTTP. `policy.ts` would add ceremony without a real new seam unless a dedicated blocking stage appears later. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

**Example:**
```typescript
// Source: src/app/api/file/[sessionId]/route.ts [VERIFIED: codebase grep]
const contextResult = await resolveFileAccessContext(req, params)
if (contextResult.kind === 'blocked') {
  return toNextJsonResponse(contextResult.response)
}

const decision = decideFileAccess(contextResult.context)
return toFileAccessResponse(contextResult.context, decision)
```

### Pattern 3: Hotspot Helper Extraction Trigger
**What:** Extract route-specific helpers from `decision.ts` only when a module mixes multiple independent precedence axes or repeated normalization subroutines. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep]

**When to use:** Plan for helper extraction inside `session-generate/decision.ts` when retry idempotency, failed-job normalization, ready-artifact fallback, and generating-state persistence stop fitting one readable orchestrator. Plan the same inside `smart-generation/decision.ts` when readiness, credits, pipeline error normalization, and locked-preview result shaping stop fitting one readable orchestrator. [VERIFIED: codebase grep]

**Example:**
```typescript
// Source: src/lib/routes/file-access/decision.ts [VERIFIED: codebase grep]
if (status !== 'ready' || !pdfPath) {
  return { kind: 'artifact_unavailable', body: unavailableBody }
}

if (isLockedPreview(context.artifactMetadata)) {
  return { kind: 'locked_preview', body: lockedPreviewBody }
}

return { kind: 'artifact_available', pdfPath, body: readyBody }
```

### Anti-Patterns to Avoid
- **Response-layer semantic inference:** Do not let `response.ts` inspect raw domain objects to decide whether an artifact is real, whether a preview is locked, or whether billing is reconciling; normalize that in `decision.ts` or `context.ts` first. [VERIFIED: 49-CONTEXT.md]
- **Context-layer business branching:** Do not move career-fit warnings, retry reuse, preview sanitization, or compare lock suppression into `context.ts`; keep it on request resolution, auth, ownership, trust, and typed inputs. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep]
- **Pattern spillover into CRUD:** Do not apply the quartet to low-risk CRUD surfaces just for consistency; the locked scope explicitly limits this pattern to dense routes. [VERIFIED: 49-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Preview-lock artifact gating | Ad hoc `if (previewLocked)` branches in routes or responses | `getPreviewLockSummary`, `isLockedPreview`, `buildLockedPreviewPdfUrl`, and `assertNoRealArtifactForLockedPreview` from `@/lib/generated-preview/locked-preview` [VERIFIED: codebase grep] | This repo already centralizes preview-lock semantics there, and Phase 49 must preserve the invariant that locked outcomes never leak real artifacts. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep] |
| Snapshot sanitization for versions and compare | Bespoke masking logic per route | `sanitizeVersionEntryForViewer` and `sanitizeCompareRefForViewer` from `@/lib/cv/preview-sanitization` [VERIFIED: codebase grep] | Those helpers already encode preview-aware snapshot stripping and should stay the single place that decides whether real snapshot content survives. [VERIFIED: codebase grep] [VERIFIED: 48-REVIEWS.md] |
| Mutation request trust checks | Route-local origin or header logic | `validateTrustedMutationRequest` in `context.ts` for mutation routes [VERIFIED: codebase grep] | Request-trust decisions belong at the request boundary and should not be reinterpreted later in route execution. [VERIFIED: codebase grep] [VERIFIED: CLAUDE.md] |
| HTTP adapter plumbing for blocked contexts | Hand-built `NextResponse.json(...)` in every blocked path | `toNextJsonResponse` over `RouteHttpResponse` [VERIFIED: codebase grep] | It keeps route handlers thin and makes blocked context results mechanically consistent. [VERIFIED: codebase grep] [VERIFIED: CLAUDE.md] |

**Key insight:** The repo already has the core primitives; Phase 49 should enforce where they are allowed to run, not replace them with more abstraction. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Response Mappers Recreate Domain Policy
**What goes wrong:** `response.ts` starts deciding whether locked previews, real artifacts, or reconciliation states apply by re-reading raw session or job state. [VERIFIED: 49-CONTEXT.md]
**Why it happens:** Mapper files look harmless, so policy slips in there during small feature additions. [ASSUMED]
**How to avoid:** Make decision unions carry explicit kinds such as `locked_preview`, `artifact_unavailable`, `blocked_reconciliation`, or `diff`, and have response tests assert that mapping depends on the kind, not on raw artifacts. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]
**Warning signs:** Response tests need session fixtures or artifact metadata instead of normalized decision fixtures. [ASSUMED]

### Pitfall 2: Context Modules Turn Into Alternate Decision Engines
**What goes wrong:** `context.ts` accumulates product-semantic branching, which makes later policy and decision layers redundant or inconsistent. [VERIFIED: 49-CONTEXT.md]
**Why it happens:** Auth, ownership, and input parsing are already there, so adding "just one more branch" feels cheap. [ASSUMED]
**How to avoid:** Limit `context.ts` to auth, ownership, request trust, request parsing, target/session lookup, and typed derived values such as `primaryIdempotencyKey` or `workflowMode`. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]
**Warning signs:** `context.ts` starts returning business outcomes like locked compare payloads, retry reuse, or career-fit blocks instead of only blocked request primitives. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

### Pitfall 3: Boundary Pattern Expands Into Low-Risk Routes
**What goes wrong:** The project ends up with a ceremony-heavy route framework applied everywhere. [VERIFIED: 49-CONTEXT.md]
**Why it happens:** The Phase 48 shape is clean, so teams copy it mechanically. [ASSUMED]
**How to avoid:** Add a checklist trigger that requires at least one of these before using the full pattern: blocking policy precedence, preview-lock sanitization, durable-job lifecycle mapping, or artifact URL gating. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep]
**Warning signs:** A route with only auth plus CRUD persistence gets a `policy.ts` despite no blocker precedence. [ASSUMED]

### Pitfall 4: Precedence Coverage Stops At Route-Level Status Codes
**What goes wrong:** Regression tests prove only the final `200/202/409`, but not the ordering guarantees underneath. [VERIFIED: REQUIREMENTS.md]
**Why it happens:** Existing route tests are convenient and already cover public payloads. [VERIFIED: codebase grep]
**How to avoid:** Add seam tests for helper-level precedence, such as locked-preview gating before signed URL creation and billing-reconciliation blocking before nonce-less retry creation. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]
**Warning signs:** A regression can change a response body or call order without breaking the route test fixture count. [ASSUMED]

## Code Examples

Verified repo patterns:

### Thin Route Adapter
```typescript
// Source: src/app/api/session/[id]/compare/route.ts [VERIFIED: codebase grep]
const contextResult = await resolveSessionCompareContext(req, params)
if (contextResult.kind === 'blocked') {
  return toNextJsonResponse(contextResult.response)
}

const decision = await decideSessionCompare(contextResult.context)
return toSessionCompareResponse(decision)
```

### Decision-First File Access Mapping
```typescript
// Source: src/lib/routes/file-access/decision.ts [VERIFIED: codebase grep]
if (status !== 'ready' || !pdfPath) {
  return { kind: 'artifact_unavailable', body: unavailableBody }
}

if (isLockedPreview(context.artifactMetadata)) {
  return {
    kind: 'locked_preview',
    body: {
      ...buildBaseResponseBody(context),
      pdfUrl: buildLockedPreviewPdfUrl(context.session.id, context.target?.id),
    },
  }
}
```

### Preview-Aware Compare Suppression
```typescript
// Source: src/lib/routes/session-compare/decision.ts [VERIFIED: codebase grep]
if (left.previewLocked || right.previewLocked) {
  return {
    kind: 'locked',
    body: {
      sessionId: context.session.id,
      locked: true,
      reason: 'preview_locked',
      left: { ...leftMeta, previewLocked: left.previewLocked ?? false },
      right: { ...rightMeta, previewLocked: right.previewLocked ?? false },
    },
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Semantically mixed route handlers | Thin route handlers over route-specific modules under `src/lib/routes/**` [VERIFIED: docs/architecture/route-policy-boundaries.md] [VERIFIED: codebase grep] | Phase 48 on 2026-04-20 per review artifact. [VERIFIED: 48-REVIEWS.md] | Phase 49 should harden and document the seams instead of extracting a new framework. [VERIFIED: 49-CONTEXT.md] |
| Route-local preview masking and artifact logic | Central preview-lock helpers in `locked-preview.ts` and `preview-sanitization.ts` [VERIFIED: codebase grep] | Present in the current repo state on 2026-04-20. [VERIFIED: codebase grep] | Phase 49 should make routes consume normalized outputs from those helpers and add tests against leakage regressions. [VERIFIED: codebase grep] |

**Deprecated/outdated:**
- Mixed route handlers that simultaneously do auth, branching policy, durable orchestration, and response shaping are outdated for the five Phase 48/49 target routes. [VERIFIED: docs/architecture/route-policy-boundaries.md] [VERIFIED: 48-REVIEWS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mapper files are especially prone to accidental policy accretion during small follow-up changes. | Common Pitfalls | Low; it affects emphasis, not the concrete repo evidence. |
| A2 | Teams are likely to copy the dense-route pattern mechanically into CRUD routes unless the checklist is explicit. | Common Pitfalls | Medium; it influences how much guardrail documentation Phase 49 should ship. |

## Open Questions

1. **Should `smart-generation` gain a formal `policy.ts` now, or stay on `context/decision/response` plus hotspot documentation?**
   - What we know: The route currently has no distinct blocker layer beyond request trust and validation, but its `decision.ts` is already 150 lines and mixes readiness, credits, pipeline normalization, and preview-lock result shaping. [VERIFIED: codebase grep]
   - What's unclear: Whether the team expects new pre-execution blockers soon enough to justify a permanent policy seam. [ASSUMED]
   - Recommendation: Default to hotspot documentation plus route-specific helper extraction first; add `policy.ts` only when a real blocking precedence branch appears. [VERIFIED: 49-CONTEXT.md] [VERIFIED: codebase grep]

2. **How strict should the dense-route trigger checklist be?**
   - What we know: The locked scope says new critical routes should follow the explicit checklist, while simple CRUD or low-risk routes must not be forced into the same ceremony. [VERIFIED: 49-CONTEXT.md]
   - What's unclear: Whether the trigger should require one dense characteristic or two. [ASSUMED]
   - Recommendation: Start with one mandatory trigger from a short dense-route list, because the current target routes already show that any single one of preview locking, billing precedence, or durable-job lifecycle can justify the seam. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Local test and lint execution for Phase 49 validation | yes [VERIFIED: local command] | `v24.14.0` [VERIFIED: local command] | none [VERIFIED: local command] |
| npm | Repo-native test commands and package version inspection | yes [VERIFIED: local command] | `11.9.0` [VERIFIED: local command] | none [VERIFIED: local command] |

**Missing dependencies with no fallback:**
- None identified for planning. [VERIFIED: local command]

**Missing dependencies with fallback:**
- None identified for planning. [VERIFIED: local command]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `1.6.0` in repo with Vite-backed config. [VERIFIED: package.json] [VERIFIED: vitest.config.ts] |
| Config file | `vitest.config.ts`. [VERIFIED: vitest.config.ts] |
| Quick run command | `npm test -- src/lib/routes/session-generate/decision.test.ts src/lib/routes/file-access/decision.test.ts src/lib/routes/session-compare/decision.test.ts src/lib/routes/session-versions/decision.test.ts src/app/api/session/[id]/generate/route.test.ts src/app/api/file/[sessionId]/route.test.ts src/app/api/session/[id]/compare/route.test.ts src/app/api/session/[id]/versions/route.test.ts src/app/api/profile/smart-generation/route.test.ts` [VERIFIED: package.json] [VERIFIED: codebase grep] |
| Full suite command | `npm test` [VERIFIED: package.json] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-ARCH-01 | Critical dense routes keep request resolution, policy gating, decision orchestration, and response mapping separated. [VERIFIED: REQUIREMENTS.md] | seam + route regression | `npm test -- src/lib/routes/session-generate/decision.test.ts src/lib/routes/file-access/decision.test.ts src/lib/routes/session-compare/decision.test.ts src/lib/routes/session-versions/decision.test.ts src/app/api/session/[id]/generate/route.test.ts src/app/api/profile/smart-generation/route.test.ts` [VERIFIED: codebase grep] | yes; existing, but mapper-focused gaps remain. [VERIFIED: codebase grep] |
| ROUTE-ARCH-TEST-01 | Mapper integrity, precedence-sensitive decisions, and artifact-lock invariants stay unchanged publicly. [VERIFIED: REQUIREMENTS.md] | seam + route regression | `npm test -- src/lib/routes/file-access/decision.test.ts src/lib/routes/session-compare/decision.test.ts src/app/api/session/[id]/generate/route.test.ts src/app/api/session/[id]/compare/route.test.ts src/app/api/session/[id]/versions/route.test.ts` [VERIFIED: codebase grep] | yes; existing, but response-mapper tests are missing. [VERIFIED: codebase grep] |
| ROUTE-ARCH-GUARD-01 | Dense-route checklist and hotspot watchlist are shipped and reviewable. [VERIFIED: REQUIREMENTS.md] | doc verification + manual review | `powershell -Command "(Test-Path 'docs/architecture/route-review-checklist.md') -and (Test-Path 'docs/architecture/hotspot-watchlist.md')"` [VERIFIED: local command] | no; Wave 0 docs missing. [VERIFIED: local command] |

### Sampling Rate
- **Per task commit:** Run the quick route-seam command above. [VERIFIED: package.json] [VERIFIED: codebase grep]
- **Per wave merge:** Run `npm test`. [VERIFIED: package.json]
- **Phase gate:** Full suite green plus checklist/watchlist files present before `/gsd-verify-work`. [VERIFIED: package.json] [VERIFIED: local command]

### Wave 0 Gaps
- [ ] `docs/architecture/route-review-checklist.md` - required by ROUTE-ARCH-GUARD-01 and currently absent. [VERIFIED: local command]
- [ ] `docs/architecture/hotspot-watchlist.md` - required by ROUTE-ARCH-GUARD-01 and currently absent. [VERIFIED: local command]
- [ ] Add mapper-focused tests for `src/lib/routes/session-generate/response.ts` and `src/lib/routes/file-access/response.ts` so HTTP mapping is proven to consume normalized decisions rather than raw state. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md]
- [ ] Add explicit precedence seam tests for `session-generate` reconciliation-before-retry and file/compare preview-lock suppression before artifact or diff exposure. [VERIFIED: codebase grep] [VERIFIED: 48-REVIEWS.md] [VERIFIED: 49-CONTEXT.md]

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes [VERIFIED: codebase grep] | `getCurrentAppUser()` at the route context boundary. [VERIFIED: codebase grep] |
| V3 Session Management | no direct Phase 49 change [VERIFIED: codebase grep] | Existing auth/session handling remains outside this phase's scope. [VERIFIED: 49-CONTEXT.md] |
| V4 Access Control | yes [VERIFIED: codebase grep] | Session ownership checks via `getSession(..., appUser.id)`, target ownership checks, and trusted mutation request validation. [VERIFIED: codebase grep] |
| V5 Input Validation | yes [VERIFIED: codebase grep] | `zod` schemas in route `context.ts` files. [VERIFIED: codebase grep] |
| V6 Cryptography | no direct cryptographic change [VERIFIED: codebase grep] | Keep signed URL creation inside existing artifact helpers; do not add custom crypto or token logic in route code. [VERIFIED: codebase grep] |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR or cross-user route access | Elevation of Privilege | Resolve app user first, then fetch session and target by owned user/session scope in `context.ts`. [VERIFIED: codebase grep] |
| Preview-locked artifact leakage | Information Disclosure | Normalize lock state before response mapping and use shared preview-lock helpers for file, versions, and compare flows. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md] |
| Signed URL emission from the wrong layer | Information Disclosure | Allow `response.ts` to sign only when decision kind is explicitly `artifact_available`; keep lock decisions in `decision.ts`. [VERIFIED: codebase grep] [VERIFIED: 49-CONTEXT.md] |
| Reordering blocking policy and retry execution | Tampering | Keep policy precedence explicit and add seam tests that prove reconciliation and active-export blockers win before execution starts. [VERIFIED: codebase grep] [VERIFIED: 48-REVIEWS.md] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/CURRIA-49-hardening-the-route-decision-architecture/49-CONTEXT.md` - locked decisions, scope, invariants, and specific ideas. [VERIFIED: 49-CONTEXT.md]
- `.planning/REQUIREMENTS.md` - Phase 49 requirement definitions and traceability. [VERIFIED: REQUIREMENTS.md]
- `CLAUDE.md` - project constraints and engineering directives. [VERIFIED: CLAUDE.md]
- `docs/architecture/route-policy-boundaries.md` - current route-boundary intent. [VERIFIED: docs/architecture/route-policy-boundaries.md]
- `src/app/api/session/[id]/generate/route.ts`, `src/app/api/file/[sessionId]/route.ts`, `src/app/api/profile/smart-generation/route.ts`, `src/app/api/session/[id]/versions/route.ts`, `src/app/api/session/[id]/compare/route.ts` - current handler shapes. [VERIFIED: codebase grep]
- `src/lib/routes/session-generate/**`, `src/lib/routes/file-access/**`, `src/lib/routes/smart-generation/**`, `src/lib/routes/session-versions/**`, `src/lib/routes/session-compare/**` - current boundary modules, line counts, and existing seam tests. [VERIFIED: codebase grep]
- `vitest.config.ts` and `package.json` - current validation stack and commands. [VERIFIED: vitest.config.ts] [VERIFIED: package.json]
- `npm view next version`, `npm view vitest version`, `npm view zod version` run on 2026-04-20 - latest package versions for comparison. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- `.planning/phases/CURRIA-48-route-policy-extraction-and-decision-normalization/48-REVIEWS.md` - local review findings and residual regression watchlist from the extraction phase. [VERIFIED: 48-REVIEWS.md]

### Tertiary (LOW confidence)
- None. [VERIFIED: codebase grep]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - this phase reuses the existing repo stack and the versions/commands were verified locally. [VERIFIED: package.json] [VERIFIED: npm registry] [VERIFIED: vitest.config.ts]
- Architecture: HIGH - the current route shapes, helper boundaries, and hotspot sizes were inspected directly in the codebase. [VERIFIED: codebase grep]
- Pitfalls: MEDIUM - the concrete leakage and precedence risks are code-backed, but some backslide mechanisms are predictive rather than directly observed. [VERIFIED: codebase grep] [ASSUMED]

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 for repo-specific planning, or sooner if Phase 48/49 route modules change materially. [ASSUMED]
