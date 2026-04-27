# Phase 109: Recoverable job targeting validation - Research

**Researched:** 2026-04-27
**Domain:** `job_targeting` recoverable validation, summary-only retry, override persistence, and billing-safe export reuse
**Confidence:** HIGH for current-state mapping, MEDIUM for the new draft-store and override-route shape

<user_constraints>
## User Constraints (from CONTEXT.md)

No `109-CONTEXT.md` exists for this phase, so there are no additional locked user decisions beyond the PRD and project constraints. [VERIFIED: `node C:/CurrIA/.codex/get-shit-done/bin/gsd-tools.cjs init phase-op 109`; `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

### Locked Decisions

- Scope authority is the Phase 109 PRD. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

### Claude's Discretion

- Choose the lowest-risk brownfield seams that preserve ATS enhancement, generic rewrite, highlight-only, and non-target flows. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; `CLAUDE.md`]

### Deferred Ideas (OUT OF SCOPE)

- Do not remove validation, relax anti-hallucination defaults, change generic ATS enhancement behavior, change highlight-only flows, change generic rewrite behavior, add domain-specific hardcode, or alter the core semantic taxonomy from Phase 108. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]
</user_constraints>

## Summary

The current profile-targeting path is a strict two-step chain: `executeSmartGenerationDecision()` bootstraps a new session, `runJobTargetingPipeline()` rewrites and validates, and only a successful pipeline result reaches `dispatchToolWithContext('generate_file', ...)` for billing-backed artifact generation. A blocked validation currently rolls the session back to the previous valid optimized state, skips highlight generation, returns a generic `422`, and never creates a billable artifact or resumable draft. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`; `src/lib/routes/smart-generation/dispatch.ts`; `src/lib/routes/smart-generation/result-normalization.ts`; `src/lib/agent/job-targeting-pipeline.ts`]

