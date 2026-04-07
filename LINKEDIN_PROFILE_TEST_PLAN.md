---
title: LinkedIn Profile Feature - Test Plan & Troubleshooting
date: 2026-04-07
status: Testing in Progress
---

# LinkedIn Profile Feature - Comprehensive Test Plan

## Test Scenario: Fábio Kröker's Profile

**Test User LinkedIn URL:** `https://www.linkedin.com/in/fabio-kroker/`  
**Expected Profile Data:**
- Name: Fábio Kröker
- Followers: 868
- Connections: 868
- Full career history + education + skills

---

## Pre-Test Checklist

### ✅ Environment Variables Required

```bash
# LinkdAPI Integration
LINKDAPI_API_KEY=<your-key>

# Redis/BullMQ for Job Queue
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=<token>

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=<key>
```

**Check Status:**
```bash
grep -E "LINKDAPI_API_KEY|UPSTASH_REDIS|SUPABASE" .env
```

### ✅ Database Migration Applied

Migration file: `prisma/migrations/20260407_add_user_profile.sql`

**Check Status:**
```bash
npm run db:studio  # Verify user_profiles table exists
```

**Expected Table Structure:**
```sql
user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  cv_state JSONB NOT NULL,
  source TEXT,
  linkedin_url TEXT,
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### ✅ Build Status

```bash
npm run typecheck  # Should PASS ✓
npm run lint       # Should PASS ✓
```

**Current Status:** ✓ PASS (just verified)

---

## End-to-End Test Flow

### Phase 1: Profile Setup (UI → API → Job Queue → Database)

#### Step 1: Navigate to Profile Page
- **URL:** `http://localhost:3000/dashboard/profile` or `/profile`
- **Expected:** Profile setup page with LinkedIn URL input form
- **Potential Issues:**
  - [ ] Page redirects instead of showing form (FIXED: Updated page.tsx)
  - [ ] 401 Unauthorized (check Clerk auth)
  - [ ] Styling issues (missing components)

#### Step 2: Submit LinkedIn URL
- **Action:** Enter `https://www.linkedin.com/in/fabio-kroker/` and click "Conectar LinkedIn"
- **Expected Response:**
  ```json
  {
    "success": true,
    "jobId": "string",
    "position": number,
    "message": "Profile extraction started"
  }
  ```
- **Potential Issues:**
  - [ ] 400 Bad Request — invalid URL format (verify URL format matches linkedin.com/in/)
  - [ ] 401 Unauthorized — auth failed (check app user resolution)
  - [ ] 500 Internal Error — queue failed (check Redis connection)

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/profile/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{"linkedinUrl":"https://www.linkedin.com/in/fabio-kroker/"}'
```

#### Step 3: Poll Job Status
- **URL:** `GET /api/profile/status/{jobId}`
- **Expected Statuses (in order):**
  1. `waiting` — Job queued, waiting for worker
  2. `active` — Worker processing
  3. `completed` — Profile extracted successfully
  4. `failed` — Error during extraction (retries 3x before failing)

- **Polling Interval:** Frontend polls every 2 seconds
- **Timeout:** 60 seconds (if not completed by then, job likely failed)

**Test Command:**
```bash
curl http://localhost:3000/api/profile/status/{jobId} \
  -H "Authorization: Bearer <clerk-token>"
```

**Potential Issues:**
- [ ] 404 Not Found — job ID invalid (check job was created)
- [ ] 403 Forbidden — user doesn't own job (check job.data.appUserId matches)
- [ ] Stuck on `active` — worker crashed (check BullMQ event handlers)
- [ ] `failed` status — LinkdAPI returned error (check console logs)

#### Step 4: Verify Profile Saved to Database
- **Query:** `SELECT * FROM user_profiles WHERE user_id = '<app-user-id>'`
- **Expected Columns:**
  - `cv_state`: JSONB with fullName, email, experience[], education[], skills[], etc.
  - `source`: 'linkedin'
  - `linkedin_url`: 'https://www.linkedin.com/in/fabio-kroker/'
  - `extracted_at`: ISO timestamp of extraction

**Potential Issues:**
- [ ] Row not found (job failed silently, check queue error handlers)
- [ ] cv_state empty (LinkdAPI returned incomplete data)
- [ ] cv_state malformed (mapping error in mapLinkdAPIToCvState)

---

### Phase 2: Retrieve Profile (API → Database)

#### Step 5: Retrieve Saved Profile
- **URL:** `GET /api/profile`
- **Expected Response:**
  ```json
  {
    "profile": {
      "id": "prof_...",
      "source": "linkedin",
      "cvState": {
        "fullName": "Fábio Kröker",
        "email": "...",
        "phone": "...",
        "linkedin": "...",
        "location": "...",
        "summary": "...",
        "experience": [...],
        "education": [...],
        "skills": [...],
        "certifications": [...]
      },
      "linkedinUrl": "https://www.linkedin.com/in/fabio-kroker/",
      "extractedAt": "2026-04-07T...",
      "createdAt": "2026-04-07T...",
      "updatedAt": "2026-04-07T..."
    }
  }
  ```

**Test Command:**
```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer <clerk-token>"
```

**Potential Issues:**
- [ ] 401 Unauthorized (auth failed)
- [ ] 500 Internal Error (database query failed)
- [ ] profile: null (no profile found for user)
- [ ] cvState missing fields (extraction incomplete)

---

### Phase 3: Session Seeding (New Session Creation)

#### Step 6: Create New Session
- **URL:** `POST /api/agent`
- **Request:**
  ```json
  {
    "message": "Analise meu currículo para a vaga de Senior Developer"
  }
  ```
- **Expected:**
  - New session created with cvState populated from UserProfile
  - Agent receives context about pre-loaded resume
  - First message processes without asking for resume upload

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{"message":"Analise meu currículo"}' \
  -N  # stream mode
```

