Relaxed ATS readiness so certifications are optional.

What changed:
- Updated `src/lib/profile/ats-enhancement.ts` to stop requiring at least one certification before ATS enhancement.
- Kept certification entry validation in place when the user does add certification rows, so partial entries still surface in the friendly modal.
- Updated route, component, and Playwright tests to reflect the optional-certification rule.

Verification:
- `npx vitest run src/app/api/profile/ats-enhancement/route.test.ts`
- `npx vitest run src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium`

Notes:
- `user-data-page` tests still emit the existing Radix dialog ref warning, but the suite passes.
