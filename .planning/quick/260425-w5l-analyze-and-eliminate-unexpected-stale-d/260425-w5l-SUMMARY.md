# Quick Task 260425-w5l Summary

## Root Cause

- The profile download shortcut stored `last-profile-generation-session-id` in one global browser key.
- In a shared browser or after account switching, the authenticated profile page could read a session id created under a different user context.
- That stale id then hit `/api/file/:sessionId`, which correctly emitted `DOWNLOAD_SESSION_STALE_REFERENCE` and the warning we observed.

## Delivered

- Scoped the storage key by `appUserId` in the profile setup flow.
- Passed `appUserId` from the server-rendered profile page into `UserDataPage`.
- Added regression coverage proving the authenticated page ignores the legacy global key and writes the new scoped key.

## Verification

- `npm test -- src/components/resume/user-data-page.test.tsx`
- `npm run typecheck`
