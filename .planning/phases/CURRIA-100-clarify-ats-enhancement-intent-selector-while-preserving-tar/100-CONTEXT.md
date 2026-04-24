## Phase 100 Context

### Goal

Clarify the ATS enhancement screen by adding an explicit user intent selector for ATS improvement versus target-job adaptation while preserving the existing generation flow, routes, validation, billing, dialogs, toasts, loading states, and compare-page redirect behavior.

### Why This Phase Exists

The current enhancement screen already works, but the product choice is too implicit because the job-description textarea doubles as both explanation and workflow switch. Users should understand, before generating, that they can either:

1. improve the resume for ATS without a specific vacancy
2. adapt the resume for a specific vacancy using a pasted job description

The new UI is a product-clarity layer only. It must reuse the current state and handlers instead of creating a parallel generation flow.

### Locked Decisions

#### Phase Boundary

- In scope: the ATS enhancement / target-job enhancement screen only.
- Out of scope: the profile editing form, resume history, compare experience, backend behavior, generation contracts, and any new generation flow.
- Preserve 100% of existing functionality and backend contracts.

#### Existing Logic To Reuse

- Reuse the enhancement logic already in `src/components/resume/user-data-page.tsx`.
- Preserve and keep wiring around:
  - `targetJobDescription`
  - `setTargetJobDescription`
  - `generationMode`
  - `generationCopy`
  - `handleSetupGeneration`
  - `isRunningAtsEnhancement`
  - `currentCredits`
  - `getGenerationCopy`
  - `SetupGenerationMode`
- Preserve the existing endpoint choice:
  - `/api/profile/ats-enhancement`
  - `/api/profile/smart-generation`

#### UI/Product Contract

- Add a UI-only intent state:
  - `type EnhancementIntent = "ats" | "target_job"`
  - default intent is `"ats"`
- Keep `generationMode` as the behavior source of truth for the actual request flow if other logic depends on it.
- The new selector must use accessible `button` elements with `aria-pressed`.
- ATS mode hides the large textarea and shows a compact ATS explanation card.
- Target-job mode shows the textarea prominently with label, helper copy, and balanced height.
- The CTA copy must clearly match the visible intent:
  - ATS: `Melhorar para ATS (1 crédito)`
  - Target job: `Adaptar para esta vaga (1 crédito)`
- The top bar must keep the existing back behavior and show the selected mode plus available credits.
- The right-hand value panel should be visually stronger but remain subtle, mostly white, with emerald accents only in the value bullets/highlights.

#### Behavior Guardrails

- Selecting ATS must clear `targetJobDescription`.
- Typing into the textarea must keep or switch the UI intent to target-job mode.
- Submitting target-job mode without a non-empty description must show a validation message and must not call `handleSetupGeneration`.
- Do not duplicate fetch logic, do not replace `handleSetupGeneration`, and do not change endpoint selection, credit logic, or route-after-success behavior.
- Preserve:
  - back to profile behavior
  - missing ATS requirements dialog
  - rewrite validation failure dialog
  - success and error toasts
  - compare-page redirect after success
  - loading and disabled states
  - existing tests unless the UI contract intentionally updates them

### Canonical References

- `src/components/resume/user-data-page.tsx` - current enhancement UI, generation state, dialogs, and handlers.
- `src/components/resume/user-data-page.test.tsx` - focused component coverage for ATS and target-job flows.
- `tests/e2e/profile-setup.spec.ts` - user-facing regression coverage for the profile setup/enhancement funnel.
- `src/app/api/profile/ats-enhancement/route.ts` - ATS route contract that must remain untouched.
- `src/app/api/profile/smart-generation/route.ts` - target-job route contract that must remain untouched.

### Acceptance Targets

- ATS intent is explicit and selected by default.
- ATS mode no longer shows a large empty textarea.
- Target-job mode clearly exposes the vacancy textarea.
- Empty target-job submissions are blocked before generation.
- Existing modals, loading states, toasts, and redirects still work.
- No backend contracts or generation semantics change.

### Deferred / Explicit Non-Goals

- No resume profile redesign work.
- No resume history work.
- No new generation pipeline or endpoint.
- No billing, validation-engine, or rewrite-rule changes.
