# Technical Audit - LinkedIn Profile Feature

**Date:** 2026-04-07
**Status:** Complete, reconciled, and verified for the LinkedIn path

## Current Architecture

### Data Layer

- `UserProfile` is a user-scoped saved profile
- `Session.cvState` is still the runtime source of truth
- `UserProfile.source` may be `linkedin`, `pdf`, or `manual`

### Integration Layer

- `src/lib/linkedin/linkdapi.ts`
  - fetches and maps provider data
- `src/lib/linkedin/queue.ts`
  - runs async LinkedIn extraction
  - upserts `user_profiles`

### API Layer

- `POST /api/profile/extract`
  - validates LinkedIn URL
  - enqueues extraction
- `GET /api/profile/status/[jobId]`
  - reports queue state
- `GET /api/profile`
  - loads saved profile
- `PUT /api/profile`
  - saves reviewed profile data

### Front-End Layer

- `/dashboard/resumes/new`
  - canonical profile setup route
- `/profile`
  - compatibility redirect
- `user-data-page.tsx`
  - owns local draft state
- `resume-builder.tsx`
  - import modal and polling
- `visual-resume-editor.tsx`
  - structured editing UI

## Verified Behaviors

- existing saved profile bootstraps the editor
- empty users see a blank structured editor
- LinkedIn import refreshes the editor after job completion
- manual edits save through `PUT /api/profile`
- new sessions continue seeding from `UserProfile`
- agent prompt continues skipping upload when profile data is already loaded

## Invariants Preserved

- tools do not write to `UserProfile`
- profile saves do not create `cv_versions`
- billing and credit logic are unchanged
- users without saved profiles still get the empty-session flow

## Known Pending Area

- PDF upload for profile setup is still pending
