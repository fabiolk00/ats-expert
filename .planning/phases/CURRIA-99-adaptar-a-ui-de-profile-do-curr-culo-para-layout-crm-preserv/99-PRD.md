# Phase 99 PRD

## Task

Adapt Resume Profile UI While Preserving 100% of Previous Layout Logic and Functionality.

You are working on CurrIA, a Next.js 14 / React / TypeScript resume optimization platform.

This task is ONLY about the user resume profile page.

The goal is to adapt the current/new visual profile layout while preserving 100% fidelity to the previous layout behavior and functionality.

Do not work on resume history.
Do not create a new history screen.
Do not redesign product flows.
Do not rewrite business logic.

Reference asset:
- Root zip file: `b_Wj12d9cRyft.zip`

Do not remove existing behavior.

## Critical Requirement

The new resume profile page must remain functionally equivalent to the previous implementation.

Before changing code, inspect the old/current implementation carefully, especially:

- `src/components/resume/user-data-page.tsx`

Pay attention to existing state, handlers, components, flows, and UI behavior such as:

- profile loading
- profile saving
- LinkedIn import
- PDF import
- manual editing
- `VisualResumeEditor` behavior
- section editing behavior
- section collapse/expand behavior
- preview collapse behavior, if still present
- ATS enhancement flow
- target-job enhancement flow
- missing ATS requirements dialog
- rewrite validation dialog
- credit validation
- download PDF behavior
- routing after generation
- toast behavior
- loading states
- disabled states
- current data normalization/sanitization
- existing test expectations

The new UI must not break any of these.

## Scope

This task should only adapt the resume profile view to the new clean CRM-like layout.

Keep the new visual direction:

- white background
- rounded section cards
- subtle borders
- compact CRM-like profile header
- black primary buttons
- two-column layout
- no KPI cards
- no sidebar
- no global dashboard header inside this component

But preserve all previous functionality.

## Previous Functionality Must Remain 100% Available

The user must still be able to do everything they could do before.

At minimum:

### Import and Edit

- Import from LinkedIn
- Import from PDF
- Open existing import modal
- Edit profile data using the existing editor/form
- Save profile
- Preserve existing `resumeData` update behavior
- Preserve existing normalization behavior
- Preserve existing `sanitizeResumeData` behavior

### Profile

- Load existing profile from `/api/profile`
- Save profile to `/api/profile`
- Render profile photo/avatar if available
- Render profile source badge/label if still part of UX
- Render last updated information if still part of UX

### Generation

- Open enhancement mode from `Melhorar currículo com IA`
- Improve resume for ATS
- Adapt resume for target job
- Preserve `targetJobDescription`
- Preserve `generationMode`
- Preserve `handleSetupGeneration`
- Preserve existing endpoints:
  - ATS enhancement endpoint
  - smart-generation / job-targeting endpoint
- Preserve credit checks
- Preserve loading button states
- Preserve success/error toasts
- Preserve routing to compare page after successful generation

### Dialogs and Validation

- Missing ATS requirements dialog must still appear
- Rewrite validation failure dialog must still appear
- Existing validation messages must not be removed
- Existing validation logic must not be weakened
- Do not replace real flows with fake UI

Very important:

- Do not add decorative buttons that do nothing.
- Any new edit icon must trigger the existing edit behavior.
- If the old layout had an editor, drawer, modal, form, or section focus behavior, reuse it.
- Do not build a second editor from scratch.
- Do not create fake edit actions.
- Do not remove existing editor components unless their behavior is fully preserved elsewhere.

The new layout should be a presentation shell around existing behavior.

## Required Visual Additions

Add black edit icon buttons with white icons to each resume section card:

- Professional Summary
- Experience
- Skills
- Education
- Certifications

Button style:

- black background
- white edit icon
- small rounded/circular button
- subtle hover

Use a lucide icon:

- `PenLine`
- `Pencil`
- `Edit3`

Behavior:

- Implement section edit behavior by reusing the previous layout functionality.
- Recommended editable sections:
  - `summary`
  - `experience`
  - `skills`
  - `education`
  - `certifications`
- `handleEditSection(section)` must reuse the old edit behavior.

Valid outcomes:

