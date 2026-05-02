# Quick Task 260502-df8 Summary

## Completed

- Reenabled the profile header CTA on `/profile-setup`.
- Added a configurable CTA action to `UserDataPage` so the profile setup surface redirects to `/generate-resume` while existing inline tests/flows can still use the inline enhancement mode.
- Updated focused tests to verify the profile setup page shows the CTA and configures it to redirect.

## Validation

- `npm run typecheck`
- `npx vitest run 'src/app/(auth)/profile-setup/page.test.tsx' src/components/resume/user-data-page.test.tsx`
