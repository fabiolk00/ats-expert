## Summary

Implemented server-side preview locking for free-trial generated resumes so the real optimized or target CV never reaches the client after the single free credit is spent.

## Decisions

- Persist a durable `generatedOutput.previewAccess` marker on outputs generated while the user is on the `free` plan.
- Never trust CSS blur alone. Replace real optimized/target CV content with a synthetic demo CV on protected read paths.
- Never expose the real signed PDF URL for locked outputs. Serve an internal fake PDF route instead.
- Require paid users to regenerate after upgrade. Historical free-generated outputs remain locked.

## Delivered

- Added locked preview helpers and fake PDF generation in `src/lib/generated-preview/locked-preview.ts`.
- Marked free-plan generations as locked in `src/lib/resume-generation/generate-billable-resume.ts`.
- Sanitized session/comparison/target/profile smart-generation responses before they reach the client.
- Blocked manual editing of locked optimized and target resumes.
- Updated preview and comparison UI to show blocked overlays and hide edit/download actions.
- Added focused tests for locked preview download routing, comparison sanitization, manual-edit blocking, smart-generation sanitization, and blocked UI states.

## Verification

- `npx vitest run src/components/dashboard/preview-panel.test.tsx src/components/resume/resume-comparison-view.test.tsx src/app/api/file/[sessionId]/route.test.ts src/app/api/session/[id]/comparison/route.test.ts src/app/api/session/[id]/manual-edit/route.test.ts src/app/api/profile/smart-generation/route.test.ts`
- `npm run typecheck`

## Notes

- `.planning/debug/` remains untouched and uncommitted.
