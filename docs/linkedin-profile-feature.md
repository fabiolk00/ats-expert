# LinkedIn Profile Feature

## Overview

The LinkedIn Profile feature allows users to connect their LinkedIn profile once to pre-populate their resume data in every new session. Instead of uploading a resume file at the start of each session, users configure their profile once in the dashboard, and the system uses that saved profile to seed new sessions.

**Impact:**
- Eliminates 2–4 wasted turns per session
- Reduces OpenAI token cost per session
- Significantly improves first-use experience

## Architecture

### Data Model

A new `UserProfile` table stores canonical resume data at the user scope:

```sql
CREATE TABLE "user_profiles" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT UNIQUE NOT NULL,
  "cv_state" JSONB NOT NULL,          -- Canonical cvState
  "source" TEXT NOT NULL,              -- 'linkedin' | 'pdf'
  "linkedin_url" TEXT,                 -- LinkedIn URL (optional)
  "extracted_at" TIMESTAMP NOT NULL,   -- When profile was extracted
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP,
  
  CONSTRAINT fk_user_profiles_user_id
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE
);
```

### Data Flow

1. **User submits LinkedIn URL** via `POST /api/profile/extract`
2. **API validates URL** and enqueues a job in BullMQ
3. **Worker fetches profile** from LinkdAPI and maps to `cvState`
4. **Upserts `UserProfile`** in the database with canonical resume data
5. **Next session creation** checks `UserProfile` and seeds `cvState` if it exists
6. **Session is created** with pre-filled career data

### Invariants

- `UserProfile.cvState` is exactly the same structure as `Session.cvState`
- `UserProfile` is at the user scope; `Session.cvState` is still session-scoped
- Sessions can override/edit everything normally
- `UserProfile` is only the seed, not enforced by the system
- The LinkedIn URL is stored optionally; it's safe to delete after extraction

## Components

### 1. LinkdAPI Service (`src/lib/linkedin/linkdapi.ts`)

Handles communication with LinkdAPI (unofficial LinkedIn scraping service).

**Functions:**

- `fetchLinkedInProfile(linkedinUrl)` — Fetches profile data from LinkdAPI
- `mapLinkdAPIToCvState(data)` — Maps LinkdAPI response to `CVState` shape

**Key Details:**

- Validates LinkedIn URL format
- Handles LinkdAPI response structure
- Maps optional fields safely
- Converts description text to bullet points for experience

**Cost Reference:**

- LinkdAPI: $0.005–$0.008 per profile
- 100 profiles: ~$0.54–$0.83
- 1,000 profiles: ~$5.40–$8.33
- 10,000 profiles: ~$54.05

### 2. BullMQ Queue and Worker (`src/lib/linkedin/queue.ts`)

Manages async job processing with failure retry and rate limiting.

**Job Type:**

```typescript
interface LinkedInProfileJob {
  appUserId: string
  linkedinUrl: string
}
```

**Worker Behavior:**

- Processes 2 jobs concurrently (respects LinkdAPI rate limits)
- Limits to 10 jobs per minute (rate limiting)
- Retries up to 3 times with exponential backoff (3s, 6s, 12s)
- Removes completed jobs automatically
- Persists failed jobs for manual review

**Event Logging:**

- `completed`: Successful extraction and database save
- `failed`: Job exhausted all retries
- `error`: Worker process error

### 3. API Routes

#### `POST /api/profile/extract`

Submits a LinkedIn URL for profile extraction.

**Request:**

```json
{
  "linkedinUrl": "https://www.linkedin.com/in/username/"
}
```

**Response:**

```json
{
  "success": true,
  "jobId": "abc123",
  "position": 5,
  "message": "Profile extraction started"
}
```

**Validation:**

- Requires authentication
- Validates LinkedIn URL format (`linkedin.com/in/`)
- Returns `400` on invalid URL
- Returns `401` if not authenticated
- Returns `500` on queue failure

#### `GET /api/profile/status/[jobId]`

Polls the status of a profile extraction job.

**Response:**

```json
{
  "jobId": "abc123",
  "status": "active" | "completed" | "failed" | "delayed" | "waiting",
  "position": 5
}
```

**Behavior:**

- Verifies job ownership (checks `job.data.appUserId`)
- Returns `404` if job not found
- Returns `403` if user doesn't own the job
- Updates `position` while job is queued

#### `GET /api/profile`

Retrieves the authenticated user's saved profile.

**Response:**

