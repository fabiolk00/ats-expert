# LinkedIn Profile Feature - Data Flow Diagram

## Canonical User Flow

```text
/dashboard/resumes/new
  -> GET /api/profile
  -> load existing UserProfile or empty editor
  -> user imports from LinkedIn or edits manually
  -> PUT /api/profile
  -> user_profiles.cv_state updated
  -> future sessions seed from UserProfile
```

## LinkedIn Import Flow

```text
User clicks "Importar do LinkedIn"
  -> POST /api/profile/extract
  -> BullMQ job queued
  -> linkedinWorker calls LinkdAPI
  -> mapLinkdAPIToCvState()
  -> upsert into user_profiles
  -> UI polls GET /api/profile/status/[jobId]
  -> when status = completed, UI calls GET /api/profile
  -> editor hydrates with imported cvState
```

## Manual Save Flow

```text
User edits structured profile fields
  -> user-data-page keeps local draft state
  -> user clicks "Salvar"
  -> sanitize draft CVState
  -> PUT /api/profile
  -> upsert UserProfile
  -> redirect to /dashboard/resumes
```

## Session Seeding Flow

```text
User creates a new session
  -> src/lib/db/sessions.ts
  -> seedCvStateFromProfile(appUserId)
  -> fetch user_profiles.cv_state
  -> clone into session.cvState
  -> session starts with preloaded resume data
```

## Agent Prompt Flow

```text
Session has seeded cvState
  -> src/lib/agent/context-builder.ts
  -> buildPreloadedResumeContext(session)
  -> system prompt says "do not ask for resume upload"
  -> agent skips parse_file and starts working immediately
```

## Compatibility Routing

```text
/profile
  -> redirect
  -> /dashboard/resumes/new
```

## Pending Flow

```text
PDF upload
  -> not implemented yet
  -> UI remains visible but disabled
  -> reserved for future POST /api/profile/upload
```
