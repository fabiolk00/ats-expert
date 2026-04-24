# Quick Summary

## Request

Keep the desktop sidebar permanently collapsed, remove the open/close affordance, add a new `Currículos` item before `Nova conversa`, and align the collapsed hover treatment so the profile layout gains more horizontal space.

## Changes

- Removed desktop sidebar expand/collapse behavior and fixed the desktop shell width to the collapsed rail.
- Preserved the mobile sidebar behavior with the existing sheet, logo, and close action.
- Added a real `Currículos` navigation item pointing to `/dashboard` with the collapsed tooltip/hover pattern.
- Updated `Nova conversa` to use the same collapsed icon-button treatment and kept its real routing plus `NEW_CONVERSATION_EVENT` dispatch.
- Added a focused regression test covering the permanent collapsed state and the new `Currículos` ordering.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/components/dashboard/sidebar.test.tsx`
