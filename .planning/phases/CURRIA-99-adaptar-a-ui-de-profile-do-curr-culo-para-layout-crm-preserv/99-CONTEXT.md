# Phase 99: Adaptar a UI de profile do currículo para layout CRM preservando 100% da lógica e funcionalidade existente - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Source:** User PRD and repo inspection

<domain>
## Phase Boundary

This phase only adapts the resume profile page presentation shell around the existing implementation in `src/components/resume/user-data-page.tsx`.

It must preserve existing behavior for:

- profile loading from `/api/profile`
- profile saving to `/api/profile`
- LinkedIn import
- PDF import
- manual editing through the current editor
- existing `resumeData` ownership, normalization, and sanitization
- ATS enhancement flow
- target-job adaptation flow
- missing ATS requirements dialog
- rewrite validation failure dialog
- credits checks
- download behavior
- compare-page routing after generation
- toast, loading, disabled, and validation behavior

Out of scope:

- resume history screens
- new routes
- API contract changes
- billing or credit-logic changes
- ATS or target-job business-logic rewrites
- persistence changes outside the existing page flow

</domain>

<decisions>
## Implementation Decisions

### Layout direction

- Replace the current sidebar and KPI-shell presentation with the approved clean CRM-style page layout.
- Keep a white background, rounded section cards, subtle borders, compact profile header, black primary action buttons, and a two-column information layout.
- Do not reintroduce a global dashboard header inside this component.
- Do not keep the current preview sidebar or KPI cards unless a specific existing behavior truly depends on them.

### Behavior preservation

- `src/components/resume/user-data-page.tsx` remains the canonical source of truth for handlers, state, and network calls.
- Existing flows must be preserved instead of rewritten: import modal, save, enhancement, dialogs, generation loading, and any download behavior already present in the current implementation.
- Use the current `VisualResumeEditor` rather than building a disconnected second editor.
- If edit buttons are added to section cards, they must trigger real section-edit behavior by opening, focusing, or revealing the existing editor state.
- Keep disabled, loading, toast, and validation behavior functionally identical to the current implementation.

### Data fidelity

- Render from the real page state (`resumeData`, normalized/sanitized data, `template`, existing profile response) rather than mock examples.
- Preserve current empty-state behavior and do not hardcode sample content into the production page.
- Long content must remain accessible through scroll-safe section containers rather than truncation-only rendering.

### Testing expectations

- Update or add focused tests to lock preserved behavior while asserting the new edit affordances and layout-specific overflow behavior.
- Do not rely on brittle snapshot-only coverage.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary implementation seam

- `src/components/resume/user-data-page.tsx` - current page state, handlers, dialogs, generation flow, and overall UX shell.
- `src/components/resume/user-data-page.test.tsx` - current regression expectations that cannot be weakened.

### Editing and import seams

- `src/components/resume/visual-resume-editor.tsx` - canonical manual editor behavior, section expand/collapse logic, and normalization defaults.
- `src/components/resume/resume-builder.tsx` - canonical import modal behavior for LinkedIn and PDF.
- `src/components/resume/generation-loading.tsx` - current blocking loading UX for generation.

### Derived rendering and readiness

- `src/lib/templates/cv-state-to-template-data.ts` - template mapping used for derived display data.
- `src/lib/profile/ats-enhancement.ts` - ATS readiness and blocking-item logic used by setup flow.
- `src/types/cv.ts` - canonical CV state shape.

### External reference asset

- `b_Wj12d9cRyft.zip` - approved visual reference direction for the new CRM-style profile layout shell.

</canonical_refs>

<specifics>
## Specific Ideas

- Add black circular edit icon buttons to summary, experience, skills, education, and certifications cards.
- Keep import, download, and `Melhorar currículo com IA` in the top-right action area.
- Structure the main page into left column (`summary`, `experience`) and right column (`skills`, `education`, `certifications`).
- On desktop, use `h-screen` plus `min-h-0` and internal scroll containers so long content stays contained without page overflow.
- On mobile/tablet, stack sections and allow normal page scrolling.

</specifics>

<deferred>
## Deferred Ideas

- Resume history redesign or new history routes.
- Replacing the current editing flow with a brand-new editor.
- Changing current API endpoints, credits semantics, or rewrite logic.

</deferred>

---

*Phase: 99-adaptar-a-ui-de-profile-do-curriculo-para-layout-crm-preservando-100-da-logica-e-funcionalidade-existente*
*Context gathered: 2026-04-24 via user PRD and repo inspection*
