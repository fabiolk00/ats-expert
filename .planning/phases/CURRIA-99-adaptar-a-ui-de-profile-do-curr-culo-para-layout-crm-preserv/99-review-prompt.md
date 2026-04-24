# Cross-AI Plan Review Request

You are reviewing implementation plans for a software project phase.
Provide structured feedback on plan quality, completeness, and risks.

## Project Context
# CurrIA

## What This Is

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. It ships the core funnel for profile seeding, conversational analysis, deterministic ATS enhancement, deterministic target-job rewriting, artifact generation, and paid usage. The current brownfield baseline now includes milestone-audit-compatible verification artifacts, durable archive metadata checks, and stronger freeform vacancy targeting before the next runtime refactor lands.

## Core Value

A job seeker can reliably turn their real profile and a target role into an honest, ATS-ready resume output they can confidently download and use.

## Current State

**Latest shipped version:** `v1.5 Verification Closure and Runtime Residuals` shipped on 2026-04-16.

**What is now true:**
- live `/api/agent` traffic exposes provenance and follows a documented parity contract
- resume-only flows run a deterministic ATS-enhancement pipeline
- resume-plus-job flows run a deterministic target-job rewrite pipeline
- `/dashboard/resume/new` branches by context instead of forcing ATS only
- OpenAI and PDF ingestion paths have stronger resilience and clearer failure modes
- security, billing, file-access, and JSON persistence boundaries are more explicit and test-backed
- the main agent route now exposes first-response timing evidence, earlier existing-session progress, reduced ATS chat blocking, deterministic continuation fast paths, and phase-specific runtime budgets
- milestone audit can now consume committed `VERIFICATION.md` artifacts instead of relying on summary-only inference
- milestone closeout metadata, decimal-phase archive counts, and next-cycle planning resets now have repo-native proof
- freeform vacancy targeting now derives usable context from arbitrary pasted job text with stronger rewrite grounding

## Current Milestone

Current milestone: `v1.6 Async Agent Orchestration and Background Job Runtime` started on 2026-04-16.

**Goal:** Make `/api/agent` a lightweight orchestrator and move ATS enhancement, target-job rewriting, and artifact generation behind durable async execution without changing the current UX, billing rules, or rewrite semantics.

**Target features:**
- freeze shared async execution contracts for actions, jobs, status lifecycle, and resume source-of-truth rules before implementation diverges
- keep lightweight chat synchronous while `/api/agent` classifies actions and dispatches heavy work to async jobs
- move ATS enhancement, target-job rewriting, and artifact generation out of the synchronous request path with persisted job state, stage progress, and retry-safe failure handling
- keep `cvState`, `optimizedCvState`, previews, and generated artifacts consistent and traceable to the exact snapshot used

## Next Milestone Goals

- prove the async execution model under realistic concurrent load once the new job runtime is in place
- decide later whether richer cancellation, retry controls, or UI progress affordances are worth productizing after the core background-job contract is stable
- continue prioritizing reliability, billing safety, observability, and verification over unrelated feature breadth

## Requirements

### Validated

