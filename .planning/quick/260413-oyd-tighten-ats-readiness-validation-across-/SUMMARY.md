Implemented stricter ATS readiness validation across the full base-profile flow.

What changed:
- Updated `src/lib/profile/ats-enhancement.ts` so ATS enhancement now requires the core base resume sections to be present before generation starts:
  - personal data
  - resumo profissional
  - experiencia
  - skills
  - educacao
- Kept `certificacoes` optional at the section level, while still validating any certification rows the user does add.
- Kept per-entry completeness checks for experience, education, and certification rows.
- Extended `buildResumeTextFromCvState(...)` to include certifications in the ATS source text.
- Added route coverage in `src/app/api/profile/ats-enhancement/route.test.ts` for missing required sections.
- Added UI coverage in `src/components/resume/user-data-page.test.tsx` for section-level ATS blockers and kept success-path/server-fallback coverage aligned with the stricter contract.
- Added Playwright coverage in `tests/e2e/profile-setup.spec.ts` for the exact summary-missing modal path.

Verification:
- `npx vitest run src/app/api/profile/ats-enhancement/route.test.ts`
- `npx vitest run src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium`

Notes:
- `user-data-page` tests still emit the existing Radix dialog ref warning, but the suite passes.
