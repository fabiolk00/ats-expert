# Quick Summary

## Request

Add hover-open behavior to the collapsed sidebar avatar so it exposes the existing account dropdown, verify the sidebar buttons keep the same hover language, and re-tune the profile shell so the extra width from the collapsed rail improves fidelity to the ZIP layout.

## Changes

- Made the collapsed desktop avatar use the same hover treatment as the other sidebar controls.
- Wired the existing account dropdown to open on avatar hover in collapsed desktop mode while preserving normal dropdown behavior.
- Added a focused sidebar regression test that covers the avatar hover dropdown and the standardized collapsed hover classes.
- Tightened the profile shell header in `user-data-page.tsx` by moving the low-priority metadata row below the main header actions, which brings the top section closer to the ZIP proportions without removing source, updated-at, download status, or cancel behavior.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/components/dashboard/sidebar.test.tsx src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium --workers=1 --reporter=line`