- [x] User can authenticate, reach the workspace, and resume intended flows after login or signup.
- [x] User can seed a canonical profile from LinkedIn or manual editing and reuse it in new sessions.
- [x] User can run conversational resume analysis and section rewriting against persisted session state.
- [x] User can create job-targeted resume variants without overwriting the base resume.
- [x] User can generate DOCX and PDF resume artifacts from current resume state.
- [x] Paid usage can be enforced through credit-backed session creation and Asaas billing flows.
- [x] Paid users can track job applications inside the dashboard.
- [x] Phase 1: Runtime, CI, and operator docs share the same provider contract and fail fast on missing critical configuration.
- [x] Phase 2: Browser verification covers auth, manual profile setup, session creation, target outcome, preview readiness, artifact delivery, and CI gating for the core funnel.
- [x] Phase 3: Billing settlement, replay safety, and dashboard credit totals are validated end to end with live evidence.
- [x] Phase 4: Production debugging is fast enough to diagnose agent, billing, session, file, webhook, and profile import failures, and the core funnel now surfaces safer actionable error states.
- [x] Phase 5: `/api/agent` now exposes release provenance, a safe parity CLI and runbook exist, and automated coverage protects the runtime evidence contract.
- [x] Phase 6: Dialog follow-ups now preserve rewrite intent, degraded recovery avoids stale vacancy-bootstrap repetition, and `dialog` plus `confirm` share one explicit model-routing contract.
- [x] Phase 7: The visible chat transcript now stays coherent through recovery paths, route-to-UI and Chromium transcript regressions are committed, and operators can replay the representative incident with provenance-aware evidence.
- [x] Phase 8: Resume-only sessions now run deterministic ATS enhancement with persisted optimized snapshots and export-aware versioning.
- [x] Phase 9: ATS enhancement now has section-aware retries, stronger validation, and structured observability.
- [x] Phase 10: Resume-plus-job sessions now run deterministic target-job rewriting with targeting plans, factual validation, and target-linked persistence.
- [x] Phase 11: `/dashboard/resume/new` now chooses ATS enhancement or target-job adaptation by context through one smart generation entrypoint.
- [x] Phase 12: OpenAI and PDF import paths now fail more safely through circuit-breaker protections and async PDF processing.
- [x] Phase 13: LGPD handling, secret boundaries, and the E2E auth bypass now have stronger contracts and verification.
- [x] Phase 14: TypeScript-aware quality gates and test visibility are documented and enforced at a useful baseline.
- [x] Phase 15: Session persistence is split across narrower internal modules instead of one large orchestration file.
- [x] Phase 16: Middleware, webhook, and file-access security boundaries now have committed fail-closed proof.
- [x] Phase 17: Billing settlement, replay, and webhook invariants now have focused regression proof.
- [x] Phase 18: File-access ownership and storage or RLS boundary claims are now explicitly separated and documented.
- [x] Phase 19: High-value JSON persistence seams now have an explicit contract matrix and narrower typed repository boundaries.
- [x] Phase 20: The repo exposes a safe dead-code detection toolchain for imports, exports, orphan files, and dependencies.
- [x] Phase 21: Unused imports and low-risk unused locals can be removed automatically or near-automatically in agreed scopes.
- [x] Phase 22: Unused exports, orphan files, and packages can be inventoried and reduced with manual verification for dynamic runtime seams.
- [x] Phase 23: Sustained code-hygiene enforcement is documented and wired into lint, TypeScript, editor, or CI flows only after the repo is clean enough to support it.
- [x] Phase 24: The repo can measure request-stage latency for user-visible agent flows, including first SSE emission and first useful assistant response timing.
- [x] Phase 25: Chat interactions respond faster in practice through reduced blocking work before visible output.

## Phase 99: Adaptar a UI de profile do currículo para layout CRM preservando 100% da lógica e funcionalidade existente
### Roadmap Section
### Phase 99: Adaptar a UI de profile do currículo para layout CRM preservando 100% da lógica e funcionalidade existente

**Goal:** Adapt the resume profile page into the approved clean CRM-style layout while preserving the exact existing profile, import, edit, save, enhancement, validation, download, routing, and toast behavior already implemented in `src/components/resume/user-data-page.tsx`.
**Requirements**: [RESUME-PROFILE-CRM-01, RESUME-PROFILE-EDIT-01, RESUME-PROFILE-TEST-01]
**Depends on:** Phase 98
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 99 to break down)

### Requirements Addressed
- RESUME-PROFILE-CRM-01`n- RESUME-PROFILE-EDIT-01`n- RESUME-PROFILE-TEST-01

### User Decisions (CONTEXT.md)
# Phase 99: Adaptar a UI de profile do currÃ­culo para layout CRM preservando 100% da lÃ³gica e funcionalidade existente - Context

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
- Keep import, download, and `Melhorar currÃ­culo com IA` in the top-right action area.
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


### Research Findings
# Phase 99 Research

## Standard Stack

- Keep `src/components/resume/user-data-page.tsx` as the orchestration owner for page state, fetch calls, toasts, dialogs, and routing.
- Reuse the existing React/Next client-side patterns already present in the file: local `useState`, derived `useMemo`, inline async handlers, and existing shadcn UI primitives.
- Reuse `VisualResumeEditor` for all manual profile editing instead of building a second form system.
- Reuse `ImportResumeModal`, `GenerationLoading`, `Dialog`, and `Textarea` exactly where the current flows depend on them.
- Use existing derived data helpers (`sanitizeResumeData`, `normalizeResumeData`, `cvStateToTemplateData`, `assessAtsEnhancementReadiness`, `getAtsEnhancementBlockingItems`) rather than introducing alternate formatting or validation logic.

