---
phase: 02-core-funnel-browser-verification
plan: "02"
subsystem: core-funnel-browser-specs
tags: [playwright, e2e, dashboard, profile, artifacts]
requires: [02-01]
provides:
  - Stable browser-facing state hooks for profile save, workspace state, preview, and documents
  - Chromium coverage for manual profile setup and the end-to-end dashboard funnel
affects: [phase-2-plan-03, ci, local-browser-tests]
tech-stack:
  added:
    - "No new packages"
  patterns:
    - Stable `data-testid` and `data-*` state hooks for browser assertions
    - Same-origin mocked asset delivery for preview and download validation
    - Session-sync event to keep sidebar document state aligned with optimistic session changes
key-files:
  created:
    - tests/e2e/profile-setup.spec.ts
    - tests/e2e/core-funnel.spec.ts
    - src/components/dashboard/events.ts
  modified:
    - tests/e2e/fixtures/api-mocks.ts
    - src/components/resume/user-data-page.tsx
    - src/components/dashboard/resume-workspace.tsx
    - src/components/dashboard/chat-interface.tsx
    - src/components/dashboard/session-documents-panel.tsx
    - src/components/dashboard/preview-panel.tsx
    - src/components/dashboard/sidebar.tsx
    - src/components/dashboard/resume-workspace.test.tsx
    - src/components/dashboard/chat-interface.test.tsx
    - src/components/dashboard/preview-panel.test.tsx
key-decisions:
  - "Expose browser assertions through live component state hooks instead of brittle copy matching."
  - "Keep artifact delivery provider-free by serving same-origin test assets from Playwright routes."
  - "Fix sidebar document state with an explicit session-sync event instead of weakening the dashboard artifact assertions."
patterns-established:
  - "Profile setup specs assert the actual `PUT /api/profile` payload shape before accepting the redirect."
  - "Core funnel specs prove session creation, target outcome, preview readiness, and a real Chromium download event."
requirements-completed: [QA-01, QA-02]
duration: 54 min
completed: 2026-04-10
---

# Phase 2 Plan 2: Core Funnel Specs Summary

**The launch-critical browser journeys are now committed, deterministic, and asserted through stable UI state instead of timing guesses.**

## Performance

- **Duration:** 54 min
- **Started:** 2026-04-10T04:53:00Z
- **Completed:** 2026-04-10T05:47:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added stable `data-testid` and `data-*` hooks to the manual profile, chat, workspace, documents, and preview surfaces.
- Extended the shared Playwright mocks to cover profile writes plus same-origin PDF and DOCX asset delivery.
- Added a browser spec for guest redirect, authenticated manual profile setup, canonical `cvState` save, and the redirect back to `/dashboard`.
- Added a browser spec for first-turn session creation, streamed agent completion, target outcome visibility, preview readiness, and a successful artifact download in Chromium.
- Fixed a real UI coordination issue by syncing sidebar document state with workspace session changes during optimistic URL updates.

## Files Created/Modified

- `tests/e2e/profile-setup.spec.ts` - Covers guest redirect, manual profile setup, payload capture, and the post-save redirect.
- `tests/e2e/core-funnel.spec.ts` - Covers the dashboard funnel from first agent turn through preview and download.
- `tests/e2e/fixtures/api-mocks.ts` - Added profile-save capture and same-origin test assets for preview and downloads.
- `src/components/resume/user-data-page.tsx` - Added a stable save selector and page loading hook.
- `src/components/dashboard/resume-workspace.tsx` - Exposes session, target-count, busy, and base-output-ready state for browser assertions.
- `src/components/dashboard/chat-interface.tsx` - Exposes session, phase, message-count, input, and send control hooks.
- `src/components/dashboard/session-documents-panel.tsx` - Exposes ready-state and download item hooks while listening for session-sync changes.
- `src/components/dashboard/preview-panel.tsx` - Exposes preview readiness, frame, and toolbar controls.
- `src/components/dashboard/events.ts` and `src/components/dashboard/sidebar.tsx` - Added the shared session-sync event used to keep sidebar document state aligned with new sessions.
- `src/components/dashboard/*.test.tsx` - Added explicit assertions for the new browser-facing hooks.

## Decisions Made

- Treat the missing document panel during the first browser pass as a real coordination bug, not a flaky test.
- Keep browser assertions anchored to state emitted by the live UI rather than copy that may change during polish work.
- Use same-origin file mocks so preview and browser download behavior stay deterministic in local runs and CI.

## Deviations from Plan

- `src/components/dashboard/events.ts` and `src/components/dashboard/sidebar.tsx` were added to repair the session propagation bug uncovered by the new funnel coverage. This expanded the touch set slightly, but it directly supported the artifact-delivery goal of the plan.

## Issues Encountered

- `SessionDocumentsPanel` originally depended only on `useSearchParams()`, which did not react to the workspace's optimistic `history.replaceState()` path during the funnel flow.
- The first browser run passed workspace assertions but failed artifact-panel assertions, which exposed the real state-sync bug above.

## Verification

- `npm run typecheck`
- `npm test -- src/components/dashboard/resume-workspace.test.tsx src/components/dashboard/chat-interface.test.tsx src/components/dashboard/preview-panel.test.tsx`
- `npm run test:e2e -- tests/e2e/profile-setup.spec.ts tests/e2e/core-funnel.spec.ts --project=chromium`

## User Setup Required

None. The specs run through the committed E2E auth seam and shared mocked-provider helpers.

## Next Phase Readiness

- Ready for `02-03`, which promotes the committed browser lane into CI and contributor docs.
- The phase now has reliable browser signals for auth, profile save, session creation, target state, preview state, and artifact delivery.

---
*Phase: 02-core-funnel-browser-verification*
*Completed: 2026-04-10*