**Potential Issues:**
- [ ] Session created but cvState is empty (seeding failed)
- [ ] Agent asks for resume upload (context not injected)
- [ ] 402 Insufficient Credits (credit consumption failed)
- [ ] SSE streaming not working (check stream setup)

#### Step 7: Verify Agent Context Enhancement
- **Check:** Agent prompt includes "Resume Context" section
- **Expected Text:** "The user's resume is already loaded from their saved profile..."
- **Location:** `src/lib/agent/context-builder.ts` line 251

**Potential Issues:**
- [ ] Context not in prompt (buildPreloadedResumeContext not called)
- [ ] Context present but agent still asks for resume (logic error)
- [ ] Agent errors when parsing cvState (type mismatch)

---

## Common Issues & Troubleshooting

### Issue 1: LinkdAPI Returns 400 Error
**Symptom:** Job fails immediately with "Invalid username"  
**Root Causes:**
- LinkedIn URL has special characters (e.g., á, ö)
- URL format doesn't match expected pattern
- LinkdAPI rate limit exceeded

**Solutions:**
- Use simplified ASCII URL: `https://www.linkedin.com/in/fabio-kroker/`
- Check LINKDAPI_API_KEY is set and valid
- Wait 60 seconds and retry

### Issue 2: Job Stuck on "active"
**Symptom:** Status polling returns "active" forever  
**Root Causes:**
- BullMQ worker crashed
- Redis connection lost
- Worker processing never completes

**Solutions:**
- Check console for worker errors
- Verify Redis is accessible: `UPSTASH_REDIS_REST_URL` reachable
- Check BullMQ event handlers in queue.ts

### Issue 3: Profile Not Saved to Database
**Symptom:** Job status shows "completed" but no row in user_profiles  
**Root Causes:**
- Upsert failed due to database constraint
- JSONB validation error
- RPC error not logged

**Solutions:**
- Check database logs for constraint violations
- Verify cvState is valid JSONB (test with `pg_typeof()`)
- Check mapLinkdAPIToCvState output in queue.ts

### Issue 4: Session Seeding Not Working
**Symptom:** New session has empty cvState despite saved profile  
**Root Causes:**
- seedCvStateFromProfile query failed
- Seeding logic has condition errors
- Database query returns null

**Solutions:**
- Check seedCvStateFromProfile in sessions.ts lines 211-228
- Verify query finds correct user_id
- Test manually: `SELECT cv_state FROM user_profiles WHERE user_id = '...'`

### Issue 5: Agent Doesn't Skip parse_file
**Symptom:** Agent asks for resume upload despite profile loaded  
**Root Causes:**
- buildPreloadedResumeContext conditions not met
- cvState.fullName or email is empty string
- sourceResumeText already set (from previous upload)

**Solutions:**
- Check context-builder.ts lines 25-46
- Verify cvState is populated: `console.log(session.cvState)`
- Clear sourceResumeText if set: `agentState.sourceResumeText = undefined`

---

## Verification Checklist

### Pre-Test
- [ ] Environment variables configured (LINKDAPI_API_KEY, UPSTASH_REDIS_*, SUPABASE_*)
- [ ] Database migration applied (user_profiles table exists)
- [ ] Build passes (npm run typecheck && npm run lint)
- [ ] Page redirect fixed (page.tsx updated to show ProfileForm)

### During Test
- [ ] Profile page loads at /profile
- [ ] LinkedIn URL submission returns jobId
- [ ] Job status polling shows progression (waiting → active → completed)
- [ ] Profile data appears in database with correct cvState
- [ ] GET /api/profile returns saved profile
- [ ] New session creation seeds cvState

### Post-Test
- [ ] Verify cvState has all expected fields (fullName, email, experience[], etc.)
- [ ] Verify agent receives context in first message
- [ ] Verify agent skips parse_file when profile exists
- [ ] Check logs for any warnings/errors

---

## Performance Expectations

| Operation | Expected Time | Tolerance |
|-----------|---------------|-----------|
| URL submission → API response | <100ms | <500ms |
| Job queue processing | 2-10 seconds | <30 seconds |
| Profile database write | <500ms | <2 seconds |
| Session seeding | <500ms | <2 seconds |
| GET /api/profile | <100ms | <500ms |

---

## Test Results Template

```
Test Date: 2026-04-07
Tester: 
Test Environment: local | staging | production

Phase 1: Profile Setup
  ✓ / ✗ Navigation to profile page
  ✓ / ✗ LinkedIn URL submission
  ✓ / ✗ Job status polling
  ✓ / ✗ Database write
  Issues: [list any]

Phase 2: Profile Retrieval
  ✓ / ✗ GET /api/profile
  ✓ / ✗ Profile data integrity
  Issues: [list any]

Phase 3: Session Seeding
  ✓ / ✗ New session creation
  ✓ / ✗ CVState populated
  ✓ / ✗ Agent context injected
  Issues: [list any]

Overall Status: PASS / FAIL
Notes: [additional observations]
```

---

## Next Steps After Testing

1. If all tests pass:
   - Document user flow in knowledge base
   - Train support team on feature
   - Monitor production metrics
   - Plan Phase 2 improvements (edit UI, PDF upload path)

2. If issues found:
   - Log bugs with reproduction steps
   - Fix and re-test
   - Update documentation
   - Create regression test cases

---

**Test Plan Created:** 2026-04-07  
**Status:** Ready for execution with Fábio Kröker's profile