## Architecture Patterns

### 1. Presentation-shell replacement, not behavior rewrite

The safest implementation is to replace only the page JSX shell in `user-data-page.tsx` while preserving the current state and handlers:

- keep `loadProfile`, `persistProfile`, `handleSave`, `handleImportSuccess`, `handleSetupGeneration`
- keep `targetJobDescription`, `generationMode`, `rewriteValidationFailure`, `atsMissingItems`, `activeImportSource`, and loading flags
- keep `ImportResumeModal`, both validation dialogs, and `GenerationLoading`

### 2. Two-view model inside the same page component

The current file already has one clear base-profile mode plus one enhancement side panel. The safest CRM conversion is:

- primary `profile` view: compact header + read-oriented CRM cards
- secondary `enhancement` view: an enhancement workspace that still uses the existing generation state and handlers

This preserves the current routing, loading overlay, and generation semantics while allowing the page to match the approved CRM-like layout.

### 3. Reuse the existing editor as the real edit surface

Do not replace `VisualResumeEditor`. Instead:

- keep it mounted in a dedicated editing surface (inline workspace, modal, or sheet)
- add a small, explicit control seam so section edit buttons can reveal/focus the real editor section
- preserve section expand/collapse semantics owned by `VisualResumeEditor`

The least risky seam is to add small optional props to `VisualResumeEditor` so the page can request a section to open/focus without rewriting internal section state.

### 4. Read-only section cards render from existing derived state

For the CRM-style cards:

- render contact/header data from the existing normalized `resumeData` / `template`
- render section content from the real live page state, not mock data
- keep empty states explicit and honest
- use internal scroll containers for long section content on desktop

### 5. Keep generation logic centralized in the page

The current generation setup logic is already correct and should stay page-owned:

- button copy remains derived from `generationMode`
- ATS uses `/api/profile/ats-enhancement`
- targeting uses `/api/profile/smart-generation`
- both continue persisting the current profile first
- dialogs, toasts, and compare-page redirect remain unchanged

## Don't Hand-Roll

- Do not build a new profile-edit form or local-only section editor.
- Do not clone `VisualResumeEditor` into a second component.
- Do not introduce new API routes or alternate persistence contracts for profile save/load.
- Do not create fake download behavior or mock sample resume sections.
- Do not weaken ATS readiness or rewrite validation gates to simplify the new layout.

## Common Pitfalls

### Pitfall 1: Replacing the editor with display-only cards

If the CRM cards become the only surface, manual editing, section-open behavior, import-progress affordances, and existing save flow regress.

Avoid by keeping `VisualResumeEditor` as the real edit surface and wiring card edit buttons into it.

### Pitfall 2: Recomputing data differently for cards versus editor

If cards use mock or separately normalized state, the visible profile diverges from what is actually saved/generated.

Avoid by rendering cards directly from `resumeData`, `sanitizeResumeData`, and `cvStateToTemplateData`.

### Pitfall 3: Losing validation and loading semantics during enhancement-mode cleanup

The current page has several gates and dialogs:

- missing ATS requirements modal
- structured rewrite validation modal
- loading overlay
- credits disable state

Avoid by moving the existing generation UI rather than rewriting the flow.

### Pitfall 4: Breaking long-content containment

The approved layout requires internal scroll, but the current cards/sidebar shell does not match that structure.

Avoid by making section cards `flex min-h-0 flex-col overflow-hidden` and section content `min-h-0 flex-1 overflow-y-auto`, while keeping mobile stacked and naturally scrollable.

### Pitfall 5: Assuming a download seam that does not exist on this page today

`user-data-page.tsx` currently has no direct PDF download flow, no session id, and no artifact metadata source equivalent to comparison/preview surfaces.

Avoid by explicitly verifying whether a real download source is available in page context before adding a button. Do not ship a decorative or fake `Download PDF` action.

## Code Examples

### Safe section edit pattern

Use a page-owned edit request that reveals the real editor:

