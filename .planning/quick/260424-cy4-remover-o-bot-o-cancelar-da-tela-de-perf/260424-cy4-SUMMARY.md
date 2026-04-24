# Quick Summary

## Request

Remove the `Cancelar` button from the resume profile shell and delete the dead code tied to that action.

## Changes

- Removed the `Cancelar` button from the profile shell in `src/components/resume/user-data-page.tsx`.
- Simplified the secondary metadata row so it only renders the useful saved/download status information.
- Added a unit regression asserting the profile shell no longer exposes a `Cancelar` action.
- Updated the profile E2E spec to verify the button is absent instead of navigating through it.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium --workers=1 --reporter=line`
