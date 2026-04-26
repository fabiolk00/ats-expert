# Quick Task 260425-w1z Summary

## Delivered

- Added the missing `job-targeting` member to the canonical `CVVersionSource` Prisma enum mapping.
- Added an idempotent SQL migration to extend `public.cv_version_source` with `job-targeting`.
- Added a regression test proving `createCvVersion(...)` persists the dedicated `job-targeting` source.

## Verification

- `npm test -- src/lib/db/cv-versions.test.ts src/app/api/profile/smart-generation/route.test.ts src/lib/agent/tools/pipeline.test.ts`
- `npm run typecheck`