```tsx
type EditableResumeSection = "summary" | "experience" | "skills" | "education" | "certifications"

const [editorSectionRequest, setEditorSectionRequest] = useState<EditableResumeSection | null>(null)

function handleEditSection(section: EditableResumeSection) {
  setIsEditingProfile(true)
  setEditorSectionRequest(section)
}
```

Then teach `VisualResumeEditor` to honor that request by opening the matching section and focusing its first field.

### Safe CRM card rendering

Compute display data from the existing canonical flow:

```tsx
const sanitizedResumeData = useMemo(() => sanitizeResumeData(resumeData), [resumeData])
const template = useMemo(() => cvStateToTemplateData(sanitizedResumeData), [sanitizedResumeData])
```

Render cards from `template` / `sanitizedResumeData`, not from examples.

### Safe enhancement-mode preservation

Keep generation behavior intact:

```tsx
<Button
  type="button"
  disabled={setupGenerationButtonDisabled}
  onClick={() => void handleSetupGeneration()}
>
  {isRunningAtsEnhancement ? generationCopy.buttonRunning : generationCopy.buttonIdle}
</Button>
```

Only the surrounding shell should change.

## Test Guidance

- Update `src/components/resume/user-data-page.test.tsx` to assert the CRM shell without deleting behavior tests.
- Add focused tests for:
  - section edit buttons existing
  - edit button opening/revealing the real editor behavior
  - enhancement mode toggling from the new header CTA
  - long experience section being internally scrollable
  - empty certifications still rendering title and edit affordance
- Keep current fetch/route/toast assertions for profile load, save, ATS, job targeting, and dialogs.

## Recommended Implementation Order

1. Refactor `user-data-page.tsx` into explicit `profile` and `enhancement` views while keeping the current handlers intact.
2. Add a small control seam to `VisualResumeEditor` so external edit buttons can reveal/focus real sections.
3. Replace the current sidebar/KPI shell with CRM header + section cards rendered from canonical state.
4. Reposition the existing editor into the new shell.
5. Update unit tests for preserved behavior and new edit affordances.
6. Only wire a `Download PDF` button if a real page-local artifact source is confirmed; otherwise do not fake the action.


### Plans to Review
---
phase: 99-adaptar-a-ui-de-profile-do-curr-culo-para-layout-crm-preserv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/resume/user-data-page.tsx
  - src/components/resume/visual-resume-editor.tsx
  - src/components/resume/user-data-page.test.tsx
  - tests/e2e/profile-setup.spec.ts
autonomous: true
requirements:
  - RESUME-PROFILE-CRM-01
  - RESUME-PROFILE-EDIT-01
  - RESUME-PROFILE-TEST-01
must_haves:
  truths:
    - "The CRM-style profile page is only a presentation-shell adaptation; the existing profile fetch/save/import/generation/dialog/toast flows remain owned by `src/components/resume/user-data-page.tsx`."
    - "All section edit buttons trigger the real existing editor behavior via `VisualResumeEditor`; no disconnected second form is introduced."
    - "Long real data stays accessible through scroll-safe section cards on desktop while mobile keeps natural page scrolling."
    - "Any PDF download affordance must use a real existing artifact/download seam; the implementation must not invent a fake endpoint or decorative action."
  artifacts:
    - path: "src/components/resume/user-data-page.tsx"
      provides: "CRM shell, enhancement-mode switch, real section card actions, latest-session download seam, and existing page orchestration."
    - path: "src/components/resume/visual-resume-editor.tsx"
      provides: "Existing manual editor with a small external control seam so the page can open/focus real sections."
    - path: "src/components/resume/user-data-page.test.tsx"
      provides: "Focused regression proof for preserved behavior plus new CRM affordances."
  key_links:
    - from: "src/components/resume/user-data-page.tsx"
      to: "src/components/resume/visual-resume-editor.tsx"
      via: "external section-open/focus request"
      pattern: "handleEditSection"
    - from: "src/components/resume/user-data-page.tsx"
      to: "src/lib/dashboard/workspace-client.ts"
      via: "existing `/api/file/[sessionId]` download seam for the latest generated session"
      pattern: "getDownloadUrls"
---