- open the existing `VisualResumeEditor`
- switch back into the previous edit/form mode
- scroll and focus the existing editor section
- expand the relevant old section if the previous layout used collapsible sections

Invalid outcomes:

- `console.log(section)`
- opening an empty modal
- button with no click handler
- disconnected form
- editing local-only data not saved by the old flow

## Preserve Old Components Where Needed

If the old implementation used components such as:

- `VisualResumeEditor`
- `ImportResumeModal`
- `GenerationLoading`
- `Dialog`
- `Textarea`

Do not remove them unless truly unused.

Prefer wrapping/repositioning old components instead of rewriting them.

## Scroll Behavior

The visual layout should support real data.

Each resume section should be internally scrollable when content is long.

Required layout principles:

- page shell: `h-screen overflow-hidden` on desktop
- main content: `min-h-0`
- columns: `min-h-0`
- section cards: `flex min-h-0 flex-col overflow-hidden`
- section content: `min-h-0 flex-1 overflow-y-auto`

On mobile/tablet:

- allow normal vertical page scrolling
- stack sections
- keep edit buttons visible

Do not hardcode content heights based only on the sample profile.
Do not truncate real data permanently.
Do not render only a fixed number of experiences, skills, education records, or certifications unless there is an explicit show-more behavior.

## Data Fidelity

Do not hardcode sample data.

Everything must be rendered from the same data sources as before:

- `resumeData`
- `template`
- `cvState`
- existing profile response
- existing normalized profile data

Do not replace real profile data with static examples.
Empty fields should show proper empty states, not fake content.

## Required Layout

Keep the profile layout close to the approved clean CRM-style design:

Top profile header:

- name and current role
- location, email, phone, LinkedIn, GitHub

Right-side actions:

- `Importar / LinkedIn / PDF`
- `Download PDF`
- `Melhorar currículo com IA`

Main layout:

- Left column:
  - Professional Summary
  - Experience
- Right column:
  - Skills
  - Education
  - Certifications

Keep the page clean and compact.
Do not bring back KPI cards.
Do not bring back the old sidebar/preview panel unless the previous functionality explicitly depends on it. If the preview panel was part of the old layout, preserve its underlying behavior in a way that does not break existing tests or flows.

## Header Buttons Fidelity

### Import button

- Must open the existing import flow/modal.
- If old behavior allowed both LinkedIn and PDF, keep both.

### Download PDF

- Must use the existing PDF download/generation behavior.
- Do not create a fake download button.

### Melhorar currículo com IA

- Must open the existing enhancement mode.
- Do not change the existing enhancement mode behavior.

## Testing Requirements

Before finishing, verify that all old behavior still works.
Add or update focused tests where needed.

At minimum, tests should verify:

- profile loads and renders from existing profile data
- import button still opens import flow
- save/edit behavior still works
- each section edit button exists
- clicking section edit button triggers real edit mode/focus behavior
- `Melhorar currículo com IA` still opens enhancement mode
- ATS enhancement still calls existing flow
- target-job mode still uses the existing textarea and generation handler
- missing requirements dialog still opens when profile is incomplete
- rewrite validation dialog still renders when API returns validation issues
- long experience content is contained inside a scrollable section
- empty certifications still render section header and edit button

Do not use fragile visual snapshot tests.

## Regression Checklist

Before submitting, manually check:

- no `any` added
- no new route created
- no history page created
- no API contract changed
- no billing/credits logic changed
- no ATS rewrite logic changed
- no target-job rewrite logic changed
- no persistence logic changed
- no profile save/load logic changed
- no import behavior removed
- no dialogs removed
- no toasts removed
- no hardcoded resume data
- no decorative-only edit buttons
- no page-level desktop overflow caused by long content

## Acceptance Criteria

This task is complete only when:

- the new profile layout visually matches the approved clean CRM-style design
- the implementation remains 100% faithful to the previous layout functionality
- all old user actions still work
- all old validation/error/loading flows still work
- all section cards have working black edit icon buttons
- each section safely handles long real data through internal scroll
- no hardcoded sample profile data remains
- the enhancement mode still works exactly as before
- the import/save/download flows still work exactly as before
- TypeScript, lint, and tests pass