The lowest-risk Phase 109 design is to keep all recovery classification inside `runJobTargetingPipeline()` after the first validation pass, before rollback and before highlight generation. Summary-only retry belongs there because that module already owns the original rewrite result, validation result, trace/log updates, rollback behavior, and final persistence gate. Recoverable override persistence should not live in `agentState`, because the session snapshot route currently returns `targetingPlan`, `optimizedCvState`, and `rewriteValidation` directly to clients. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/app/api/session/[id]/route.ts`]

**Primary recommendation:** add one pipeline-local recovery branch for summary-only retry, persist blocked targeted rewrites in a new server-only draft repository, expose recoverable blocks as a distinct smart-generation response contract, and reuse the existing `generate_file` billing path only after override persistence succeeds. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

## Project Constraints (from CLAUDE.md)

- `cvState` remains canonical resume truth; `agentState` remains operational context only. [VERIFIED: `CLAUDE.md`]
- Preserve the existing brownfield product surface unless the phase explicitly changes scope. [VERIFIED: `CLAUDE.md`]
- Prefer reliability, billing safety, observability, and verification over new feature breadth. [VERIFIED: `CLAUDE.md`]
- Route handlers should stay thin, validate external input with `zod`, and use structured logs through `logInfo`, `logWarn`, and `logError`. [VERIFIED: `CLAUDE.md`]
- Preserve dispatcher / `ToolPatch` patterns when changing agent flows. [VERIFIED: `CLAUDE.md`]
- Resume rewrites must never fabricate new content. [VERIFIED: `CLAUDE.md`]
- New stateful or tool-adjacent behavior needs focused automated coverage. [VERIFIED: `CLAUDE.md`]

## Standard Stack

No new npm packages are recommended for Phase 109; the safest implementation reuses the installed route, validation, dialog, and billing stack already present in the repo. [VERIFIED: `package.json`; `src/app/api/profile/smart-generation/route.ts`; `src/components/resume/user-data-page.tsx`; `src/lib/resume-generation/generate-billable-resume.ts`]

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `14.2.3` [VERIFIED: `package.json`] | Thin API route entrypoints for smart-generation and the new override route. [VERIFIED: `src/app/api/profile/smart-generation/route.ts`] | The repo already normalizes sensitive route behavior through route-local context/decision/response modules. [VERIFIED: `src/lib/routes/smart-generation/context.ts`; `src/lib/routes/smart-generation/decision.ts`; `src/lib/routes/smart-generation/response.ts`] |
| `zod` | `3.23.8` [VERIFIED: `package.json`] | Request-body validation for smart-generation today and override requests next. [VERIFIED: `src/lib/routes/smart-generation/context.ts`] | This is the established route-validation pattern in the codebase. [VERIFIED: `CLAUDE.md`; `src/lib/routes/smart-generation/context.ts`] |
| `vitest` | `1.6.1` [VERIFIED: `npx vitest --version`] | Focused regression proof for pipeline, route, billing, and UI seams. [VERIFIED: `vitest.config.ts`] | The repo already has dense seam-oriented tests around `job_targeting`, smart-generation, billing, and profile UI. [VERIFIED: `src/lib/agent/tools/pipeline.test.ts`; `src/app/api/profile/smart-generation/route.test.ts`; `src/components/resume/user-data-page.test.tsx`; `src/lib/resume-generation/generate-billable-resume.test.ts`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dialog` | `1.1.15` [VERIFIED: `package.json`] | Existing modal primitive surfaced through the local `Dialog` wrapper. [VERIFIED: `src/components/resume/user-data-page.tsx`] | Reuse it for the recoverable validation modal instead of adding a new modal system. [VERIFIED: `src/components/resume/user-data-page.tsx`] |
| `@supabase/supabase-js` | `2.43.0` [VERIFIED: `package.json`] | Existing persistence seam for sessions, CV versions, pending generations, and any new blocked-draft repository. [VERIFIED: `src/lib/db/session-lifecycle.ts`; `src/lib/db/cv-versions.ts`; `src/lib/db/resume-generations.ts`] | Use it for a dedicated server-only override-draft repository. [ASSUMED] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A new server-only blocked-draft table [ASSUMED] | Store the blocked draft in `session.agentState`. [VERIFIED: current session serialization in `src/app/api/session/[id]/route.ts`] | Storing the full draft in `agentState` is lower code volume but high leak risk because the session snapshot already exposes `agentState` fields to the client. [VERIFIED: `src/app/api/session/[id]/route.ts`] |
| A distinct recoverable `409` response contract [ASSUMED] | Reuse the existing `422` validation body. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`; `src/components/resume/user-data-page.tsx`] | Reusing `422` is smaller but risks routing recoverable job-targeting blocks through the current generic validation dialog path. [VERIFIED: `src/components/resume/user-data-page.tsx`] |
| Reuse the existing reservation-backed export path in `generate-billable-resume.ts`. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`] | Build custom “charge on override” logic in the new endpoint. [ASSUMED] | Custom charging would duplicate reserve/finalize/release and idempotency logic that already exists and is heavily tested. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/resume-generation/generate-billable-resume.test.ts`] |

**Installation:** No package additions recommended. [VERIFIED: `package.json`; `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Version verification:** Existing versions came from `package.json` and `npx vitest --version`; this phase does not need new dependency selection or npm-registry verification. [VERIFIED: `package.json`; `npx vitest --version`]

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── app/api/session/[id]/job-targeting/override/route.ts   # thin override endpoint entrypoint
├── lib/routes/job-targeting-override/                     # context / decision / response / types
├── lib/agent/job-targeting/recoverable-validation.ts      # recoverable classification + summary-retry predicates
├── lib/agent/job-targeting/user-facing-validation-modal.ts # server-built modal payload
├── lib/db/job-targeting-override-drafts.ts                # server-only blocked-draft repository
└── lib/agent/job-targeting-pipeline.ts                    # recovery insertion point before rollback/export
```

This keeps the current smart-generation route stack intact and adds one new route stack plus one new server-only draft repository. [VERIFIED: `src/app/api/profile/smart-generation/route.ts`; `src/lib/routes/smart-generation/*.ts`; `src/lib/db/*.ts`]  

### Pattern 1: Summary-Only Retry Inside The Pipeline

**What:** Run one targeted summary rewrite retry only after the first `validateRewrite(...)` returns `blocked`, and only when the hard issues are summary-local and match the PRD’s recoverable issue types. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/tools/validate-rewrite.ts`]

**When to use:** Only in `job_targeting` targeted rewrite, after the first full rewrite has already completed, before `highlightGenerationGate` is evaluated, and before the previous optimized state is restored. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`]

**Recommended seam:** add a small helper such as `attemptRecoverableJobTargetingSummaryRetry(...)` and call it immediately after the first validation result is built. [ASSUMED]

**Why this seam is correct:** `runJobTargetingPipeline()` already owns rewrite diagnostics, validation, trace, rollback, highlight gating, session persistence, and `createCvVersion(...)`; `rewriteResumeFull()` does not know whether a validation failure is localized or recoverable. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`]

**Example:**

```ts
// Source shape: src/lib/agent/job-targeting-pipeline.ts
const firstValidation = validateRewrite(originalCvState, optimizedCvState, context)

const retry = await attemptRecoverableJobTargetingSummaryRetry({
  originalCvState,
  optimizedCvState,
  targetingPlan,
  firstValidation,
  targetJobDescription,
})

const effectiveCvState = retry.optimizedCvState ?? optimizedCvState
const effectiveValidation = retry.validation ?? firstValidation
```

### Pattern 2: Keep Blocked Drafts Server-Only

**What:** Persist a blocked targeted rewrite in a dedicated repository keyed by `id`, `sessionId`, `userId`, `expiresAt`, and the exact blocked payload needed for a later override. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**When to use:** Only when validation remains blocked after any allowed summary retry and the block is recoverable rather than technical. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Recommended stored fields:** `optimizedCvState`, `originalCvState`, `targetJobDescription`, `targetRole`, `targetingPlan`, `optimizationSummary`, `validationIssues`, `rewriteDiagnostics`, and draft lifecycle metadata (`status`, `expiresAt`, `consumedAt`, `dismissedAt`). [ASSUMED]

**Why a separate store is safer:** the session snapshot route currently returns `targetingPlan`, `optimizedCvState`, and `rewriteValidation` directly, so putting the blocked optimized draft in `agentState` would either leak it or force cross-route filtering work later. [VERIFIED: `src/app/api/session/[id]/route.ts`]

### Pattern 3: Distinct Recoverable Response Normalization

**What:** Extend the smart-generation decision union with one explicit recoverable-block outcome rather than overloading the existing `validation_error` contract. [ASSUMED]

**When to use:** Only when `workflowMode === 'job_targeting'`, the blocked rewrite has a usable optimized draft, the block is factual rather than technical, and the CTA is allowed. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Recommended HTTP shape:** return `409` with `{ status: 'validation_blocked_recoverable', modal, overrideToken, rewriteValidation, sessionId, workflowMode }`. [ASSUMED]

**Why `409` is safer than reusing `422`:** the frontend currently treats `422` plus `rewriteValidation` as one generic blocking dialog, so a distinct status cleanly separates the new modal contract without regressing the old path. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/app/api/profile/smart-generation/route.test.ts`] 

**Example:**

```ts
// Source seam: src/lib/routes/smart-generation/result-normalization.ts
return {
  kind: 'recoverable_validation_block',
  status: 409,
  body: {
    status: 'validation_blocked_recoverable',
    sessionId,
    workflowMode: 'job_targeting',
    modal,
    overrideToken,
    rewriteValidation,
  },
}
```

### Pattern 4: Override Route Persists First, Bills Second

**What:** Add `POST /api/session/[id]/job-targeting/override` with one authenticated route-local stack that validates the token, persists the blocked rewrite into the session/CV version seams, then dispatches the normal billable export flow. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; `src/lib/routes/smart-generation/decision.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

**When to use:** Only for explicit user confirmation of a recoverable factual block. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Recommended request body:** `{ overrideToken: string; action: 'confirm' | 'close' }`. [ASSUMED]

**Why this shape is low risk:** it keeps modal close analytics and confirm flow on one endpoint, and it reuses the current `generate_file` billing machinery only after override persistence has already succeeded. [ASSUMED]

**Recommended sequence:**

1. Resolve app user and trusted request. [VERIFIED: `src/lib/routes/smart-generation/context.ts`]
2. Load the session by `sessionId` and verify ownership. [VERIFIED: `src/app/api/session/[id]/route.ts`; `src/lib/db/session-lifecycle.ts`]
3. Load the blocked draft by `overrideToken`, verify `userId`, `sessionId`, `status`, and `expiresAt`. [ASSUMED]
4. If `action === 'close'`, mark the draft dismissed and log `agent.job_targeting.validation_override_closed`. [ASSUMED]
5. If `action === 'confirm'`, write `optimizedCvState`, `optimizationSummary`, `lastRewriteMode`, `rewriteStatus`, original blocked `rewriteValidation`, and explicit `validationOverride` metadata into the session. [ASSUMED]
6. Create a `cv_versions` snapshot with source `job-targeting` before export dispatch. [VERIFIED: `src/lib/db/cv-versions.ts`; `src/lib/routes/smart-generation/decision.ts`]
7. Call `dispatchToolWithContext('generate_file', ...)` with a new stable idempotency key prefix such as `profile-target-override:${sessionId}:${draftId}`. [ASSUMED]
8. Let `generate-billable-resume.ts` reserve, render, release, and finalize credits exactly as it already does. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`]

### Pattern 5: Integrate `targetRolePositioning` Into The Existing Phase 108 Plan

**What:** Compute the new `targetRolePositioning` field inside `buildTargetedRewritePlan(...)`, not in the prompt layer and not in the validator. [VERIFIED: Phase 109 PRD field contract in `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; current Phase 108 targeting-plan ownership in `src/lib/agent/tools/build-targeting-plan.ts`] 

**When to use:** During targeted-plan assembly after `targetEvidence` and `rewritePermissions` are known, using `careerFitEvaluation` plus an `unsupportedGapRatio` derived from `targetEvidence`. [ASSUMED]

**Required call-site change:** extend `buildTargetedRewritePlan(...)` input to receive `careerFitEvaluation`, which `runJobTargetingPipeline()` already computes before it builds the targeting plan. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/tools/build-targeting-plan.ts`]

**Why this is the right seam:** Phase 108 already made `TargetingPlan` the canonical contract shared by targeted rewrite, targeted validation, and session persistence. Adding `targetRolePositioning` there preserves one source of truth. [VERIFIED: `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md`; `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`; `src/lib/agent/tools/validate-rewrite.ts`]

### Anti-Patterns to Avoid

- **Do not store the blocked optimized draft in `agentState`:** the session route already exposes `agentState` fields, so this creates data-leak and payload-bloat risk. [VERIFIED: `src/app/api/session/[id]/route.ts`]
- **Do not rerun `rewriteResumeFull()` for summary retry:** that would reopen skills and experience mutations when the PRD allows only summary-local repair. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; `src/lib/agent/tools/rewrite-resume-full.ts`]
- **Do not bypass `generate-billable-resume.ts` for charging:** the reservation/finalize/release state machine is already implemented and tested there. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/resume-generation/generate-billable-resume.test.ts`] 
- **Do not make ATS routes aware of recoverable job-targeting modal payloads:** ATS enhancement uses a separate route and should keep its current contract. [VERIFIED: `src/app/api/profile/ats-enhancement/route.ts`; `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]
- **Do not change highlight generation in this phase:** the current job-targeting pipeline intentionally skips highlight generation on blocked validation, and Phase 109 does not require reopening highlight semantics. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Credit charging for override success | A new manual charge/refund flow. [ASSUMED] | `generate-billable-resume.ts` through `dispatchToolWithContext('generate_file', ...)`. [VERIFIED: `src/lib/routes/smart-generation/dispatch.ts`; `src/lib/resume-generation/generate-billable-resume.ts`] | It already guarantees reserve/finalize/release, idempotency, history metadata, and reconciliation behavior. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/resume-generation/generate-billable-resume.test.ts`] |
| Override token verification | A signed JWT or encrypted client blob. [ASSUMED] | An opaque server-side draft identifier looked up by user, session, status, and expiry. [ASSUMED] | The repo already resolves ownership through authenticated server reads; server lookup is simpler and avoids exposing resume payloads. [VERIFIED: `src/lib/db/session-lifecycle.ts`; `src/app/api/session/[id]/route.ts`] |
| Recoverable modal UI | A new modal framework. [ASSUMED] | The existing `Dialog`/`DialogContent` stack in `user-data-page.tsx`. [VERIFIED: `src/components/resume/user-data-page.tsx`] | The current page already presents validation blocks through this primitive, so the change is incremental. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/components/resume/user-data-page.test.tsx`] |
| Analytics plumbing | A separate client analytics SDK for server-domain events. [ASSUMED] | Structured logs (`logInfo`/`logWarn`) and existing metric counters for server-side lifecycle events. [VERIFIED: `CLAUDE.md`; `src/lib/observability/structured-log.ts`; `src/lib/observability/metric-events.ts`; `src/lib/resume-generation/generate-billable-resume.ts`] | The repo’s operational event model already lives there. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/agent/job-targeting-pipeline.ts`] |

**Key insight:** Phase 109 should extend existing route, pipeline, and billing seams, not introduce a parallel targeting/export architecture. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`; `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

## Common Pitfalls

### Pitfall 1: Leaking The Blocked Draft Through Session Reads

**What goes wrong:** a blocked optimized resume gets persisted into a client-visible session field before the user confirms override. [VERIFIED: `src/app/api/session/[id]/route.ts`]

**Why it happens:** the session snapshot route already returns `targetingPlan`, `optimizedCvState`, and `rewriteValidation`, so any new `agentState` field is easy to expose accidentally. [VERIFIED: `src/app/api/session/[id]/route.ts`]

**How to avoid:** keep the full blocked draft in a separate server-only repository and return only a modal payload plus opaque token in the response. [ASSUMED]

**Warning signs:** the session response grows a new blocked-draft blob, or compare/session-route tests start snapshotting sensitive draft data. [VERIFIED: `src/app/api/session/[id]/route.ts`; `src/app/api/session/[id]/route.test.ts`]

### Pitfall 2: Summary Retry Accidentally Rewrites Other Sections

**What goes wrong:** “summary retry” silently reopens skills or experience and changes non-localized content. [VERIFIED: Phase 109 PRD summary-retry scope in `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Why it happens:** `rewriteResumeFull()` is section-iterative and shared across ATS/job-targeting, so a naive reuse would rerun broad behavior. [VERIFIED: `src/lib/agent/tools/rewrite-resume-full.ts`]

**How to avoid:** add a dedicated summary-only helper that reuses the targeted summary prompt rules and revalidates only the updated summary against the full resume. [ASSUMED]

**Warning signs:** retry logic touches `skills`, `experience`, `highlightState`, or `sectionAttempts` outside the summary branch. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`] 

### Pitfall 3: Charging Before Persistence Or Outside The Reservation State Machine

**What goes wrong:** a confirm click consumes a credit even when the override draft cannot be persisted or the export later fails. [VERIFIED: Phase 109 billing invariants in `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

**Why it happens:** the new endpoint might be tempted to charge directly or call billing before `createCvVersion(...)` and session persistence. [ASSUMED]

**How to avoid:** persist override state first, then call `generate_file`, which already reserves and releases/finalizes safely. [VERIFIED: `src/lib/db/cv-versions.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

**Warning signs:** the new route imports `consumeCredit*` directly instead of reusing `dispatchToolWithContext('generate_file', ...)`. [VERIFIED: current smart-generation artifact path in `src/lib/routes/smart-generation/dispatch.ts`] 

### Pitfall 4: Reusing The Generic `422` UI Path For Recoverable Blocks

**What goes wrong:** the frontend still shows the current “we stopped automatically” dialog instead of the new recoverable modal with override CTA. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/components/resume/user-data-page.test.tsx`]

**Why it happens:** `user-data-page.tsx` currently branches only on `400`, `422`, and generic success/failure. [VERIFIED: `src/components/resume/user-data-page.tsx`]

**How to avoid:** introduce a dedicated recoverable state branch and modal payload type, keyed to a distinct response contract. [ASSUMED]

**Warning signs:** the new route returns modal data but the UI still calls `setRewriteValidationFailure(...)`. [VERIFIED: `src/components/resume/user-data-page.tsx`] 

### Pitfall 5: Copy And Encoding Drift In User-Facing Strings

**What goes wrong:** new modal text reintroduces mojibake or internal/debug vocabulary. [VERIFIED: Phase 109 PRD encoding requirement in `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; existing copy-audit scripts in `package.json`]

**Why it happens:** this repo has recent history of pt-BR encoding fixes, and new strings will touch both server payloads and client modals. [VERIFIED: `.planning/STATE.md`; `package.json`; `src/components/resume/user-data-page.tsx`]

**How to avoid:** keep copy generation server-side in one pure helper, assert UTF-8 strings in targeted tests, and run `npm run audit:copy-regression`. [VERIFIED: `package.json`; `src/components/resume/user-data-page.test.tsx`] 

**Warning signs:** strings such as `currÃ­culo`, `evidÃªncia`, or internal terms like `unsupported_gap` appear in route responses or UI snapshots. [VERIFIED: Phase 109 PRD in `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]

## Code Examples

Verified patterns from current repo seams:

### Recovery Branch Before Rollback

```ts
// Source seam: src/lib/agent/job-targeting-pipeline.ts
const validation = validateRewrite(session.cvState, rewriteResult.optimizedCvState, context)

if (shouldAttemptSummaryRetry({ validation, optimizedCvState: rewriteResult.optimizedCvState })) {
  const retried = await retryBlockedTargetingSummary(...)
  validation = retried.validation
  optimizedCvState = retried.optimizedCvState
}

if (validation.blocked && isRecoverableValidationBlock(...)) {
  const draft = await createBlockedTargetingOverrideDraft(...)
  return { success: false, validation, recoverableBlock: { overrideToken: draft.id } }
}
```

This example matches the current ownership boundary: the pipeline decides validation fate before artifact generation. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`]

### Override Confirm Reusing The Existing Billable Artifact Path

```ts
// Source seam: src/lib/routes/smart-generation/dispatch.ts + src/lib/resume-generation/generate-billable-resume.ts
await createCvVersion({ sessionId, snapshot: draft.optimizedCvState, source: 'job-targeting' })
await updateSession(sessionId, persistedOverridePatch)

const generationResult = await dispatchToolWithContext('generate_file', {
  cv_state: draft.optimizedCvState,
  idempotency_key: `profile-target-override:${sessionId}:${draft.id}`,
}, patchedSession)
```

This keeps charging inside the tested reservation-backed export flow. [VERIFIED: `src/lib/routes/smart-generation/dispatch.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Target validation treated unsupported target-role claims mostly as a simple direct-role/missing-gap block. [VERIFIED: `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md`] | Phase 108 added `targetEvidence` and `rewritePermissions`, and target-only validation now understands direct, normalized, bridge, contextual-only, and forbidden claims. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/job-targeting/validation-policy.ts`] | Phase 108, 2026-04-26 to 2026-04-27. [VERIFIED: `.planning/STATE.md`; `108-RESEARCH.md`] | Phase 109 should extend this plan layer with `targetRolePositioning`, not create a second claimability system. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`] |
| Smart-generation could normalize only success and generic validation failure. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`] | Smart-generation already uses thin route -> context -> decision -> dispatch -> response seams. [VERIFIED: `src/app/api/profile/smart-generation/route.ts`; `src/lib/routes/smart-generation/*.ts`] | Route architecture hardened earlier in the milestone. [VERIFIED: `.planning/ROADMAP.md`; `.planning/STATE.md`] | Phase 109 can add one new normalized decision outcome without route-body sprawl. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`] |
| Export billing used to be more opaque. [VERIFIED: `.planning/ROADMAP.md`; `.planning/STATE.md`] | Export billing now uses reservation-backed reserve/finalize/release with pending/completed generation persistence and reconciliation markers. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/db/credit-reservations.ts`; `src/lib/db/resume-generations.ts`] | Phases 43 to 45, 59, and 60. [VERIFIED: `.planning/ROADMAP.md`; `.planning/STATE.md`] | Override confirm should reuse this exact seam instead of adding custom credit mutation logic. [VERIFIED: `src/lib/resume-generation/generate-billable-resume.ts`] |

**Deprecated/outdated:**

- Treating every job-targeting validation block as a hard UX dead end is now outdated for recoverable factual failures. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`; `src/components/resume/user-data-page.tsx`]
- Putting more client-visible operational payload directly into `agentState` is outdated for sensitive blocked-draft data because the session snapshot route already serializes much of `agentState`. [VERIFIED: `src/app/api/session/[id]/route.ts`] 

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A dedicated server-only blocked-draft repository is preferable to storing the draft in `agentState`. [ASSUMED] | Architecture Patterns | If wrong, the plan may over-scope new persistence instead of reusing session storage safely. |
| A2 | A distinct `409` recoverable-block response is safer than overloading the existing `422` contract. [ASSUMED] | Architecture Patterns | If wrong, the planner may add unnecessary response variants when the UI could tolerate one status. |
| A3 | The override endpoint can safely support both `confirm` and `close` actions on one route body. [ASSUMED] | Architecture Patterns | If wrong, analytics/cleanup for modal close may need a second endpoint or client-only telemetry. |
| A4 | `targetRolePositioning` should be computed inside `buildTargetedRewritePlan(...)` after `targetEvidence` is known and with `careerFitEvaluation` passed in. [ASSUMED] | Architecture Patterns | If wrong, the implementation may need a different plan builder or an earlier pipeline seam. |

## Open Questions

1. **Should the compare UI visibly badge “generated with validation override” immediately, or is backend persistence enough for this phase?**
   - What we know: the PRD requires override metadata persistence for audit, but it does not explicitly require a compare-page badge. [VERIFIED: `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md`]
   - What's unclear: whether product wants explicit downstream UI labeling in this phase or only stored metadata. [VERIFIED: PRD silence on compare-page badge]
   - Recommendation: persist metadata now, keep the public response shape capable of adding an override flag later, and defer extra compare-page UI unless implementation planning confirms it is required. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Typecheck, route tests, Vitest execution. [VERIFIED: `package.json`] | ✓ [VERIFIED: `node --version`] | `v24.14.0` [VERIFIED: `node --version`] | — |
| npm | Script execution for typecheck, copy audit, and targeted suites. [VERIFIED: `package.json`] | ✓ [VERIFIED: `npm --version`] | `11.9.0` [VERIFIED: `npm --version`] | — |
| Vitest CLI | Focused seam verification. [VERIFIED: `vitest.config.ts`; `package.json`] | ✓ [VERIFIED: `npx vitest --version`] | `1.6.1` [VERIFIED: `npx vitest --version`] | — |
| Supabase / Postgres runtime | Real draft/session/version persistence at execution time. [VERIFIED: `src/lib/db/session-lifecycle.ts`; `src/lib/db/cv-versions.ts`; `src/lib/db/resume-generations.ts`] | Not probed locally in this research pass. [VERIFIED: no local service probe executed] | — | Use mocked route/unit suites first; add integration smoke only if execution needs live DB proof. [VERIFIED: existing mocked suites in `src/app/api/profile/smart-generation/route.test.ts`; `src/lib/agent/tools/pipeline.test.ts`; `src/lib/resume-generation/generate-billable-resume.test.ts`] |

**Missing dependencies with no fallback:**

- None for planning and mocked verification. [VERIFIED: current test surfaces listed above]

**Missing dependencies with fallback:**

- Local Supabase/Postgres was not probed; the recommended Phase 109 verification loop can still run through mocked Vitest seams first. [VERIFIED: `src/app/api/profile/smart-generation/route.test.ts`; `src/lib/resume-generation/generate-billable-resume.test.ts`; `src/lib/db/*.test.ts`] 

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` `1.6.1` with node default and `jsdom` for `*.test.tsx`. [VERIFIED: `vitest.config.ts`; `npx vitest --version`] |
| Config file | `vitest.config.ts`. [VERIFIED: `vitest.config.ts`] |
| Quick run command | `npm run typecheck`. [VERIFIED: `package.json`] |
| Full suite command | `npm test`. [VERIFIED: `package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P109-01 | `targetRolePositioning` blocks direct target-role identity for distant/high-risk weak-evidence cases. [VERIFIED: Phase 109 PRD] | unit | `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/validate-rewrite.test.ts` | ✅ |
| P109-02 | Summary-only recoverable validation triggers one summary retry and revalidation, while skills/experience blocks skip retry. [VERIFIED: Phase 109 PRD] | unit/integration | `npx vitest run src/lib/agent/tools/pipeline.test.ts` | ✅ |
| P109-03 | Recoverable job-targeting blocks return modal payload plus override token, while unrecoverable blocks keep the generic failure path. [VERIFIED: Phase 109 PRD] | route | `npx vitest run src/lib/routes/smart-generation/decision.test.ts src/app/api/profile/smart-generation/route.test.ts` | ✅ |
| P109-04 | Profile UI shows the dedicated recoverable modal, hides the paid CTA for technical failures, and keeps ATS/no-target behavior unchanged. [VERIFIED: Phase 109 PRD] | component | `npx vitest run src/components/resume/user-data-page.test.tsx` | ✅ |
| P109-05 | Override confirm persists the blocked targeted version, charges exactly once on success, and never charges when persistence fails or render releases the hold. [VERIFIED: Phase 109 PRD] | route/service | `npx vitest run src/app/api/session/[id]/job-targeting/override/route.test.ts src/lib/resume-generation/generate-billable-resume.test.ts` | ❌ Wave 0 |
| P109-06 | New user-facing strings stay UTF-8 safe and avoid internal debug vocabulary. [VERIFIED: Phase 109 PRD] | copy audit + component | `npm run audit:copy-regression && npx vitest run src/components/resume/user-data-page.test.tsx` | ✅ |

### Sampling Rate

- **Per task commit:** `npm run typecheck` [VERIFIED: `package.json`]
- **Per wave merge:** `npx vitest run src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts src/components/resume/user-data-page.test.tsx src/lib/resume-generation/generate-billable-resume.test.ts` [VERIFIED: existing file paths]
- **Phase gate:** `npm run typecheck && npm run audit:copy-regression && npm test -- src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts src/components/resume/user-data-page.test.tsx src/lib/resume-generation/generate-billable-resume.test.ts src/lib/routes/smart-generation/decision.test.ts src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/build-targeting-plan.test.ts` [VERIFIED: `package.json`; existing test files]

### Wave 0 Gaps

- [ ] `src/app/api/session/[id]/job-targeting/override/route.test.ts` — prove ownership, expiry, close-vs-confirm behavior, persistence-before-billing, and successful compare redirect payload. [ASSUMED]
- [ ] `src/lib/db/job-targeting-override-drafts.test.ts` — prove draft create/load/consume/dismiss/expiry semantics stay server-only and deterministic. [ASSUMED]
- [ ] `src/lib/agent/job-targeting/recoverable-validation.test.ts` or equivalent new coverage in existing suites — isolate summary-retry eligibility and recoverable-block classification rules from the full pipeline test matrix. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes [VERIFIED: current authenticated routes use `getCurrentAppUser()` in `src/lib/routes/smart-generation/context.ts` and `src/app/api/session/[id]/route.ts`] | Reuse `getCurrentAppUser()` in the new override route context. [VERIFIED: `src/lib/routes/smart-generation/context.ts`] |
| V3 Session Management | no major new session primitive. [VERIFIED: Phase 109 adds endpoint/state changes, not a new auth/session subsystem] | Keep existing session bundle semantics unchanged. [VERIFIED: `src/types/agent.ts`; `CLAUDE.md`] |
| V4 Access Control | yes [VERIFIED: override endpoint is session-owned and user-owned by PRD definition] | Verify app user, session ownership, draft ownership, token status, and expiry before any confirm/close action. [ASSUMED] |
| V5 Input Validation | yes [VERIFIED: project convention in `CLAUDE.md`; current smart-generation route uses `zod` in `src/lib/routes/smart-generation/context.ts`] | Use `zod` request schemas for `{ overrideToken, action }` and reject malformed or missing values early. [VERIFIED: `src/lib/routes/smart-generation/context.ts`; `package.json`] |
| V6 Cryptography | no custom crypto required if the token is opaque and server-resolved. [ASSUMED] | Prefer opaque server-side token lookup over custom signed token design. [ASSUMED] |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Override token replay or double-confirm clicks. [VERIFIED: Phase 109 override-token requirement in PRD] | Tampering / Repudiation | One-time draft status (`pending` -> `consumed`), stable idempotency key for export, and reuse of pending/completed `resume_generations` behavior. [ASSUMED; VERIFIED for idempotent export path in `src/lib/resume-generation/generate-billable-resume.ts`; `src/lib/db/resume-generations.ts`] |
| Cross-user or cross-session override execution. [VERIFIED: PRD requires ownership validation] | Elevation of Privilege | Authenticate user, load the session by owner, and require exact `draft.userId === appUser.id` plus `draft.sessionId === session.id`. [ASSUMED] |
| Charging without a persisted override state. [VERIFIED: PRD charging invariant] | Tampering | Persist session/CV version first, then dispatch `generate_file`, which handles reserve/finalize/release and returns no charge on release paths. [VERIFIED: `src/lib/db/cv-versions.ts`; `src/lib/resume-generation/generate-billable-resume.ts`] |
| Client leakage of unsupported draft text or internal rationale. [VERIFIED: current session serialization in `src/app/api/session/[id]/route.ts`; PRD asks for user-facing modal copy] | Information Disclosure | Keep the full blocked draft server-side and return only modal-safe text, issue summaries, and opaque token values. [ASSUMED] |
| Modal close path silently leaving a reusable draft forever. [VERIFIED: PRD wants close analytics and controlled override token lifecycle] | Repudiation / Tampering | Support a best-effort `action: 'close'` endpoint path that marks the draft dismissed or expired. [ASSUMED] |

## Sources

### Primary (HIGH confidence)

- `CLAUDE.md` - project constraints, state ownership, logging, and brownfield guidance.
- `.planning/config.json` - validation and security enforcement flags.
- `.planning/REQUIREMENTS.md` - milestone constraints around billing, route architecture, and ATS isolation.
- `.planning/STATE.md` - recent phase history and current architectural decisions.
- `.planning/ROADMAP.md` - Phase 108 and 109 positioning in the milestone.
- `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-PRD.md` - feature scope, flows, tests, and acceptance criteria.
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md` - current semantic-evidence architecture boundary.
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-01-PLAN.md` - current implementation seams and isolation rules.
- `src/lib/agent/job-targeting-pipeline.ts` - current job-targeting rewrite/validate/rollback/persist flow.
- `src/lib/agent/job-targeting-retry.ts` - current job-targeting retry and shaping helpers.
- `src/lib/agent/tools/rewrite-resume-full.ts` - shared rewrite orchestration and current job-targeting prompt branch.
- `src/lib/agent/tools/validate-rewrite.ts` - shared validation contract and target-only block behavior.
- `src/lib/agent/tools/build-targeting-plan.ts` - current targeted-plan ownership and Phase 108 evidence integration seam.
- `src/lib/agent/job-targeting/rewrite-permissions.ts` - current permission buckets.
- `src/lib/agent/job-targeting/validation-policy.ts` - current target-only evidence-aware validation.
- `src/lib/routes/smart-generation/context.ts` - request validation and auth/trust seam.
- `src/lib/routes/smart-generation/decision.ts` - current pipeline/export orchestration seam.
- `src/lib/routes/smart-generation/dispatch.ts` - current artifact dispatch seam.
- `src/lib/routes/smart-generation/result-normalization.ts` - current success/failure response normalization.
- `src/lib/routes/smart-generation/response.ts` - current HTTP mapping seam.
- `src/lib/routes/smart-generation/session-bootstrap.ts` - current session bootstrap and patching seam.
- `src/lib/db/cv-versions.ts` - current immutable version persistence seam.
- `src/lib/db/resume-generations.ts` - pending/completed generation persistence seam.
- `src/lib/db/sessions.ts` and `src/lib/db/session-lifecycle.ts` - session create/get/update/applyPatch seams.
- `src/lib/resume-generation/generate-billable-resume.ts` - reserve/render/release/finalize export billing seam.
- `src/lib/asaas/quota.ts` - billing gateway functions used by the export flow.
- `src/lib/resume-history/resume-generation-history.ts` - target-job history metadata seam.
- `src/app/api/profile/smart-generation/route.ts` - thin smart-generation route entrypoint.
- `src/app/api/session/[id]/route.ts` - session serialization and leak-risk seam.
- `src/components/resume/user-data-page.tsx` - current submit flow, `422` dialog, credit copy, and compare redirect.
- `src/types/agent.ts` - current session, validation, targeting-plan, and workflow contracts.
- `src/types/trace.ts` - current `JobTargetingTrace` contract.
- `package.json` - scripts and installed package versions.
- `vitest.config.ts` - test environment configuration.
- `src/app/api/profile/smart-generation/route.test.ts` - current route behavior and `422` validation expectations.
- `src/components/resume/user-data-page.test.tsx` - current profile UI and validation dialog behavior.
- `src/lib/agent/tools/pipeline.test.ts` - current job-targeting pipeline regression surface.
- `src/lib/resume-generation/generate-billable-resume.test.ts` - current billing/export invariants.

### Secondary (MEDIUM confidence)

- None.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - the phase can reuse installed packages and existing route/billing/UI seams without new dependency research. [VERIFIED: `package.json`; current code paths above]
- Architecture: MEDIUM - the current ownership map is clear, but the exact draft-store and response-status shape are new design choices rather than already-implemented code. [VERIFIED: current code paths; ASSUMED for new draft/recoverable route shape]
- Pitfalls: HIGH - the biggest risks come directly from observable current seams: session serialization, shared rewrite/validation code, and reservation-backed billing. [VERIFIED: `src/app/api/session/[id]/route.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`; `src/lib/resume-generation/generate-billable-resume.ts`]

**Research date:** 2026-04-27
**Valid until:** 2026-05-27
