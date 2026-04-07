# Files Index - LinkedIn Profile Feature

## Database

- `prisma/schema.prisma`
  - `UserProfile` model
  - `source` may be `linkedin`, `pdf`, or `manual`
- `prisma/migrations/20260407_add_user_profile.sql`
  - creates `user_profiles`

## Backend Services

- `src/lib/linkedin/linkdapi.ts`
  - fetches LinkedIn profile data
  - maps provider data to `CVState`
- `src/lib/linkedin/queue.ts`
  - BullMQ queue and worker
  - upserts `UserProfile`

## API

- `src/app/api/profile/extract/route.ts`
  - `POST /api/profile/extract`
- `src/app/api/profile/status/[jobId]/route.ts`
  - `GET /api/profile/status/[jobId]`
- `src/app/api/profile/route.ts`
  - `GET /api/profile`
  - `PUT /api/profile`

## Canonical UI

- `src/app/(auth)/dashboard/resumes/new/page.tsx`
  - canonical route for profile setup
- `src/components/resume/user-data-page.tsx`
  - page-level state, bootstrap, save flow
- `src/components/resume/resume-builder.tsx`
  - LinkedIn import modal
- `src/components/resume/visual-resume-editor.tsx`
  - controlled structured editor

## Compatibility

- `src/app/(auth)/profile/page.tsx`
  - redirect to `/dashboard/resumes/new`
- `src/app/(auth)/profile/profile-form.tsx`
  - legacy implementation, no longer the primary route

## Session And Agent Integration

- `src/lib/db/sessions.ts`
  - seeds new sessions from `UserProfile`
- `src/lib/agent/context-builder.ts`
  - skips resume upload flow when session data is preloaded

## Core Docs

- `docs/linkedin-profile-feature.md`
- `IMPLEMENTATION_SUMMARY.md`
- `FINAL_SUMMARY.md`
- `DATA_FLOW_DIAGRAM.md`
