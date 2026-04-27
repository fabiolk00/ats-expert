# Phase 109 Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Source:** PRD distilled from user requirements

<domain>
## Phase Boundary

This phase hardens `job_targeting` factual validation so a blocked targeted rewrite becomes recoverable without weakening the anti-hallucination contract.

The phase must:

- keep validation as the default protection;
- add summary-only retry when the failure is localized and recoverable;
- convert the current technical-feeling validation block into a human product modal;
- preserve a blocked targeted rewrite draft so the user can confirm a paid override;
- charge a credit only when override persistence + generation succeed;
- keep ATS enhancement and non-target flows behaviorally unchanged.
</domain>

<decisions>
## Implementation Decisions

### Locked product decisions

- Recoverable factual validation is not a dead-end. The user must receive an explanation plus a choice.
- The override CTA is only valid for recoverable validation blocks, never for infra/technical failures.
- Summary retry is allowed only when hard issues are localized to `summary` and match approved issue classes.
- Distant target roles must not become direct professional identity claims.
- Bridges may remain honest and useful, but must not become direct unsupported claims.
- User-facing copy must avoid internal/debug vocabulary.
- UTF-8 user-facing strings are a hard requirement.

### Locked architecture decisions

- Reuse the existing `job_targeting` pipeline as the core orchestration seam; do not build a parallel targeting pipeline.
- Preserve temporary blocked rewrite state in `session.agentState` rather than introducing a large new persistence subsystem.
- Reuse the existing `422` smart-generation validation response path to carry recoverable modal payloads and override token information.
- Reuse existing billable artifact generation and credit reservation logic for the override flow so charging rules stay centralized.
- Persist final override audit data in operational metadata/state layers already designed for that purpose.

### The agent's discretion

- Exact helper/module names, as long as the responsibilities stay small and isolated.
- Whether modal-building logic lives in a new `job-targeting` helper or in smart-generation normalization utilities.
- Whether blocked draft serialization uses a signed token or an opaque random token stored in `agentState`, provided ownership, expiry, and replay safety are enforced.
</decisions>

<canonical_refs>
## Canonical References

### Current pipeline and validation seams
- `src/lib/agent/job-targeting-pipeline.ts` - main targeted rewrite pipeline and current validation block point
- `src/lib/agent/tools/rewrite-resume-full.ts` - targeted rewrite prompt construction
- `src/lib/agent/tools/validate-rewrite.ts` - shared validation contract and job_targeting branch
- `src/lib/agent/job-targeting/validation-policy.ts` - Phase 108 permission-aware target validation

### Existing semantic layer
- `src/lib/agent/tools/build-targeting-plan.ts` - enriched targeted rewrite plan builder
- `src/lib/agent/job-targeting/evidence-classifier.ts` - semantic evidence classification
- `src/lib/agent/job-targeting/rewrite-permissions.ts` - claimability buckets for prompts
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md`
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-01-PLAN.md`

### Smart-generation response and UI seams
- `src/lib/routes/smart-generation/decision.ts` - smart-generation orchestration
- `src/lib/routes/smart-generation/result-normalization.ts` - 422 normalization path
- `src/lib/routes/smart-generation/types.ts` - public response contract
- `src/components/resume/user-data-page.tsx` - current validation modal and profile generation UX
- `src/components/dashboard/resume-workspace.tsx` - session snapshot consumer with validation modal copy

### Billing, persistence, and audit seams
- `src/lib/resume-generation/generate-billable-resume.ts` - credit reservation/finalization and artifact generation
- `src/lib/db/resume-generations.ts` - resume generation persistence and existing metadata-ready record
- `src/lib/db/cv-versions.ts` - version snapshot persistence
- `src/lib/db/sessions.ts` - session state persistence
- `src/lib/db/credit-reservations.ts` - reservation transitions and metadata
- `src/lib/asaas/quota.ts` - billing quota wrappers

### Session exposure and serialization
- `src/app/api/session/[id]/route.ts` - session snapshot serialization
- `src/app/api/profile/smart-generation/route.ts` - entry route for smart generation
</canonical_refs>

<specifics>
## Specific Ideas

- Add `targetRolePositioning` into `TargetingPlan` so the prompt and validator can agree on safe role identity rules.
- Extend validation issues with `issueType`, `offendingSignal`, `offendingText`, `suggestedReplacement`, and user-facing fields.
- Add a dedicated override endpoint under the authenticated session surface.
- Preserve the blocked optimized CV draft separately from `optimizedCvState`, because the pipeline currently rolls back `optimizedCvState` when validation blocks.
</specifics>

<deferred>
## Deferred Ideas

- Any broad redesign of ATS, generic rewrite, or highlight-only flows
- New domain-specific taxonomies beyond Phase 108's generic semantic layer
- Large billing architecture rewrites outside the override safety needs of this phase
</deferred>
