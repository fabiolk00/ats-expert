# LinkedIn Profile Feature - Implementation Summary

**Status:** Complete for LinkedIn import, manual review/save, and session seeding
**Date:** 2026-04-07

## What Is Implemented

- `UserProfile` database model and migration
- LinkedIn extraction service via LinkdAPI
- BullMQ queue and worker
- `POST /api/profile/extract`
- `GET /api/profile/status/[jobId]`
- `GET /api/profile`
- `PUT /api/profile`
- canonical profile setup UI at `/dashboard/resumes/new`
- compatibility redirect from `/profile`
- session seeding from `UserProfile.cvState`
- agent prompt support for preloaded profile data

## Canonical Front-End Flow

Primary route:

- `src/app/(auth)/dashboard/resumes/new/page.tsx`

Shared UI:

- `src/components/resume/user-data-page.tsx`
- `src/components/resume/resume-builder.tsx`
- `src/components/resume/visual-resume-editor.tsx`

Behavior:

- loads existing profile from `GET /api/profile`
- imports LinkedIn data through the queue flow
- hydrates the editor after import completes
- keeps local unsaved edits in the page state
- saves reviewed data with `PUT /api/profile`
- redirects back to `/dashboard/resumes` after save

## API Notes

Current supported routes:

- `POST /api/profile/extract`
- `GET /api/profile/status/[jobId]`
- `GET /api/profile`
- `PUT /api/profile`

Pending route:

- `POST /api/profile/upload`

## Invariants Preserved

- session `cvState` remains the runtime source of truth
- `UserProfile` remains seed-only state
- tools do not write to `UserProfile`
- profile saves do not create `cv_versions`
- billing behavior is unchanged

## Verification

- `npm run typecheck` passes
- targeted eslint on the changed profile UI and API files passes

## Pending Follow-Up

- PDF upload for profile setup
- any richer diff/review UX before persisting imported data
