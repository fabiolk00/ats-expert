# Phase 110 Context

**Gathered:** 2026-04-27
**Status:** Ready for research and planning
**Source:** PRD distilled from user requirements

<domain>
## Phase Boundary

This phase hardens `job_targeting` after Phase 108 and 109 in two ways:

- make the targeted rewrite use explicit evidence and cautious bridges better in partially adherent vacancies;
- stop automatic generation when the vacancy is clearly off-target, routing the user into the existing recoverable override path instead of silently generating an unsafe target resume.

The phase must improve competitiveness for adjacent cases without weakening factual safety for distant cases.
</domain>

<decisions>
## Implementation Decisions

### Locked product decisions

- The solution must stay domain-agnostic. Examples like Java or Sistemas/BI/RH exist only as fixtures and acceptance proof.
- Explicit evidence should be highlighted more aggressively when it is genuinely present in the resume.
- Bridge-only evidence may help wording, but must never become direct skill or role claims.
- Strong off-target conditions must no longer auto-generate final artifacts.
- Off-target gating is recoverable, not terminal: the user may still confirm `Gerar mesmo assim (1 crédito)` or open pricing when credits are unavailable.
- Peripheral similarities must not be enough to claim the target role directly.
- User-facing copy must stay human, PT-BR, and free from internal/debug vocabulary.

### Locked architecture decisions

- Reuse the existing `job_targeting` pipeline; do not create a second targeting flow.
- Reuse the Phase 108 `TargetingPlan` as the canonical contract for evidence-driven decisions.
- Reuse the Phase 109 recoverable modal and override path for the low-fit block.
- The new low-fit decision must happen before final version persistence, `generate_file`, and credit reservation.
- Observability must explain why the low-fit gate triggered and why warnings were promoted.

### The agent's discretion

- Exact helper/module names for the new low-fit and emphasis builders.
- Whether the emphasis layer lives as a new `TargetingPlan` sub-object or an equivalent compact structure.
- The exact core-requirement coverage heuristic, as long as it stays generic and derives from the vacancy text rather than hardcoded role stacks.
</decisions>

<canonical_refs>
## Canonical References

### Existing job-targeting planning and validation seams
- `src/lib/agent/tools/build-targeting-plan.ts` - canonical targeted rewrite plan builder
- `src/lib/agent/job-targeting/evidence-classifier.ts` - semantic evidence classification from Phase 108
- `src/lib/agent/job-targeting/rewrite-permissions.ts` - direct/normalized/bridge claim buckets
- `src/lib/agent/job-targeting/validation-policy.ts` - permission-aware targeted validation policy
- `src/lib/agent/tools/validate-rewrite.ts` - shared validation contract with `job_targeting` branch
- `src/lib/agent/tools/rewrite-resume-full.ts` - targeted prompt construction and skills-surface enforcement

### Pipeline and recoverable flow seams
- `src/lib/agent/job-targeting-pipeline.ts` - targeted rewrite orchestration and current success/block gate
- `src/lib/agent/job-targeting/recoverable-validation.ts` - Phase 109 role-positioning, modal copy, draft creation, and summary retry instructions
- `src/lib/routes/smart-generation/result-normalization.ts` - smart-generation 422 normalization and recoverable payload
- `src/app/api/session/[id]/job-targeting/override/route.ts` - authenticated override endpoint

### UI and billing seams
- `src/components/resume/user-data-page.tsx` - profile setup modal and override trigger
- `src/components/dashboard/resume-workspace.tsx` - workspace modal and override trigger
- `src/lib/dashboard/validation-override-cta.ts` - credit-aware CTA behavior
- `src/lib/resume-generation/generate-billable-resume.ts` - reservation-backed billable generation

### Existing phase artifacts
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md`
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-01-PLAN.md`
- `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-RESEARCH.md`
- `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-01-PLAN.md`
</canonical_refs>

<specifics>
## Specific Ideas

- Add a compact `lowFitWarningGate` contract with reason, ratios, evidence counts, and core requirement coverage.
- Add a compact `safeTargetingEmphasis` contract or equivalent structure derived from `TargetEvidence`.
- Promote fit-related soft warnings to a recoverable block only when low-fit gating is active.
- Reuse the existing Phase 109 modal frame, but with a new low-fit explanatory copy path.
- Ensure off-target cases stop before automatic version persistence and before `generate_file`.
</specifics>

<deferred>
## Deferred Ideas

- Any changes to ATS enhancement behavior
- Any broader redesign of compare/highlight-only flows
- Domain-specific role-family hardcoding
- New billing state machines outside the existing override path
</deferred>