<objective>
Adapt the resume profile page to the approved CRM-style layout while preserving the exact existing page behavior for profile load/save, LinkedIn and PDF import, manual editing, ATS enhancement, target-job setup, validation dialogs, routing, and toasts.

Purpose: replace the current sidebar/KPI setup shell with a compact read-oriented profile page and a clean enhancement workspace, without rewriting business logic or weakening current tests and safeguards.
Output: CRM-style `user-data-page`, externally focusable `VisualResumeEditor`, real section edit buttons, honest PDF-download affordance through an existing artifact seam, and regression coverage for preserved behavior.
</objective>

<execution_context>
@C:/CurrIA/.codex/get-shit-done/workflows/execute-plan.md
@C:/CurrIA/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/CURRIA-99-adaptar-a-ui-de-profile-do-curr-culo-para-layout-crm-preserv/99-CONTEXT.md
@.planning/phases/CURRIA-99-adaptar-a-ui-de-profile-do-curr-culo-para-layout-crm-preserv/99-RESEARCH.md
@.planning/phases/CURRIA-99-adaptar-a-ui-de-profile-do-curr-culo-para-layout-crm-preserv/99-PRD.md
@src/components/resume/user-data-page.tsx
@src/components/resume/user-data-page.test.tsx
@src/components/resume/visual-resume-editor.tsx
@src/components/resume/resume-builder.tsx
@src/components/resume/generation-loading.tsx
@src/lib/dashboard/workspace-client.ts
@src/types/dashboard.ts
@tests/e2e/profile-setup.spec.ts

<interfaces>
From `src/lib/dashboard/workspace-client.ts`:
```ts
export async function getDownloadUrls(
  sessionId: string,
  targetId?: string,
): Promise<DownloadUrlsResponse>
```

From `src/types/dashboard.ts`:
```ts
export type DownloadUrlsResponse = {
  pdfUrl: string | null
  pdfFileName?: string | null
  available: boolean
  generationStatus: ArtifactStatusSummary['generationStatus']
  errorMessage?: string
  artifactStale?: ArtifactStatusSummary['artifactStale']
  previewLock?: PreviewLockSummary
}
```