```json
{
  "profile": {
    "id": "prof_123",
    "source": "linkedin",
    "cvState": { ... },
    "linkedinUrl": "https://...",
    "extractedAt": "2026-04-07T...",
    "createdAt": "2026-04-07T...",
    "updatedAt": "2026-04-07T..."
  }
}
```

If no profile exists:

```json
{
  "profile": null
}
```

### 4. Profile Setup Screen (`src/app/(auth)/profile/page.tsx`)

User-facing dashboard page for LinkedIn profile management.

**States:**

1. **Loading** — Fetches existing profile from server
2. **No Profile** — Shows LinkedIn URL input form
3. **Processing** — Shows job status and queue position (polls every 2 seconds)
4. **Profile Saved** — Shows summary of saved data with update button

**Client Component** (`profile-form.tsx`)

Handles:
- URL input and validation
- Job submission to queue
- Status polling with 2-second interval
- Profile reload on completion
- Error handling with toast notifications
- Summary display of extracted data

## Session Creation Flow

### Modified `createSession(appUserId)`

1. Calls `seedCvStateFromProfile(appUserId)`
2. Queries `user_profiles` table for existing profile
3. Returns seeded `cvState` if found, empty `cvState` otherwise
4. Creates session with seeded data
5. Creates first `cv_versions` snapshot if profile data was used

### Modified `createSessionWithCredit(appUserId)`

1. Calls `seedCvStateFromProfile(appUserId)` before RPC
2. Executes `consume_credit_and_create_session` RPC
3. If session has empty `cvState`, fetches profile and updates session
4. Returns session with seeded data

## Testing

### Unit Tests

**Key test scenarios:**

- `linkdapi.ts`:
  - Successful profile fetch and mapping
  - Invalid LinkedIn URL rejection
  - Missing required fields handling
  - Null/undefined field handling

- `queue.ts`:
  - Job enqueue and processing
  - Database upsert success/failure
  - Error logging

- `sessions.ts`:
  - `seedCvStateFromProfile()` returns saved profile
  - `seedCvStateFromProfile()` returns empty cvState if no profile
  - `createSession()` uses seeded cvState
  - `createSessionWithCredit()` uses seeded cvState

### Integration Tests

- User submits LinkedIn URL → Job is queued
- Job polling shows correct status
- Job completion triggers profile save
- New session creation pre-loads profile data
- User can override all fields in session

## Rollout Considerations

### Safety

- Feature is entirely opt-in (button in dashboard)
- No existing user behavior is modified
- Profile is only a seed; sessions remain fully editable
- Fallback to empty `cvState` if profile fetch fails

### Cost Management

- LinkdAPI quota is visible (100 free credits on signup)
- Cost per profile is fixed and predictable
- Consider caching or cleanup strategy for dormant users

### Monitoring

- Log extraction successes/failures by appUserId
- Monitor job queue size and processing time
- Track LinkdAPI API errors and rate limits
- Alert on worker errors

## Future Enhancements

1. **PDF Upload Fallback** — Let users upload PDF instead of LinkedIn URL
   - Reuse existing `parse_file` tool logic
   - Store source as `'pdf'` in `UserProfile.source`

2. **Profile Update History** — Track extracted versions over time
   - Add `extraction_count` field
   - Store `extraction_log` with timestamps

3. **Manual Profile Editing** — Allow users to edit saved profile in dashboard
   - Add `PUT /api/profile` endpoint
   - Validate cvState shape before save

4. **Partial Extraction** — Let users review and confirm data before save
   - Add intermediate "Review" state in job flow
   - Show diff of extracted vs existing profile

5. **LinkedIn Data Refresh** — Periodic re-extraction for active users
   - Add background job to refresh profiles monthly
   - Show "Last updated" timestamp

## References

- LinkdAPI: https://linkdapi.com (unofficial LinkedIn API, gray legal area)
- BullMQ: https://docs.bullmq.io (Redis-backed job queue)
- Upstash Redis: https://upstash.com (serverless Redis)

## Troubleshooting

### Common Issues

**Profile extraction fails with "Invalid LinkedIn URL"**
- Ensure URL is in format: `https://www.linkedin.com/in/username/`
- Check for trailing slashes or parameters

**Job stuck in "waiting" state**
- Check worker is running
- Verify Redis connection (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- Check worker error logs

**New session not using saved profile**
- Verify profile exists: `GET /api/profile`
- Check `cv_state` field is not empty
- Verify `user_id` matches authenticated user

**LinkdAPI errors**
- Check `LINKDAPI_API_KEY` environment variable
- Verify LinkedIn URL is public (not private profile)
- Check API quota (100 free credits)
- Wait for rate limit window (max 10 jobs/minute)
