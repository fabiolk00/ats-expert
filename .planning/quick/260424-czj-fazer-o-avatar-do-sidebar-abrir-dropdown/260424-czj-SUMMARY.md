# Quick Summary

## Request

Make the collapsed sidebar avatar open the existing account dropdown only on click, without hover-opening behavior.

## Changes

- Removed the hover-open logic from the collapsed sidebar avatar in `src/components/dashboard/sidebar.tsx`.
- Kept the existing dropdown and trigger, now relying on the normal click interaction only.
- Updated the sidebar regression test to verify click-to-open instead of hover-to-open.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/components/dashboard/sidebar.test.tsx`
