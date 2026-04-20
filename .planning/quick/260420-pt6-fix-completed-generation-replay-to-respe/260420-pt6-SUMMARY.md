## Summary

Fixed the completed-generation replay bypass in the billable export flow so replay now resolves viewer preview access before any signed URL is created.

## Delivered

- Replaced the ungated replay branch in `generate-billable-resume.ts` with a viewer-aware `buildReplayResultForViewer(...)` flow.
- Replay now prefers persisted `generatedOutput.previewAccess` from the session or target, which preserves the “upgrade requires regeneration” rule for previously locked artifacts.
- Added `assertNoRealArtifactForLockedPreview(...)` in `src/lib/generated-preview/locked-preview.ts` and applied it to replay and fresh success responses.
- Locked replay now returns `success: true` with `creditsUsed: 0`, but no real `pdfUrl` or `docxUrl`.
- Paid replay still returns a real signed artifact URL and avoids re-reserving credits.

## Verification

- `npx vitest run src/lib/resume-generation/generate-billable-resume.test.ts src/app/api/file/[sessionId]/route.test.ts`
- `npm run typecheck`
