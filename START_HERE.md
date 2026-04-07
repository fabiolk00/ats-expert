# START HERE - LinkedIn Profile Feature Review Guide

This repo now uses a reconciled profile flow.

## First Read

1. `FINAL_SUMMARY.md`
2. `IMPLEMENTATION_SUMMARY.md`
3. `docs/linkedin-profile-feature.md`
4. `FILES_INDEX.md`
5. `DATA_FLOW_DIAGRAM.md`

## Canonical Route

- `/dashboard/resumes/new` is the primary profile setup screen
- `/profile` redirects there for compatibility

## What To Review In Code

### Backend

- `src/lib/linkedin/linkdapi.ts`
- `src/lib/linkedin/queue.ts`
- `src/lib/db/sessions.ts`
- `src/lib/agent/context-builder.ts`

### API

- `src/app/api/profile/extract/route.ts`
- `src/app/api/profile/status/[jobId]/route.ts`
- `src/app/api/profile/route.ts`

### Frontend

- `src/app/(auth)/dashboard/resumes/new/page.tsx`
- `src/components/resume/user-data-page.tsx`
- `src/components/resume/resume-builder.tsx`
- `src/components/resume/visual-resume-editor.tsx`

## Important Current Truths

- `PUT /api/profile` is implemented
- LinkedIn import is implemented
- PDF upload is still pending
- `UserProfile` is seed-only state
- session `cvState` remains the runtime source of truth

## Quick Verification

- run `npm run typecheck`
- run `npm run lint` or targeted eslint
- open `/dashboard/resumes/new`
- import from LinkedIn
- edit fields
- save profile
- create a new session and confirm seeding