From `src/components/resume/visual-resume-editor.tsx`:
```ts
type SectionId =
  | "personal"
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "certifications"
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add a real external-control seam to the existing editor and preserve edit ownership</name>
  <files>src/components/resume/visual-resume-editor.tsx, src/components/resume/user-data-page.tsx, src/components/resume/user-data-page.test.tsx</files>
  <behavior>
    - Test 1: each CRM section card exposes an edit button with an accessible label for summary, experience, skills, education, and certifications.
    - Test 2: clicking a section edit button reveals the real `VisualResumeEditor` surface and requests the matching section instead of a disconnected local form.
    - Test 3: existing save behavior still persists sanitized profile data through the current `handleSave` / `persistProfile` path.
  </behavior>
  <action>Extend `VisualResumeEditor` with a minimal optional control seam that lets `user-data-page.tsx` request a real section to open/focus while preserving the component's current state ownership, import progress behavior, and section-collapse semantics. Refactor `user-data-page.tsx` so the new CRM cards drive that seam through a `handleEditSection(...)` action and an explicit editor surface state, but keep all existing data/state handlers in the page. Do not create a new editor form.</action>
  <verify>
    <automated>npx vitest run "src/components/resume/user-data-page.test.tsx"</automated>
  </verify>
  <done>The page has real section edit affordances wired into the existing editor, and save behavior is still owned by the current page logic.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Replace the current shell with the CRM profile layout while preserving generation, import, dialogs, and real download semantics</name>
  <files>src/components/resume/user-data-page.tsx, src/components/resume/user-data-page.test.tsx</files>
  <behavior>
    - Test 1: the page renders the compact CRM-style header and two-column section layout from the existing live profile data instead of sample placeholders.
    - Test 2: clicking the import CTA still opens the current import modal, and clicking `Melhorar currÃ­culo com IA` opens the enhancement workspace while preserving ATS and target-job behavior.
    - Test 3: long experience content lives inside an internal scroll container, and empty certifications still render a section header plus edit action.
    - Test 4: if a real generated session is known, the `Download PDF` action uses the existing `/api/file/[sessionId]` seam; if no real artifact context exists, the action remains honestly unavailable instead of fake.
  </behavior>
  <action>Rewrite the page JSX into explicit `profile` and `enhancement` views that reuse the current state and handlers. The profile view should follow the approved CRM shell: white background, compact header, no KPI cards, no preview sidebar, left column for summary/experience, right column for skills/education/certifications, and black rounded edit buttons. Keep `ImportResumeModal`, dialogs, and `GenerationLoading` intact. For download, reuse `getDownloadUrls(...)` plus the latest real generated session id remembered from the current generation success path; do not create a new backend route or fake download action.</action>
  <verify>
    <automated>npx vitest run "src/components/resume/user-data-page.test.tsx"</automated>
  </verify>
  <done>The page matches the new CRM-style layout, all current import/generation/dialog flows still work, and download uses only a real existing artifact seam.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Lock preserved behavior with focused regression coverage</name>
  <files>src/components/resume/user-data-page.test.tsx, tests/e2e/profile-setup.spec.ts</files>
  <behavior>
    - Test 1: unit coverage proves profile load/render, import modal access, section edit buttons, enhancement mode toggle, ATS/job-targeting requests, missing-requirements dialog, and rewrite-validation dialog still work.
    - Test 2: unit coverage proves long-content overflow behavior and empty certifications rendering in the new CRM shell.
    - Test 3: browser coverage still proves manual save, import modal access, import from PDF/LinkedIn, and enhancement start from the setup page without reintroducing the old layout.
  </behavior>
  <action>Update the existing unit and E2E tests to assert preserved behavior through the new CRM shell rather than via brittle structure assumptions from the old layout. Add focused assertions for real edit affordances and honest download availability, but do not introduce snapshot-only tests.</action>
  <verify>
    <automated>npx vitest run "src/components/resume/user-data-page.test.tsx"</automated>
    <automated>npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium</automated>
  </verify>
  <done>The phase is regression-proofed around the exact behaviors this UI adaptation must preserve.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| page shell -> existing live handlers | A visual refactor can silently detach buttons from the real save/import/generation flows. |
| section cards -> editor surface | New edit affordances can drift into local-only UI if they do not control the real editor. |
| profile page -> file download seam | The page currently lacks artifact context, so a new download button can become fake unless it uses a real existing session/file contract. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-99-01 | T | `user-data-page.tsx` actions | mitigate | Keep existing page handlers as the only mutation/generation source of truth and wire new buttons into those handlers. |
| T-99-02 | T | `VisualResumeEditor` integration | mitigate | Add only a minimal external section-open/focus seam; do not fork editor logic or duplicate state. |
| T-99-03 | D | long-content CRM cards | mitigate | Use internal scroll containers with `min-h-0`/`overflow-y-auto` on desktop and stacked natural scroll on mobile. |
| T-99-04 | S | `Download PDF` CTA | mitigate | Reuse `getDownloadUrls(...)` with a real generated `sessionId`; if unavailable, surface honest unavailability rather than a fake download. |
</threat_model>

<verification>
- `npm run typecheck`
- `npx vitest run "src/components/resume/user-data-page.test.tsx"`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium`
</verification>

<success_criteria>
- The resume profile page visually matches the approved CRM-style shell without reintroducing the old sidebar/KPI layout.
- All previous live actions on the page still work through the current real handlers and endpoints.
- All CRM section cards expose real black edit affordances that reveal/focus the existing editor behavior.
- Long data is scroll-safe, empty states are honest, and no fake download behavior or hardcoded sample profile data is introduced.
</success_criteria>

<output>
After completion, create `.planning/phases/CURRIA-99-adaptar-a-ui-de-profile-do-curr-culo-para-layout-crm-preserv/99-01-SUMMARY.md`.
</output>


## Review Instructions

Analyze the plan and provide:

1. Summary — one-paragraph assessment
2. Strengths — bullet points
3. Concerns — bullet points with severity HIGH/MEDIUM/LOW
4. Suggestions — specific improvements
5. Risk Assessment — overall risk level with justification

Focus on:
- missing edge cases or error handling
- dependency ordering issues
- scope creep or under-specification
- how well the plan preserves existing product behavior
- whether the plan avoids fake download behavior and disconnected edit flows
- whether the tests are sufficient for regression protection

Output in markdown.
