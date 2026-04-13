# Quick Task Summary

## Task
Replace raw ATS validation toasts on `/dashboard/resumes/new` with a user-friendly modal that lists what the user still needs to fill before ATS enhancement can run.

## Changes
- Added shared ATS blocking-item detection in `src/lib/profile/ats-enhancement.ts`.
- Updated `src/app/api/profile/ats-enhancement/route.ts` to return `missingItems` alongside the existing incomplete-profile response.
- Updated `src/components/resume/user-data-page.tsx` so:
  - the ATS button stays clickable when the profile is incomplete
  - clicking it opens a friendly completion modal instead of surfacing a raw validation toast
  - deeper issues such as incomplete education or certification rows are listed clearly
- Expanded tests in:
  - `src/app/api/profile/ats-enhancement/route.test.ts`
  - `src/components/resume/user-data-page.test.tsx`
  - `tests/e2e/profile-setup.spec.ts`

## Verification
- `npx vitest run src/app/api/profile/ats-enhancement/route.test.ts src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium`
- `npx playwright test --project=chromium`

## Notes
- The Vitest run still emits the existing Radix dialog ref warning in `user-data-page.test.tsx`, but the suite passes.
