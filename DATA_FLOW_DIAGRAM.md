# LinkedIn Profile Feature - Data Flow Diagram

## Complete System Flow

### 1. USER SUBMITS LINKEDIN URL

```
┌─────────────────────────────────────────────────────────────────┐
│ User Opens: /(auth)/profile/page.tsx                            │
│ Sees: ProfileForm Client Component                              │
│ Actions: Enters LinkedIn URL and clicks "Conectar LinkedIn"     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ ProfileForm Component                                            │
│ handleSubmit() called                                           │
│ - Validates URL locally                                        │
│ - Calls POST /api/profile/extract                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ API Route: src/app/api/profile/extract/route.ts               │
│ - Authenticates user (getCurrentAppUser)                       │
│ - Validates request body with Zod                             │
│ - Adds job to BullMQ queue                                    │
│ Returns: { jobId, position, success }                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2. LINKEDIN EXTRACTION JOB PROCESSING

```
┌─────────────────────────────────────────────────────────────────┐
│ BullMQ Queue: linkedin-profile-extract                          │
│ Job Status: waiting → active (when worker picks it up)          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Upstash Redis (BullMQ backed)                                   │
│ - Stores job metadata                                          │
│ - Tracks job state                                            │
│ - Rate limiting applied (10 jobs/min)                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ linkedinWorker (src/lib/linkedin/queue.ts)                     │
│ Concurrency: 2 simultaneous jobs                              │
│                                                                 │
│ Process:                                                       │
│ 1. Receive job: { appUserId, linkedinUrl }                   │
│ 2. Call fetchLinkedInProfile(linkedinUrl)                     │
│ 3. Extract username from URL                                  │
│ 4. Call LinkdAPI: GET /api/v1/profile/full                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ LinkdAPI (Official Provider)                                    │
│ URL: https://linkdapi.com/api/v1/profile/full                │
│ Response:                                                       │
│ {                                                              │
│   success: true,                                              │
│   data: {                                                     │
│     fullName: "...",                                         │
│     email: "...",                                            │
│     phone: "...",                                            │
│     profileUrl: "...",                                       │
│     location: { full: "..." },                               │
│     summary: "...",                                          │
│     experience: [...],                                       │
│     education: [...],                                        │
│     skills: [...],                                           │
│     certifications: [...]                                    │
│   }                                                           │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ mapLinkdAPIToCvState() (src/lib/linkedin/linkdapi.ts)         │
│                                                                 │
│ Transformations:                                               │
│ - Filter incomplete entries                                   │
│ - Map to CVState shape:                                       │
│   * experience.description → bullets (split by \n)           │
│   * Map education to institution + degree + year             │
│   * Filter and deduplicate skills                            │
│   * Extract certifications                                   │
│   * Handle optional fields gracefully                        │
│                                                                 │
│ Returns: CVState object                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3. DATABASE PERSISTENCE

```
┌─────────────────────────────────────────────────────────────────┐
│ linkedinWorker continues...                                      │
│                                                                 │
│ Upsert to Database:                                            │
│ supabase.from('user_profiles').upsert({                       │
│   user_id: appUserId,              // Unique constraint       │
│   cv_state: mappedCvState,         // JSONB column           │
│   source: 'linkedin',               // Track source          │
│   linkedin_url: linkedinUrl,        // Store URL             │
│   extracted_at: now(),              // Timestamp             │
│ }, { onConflict: 'user_id' })      // Replace on conflict    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ PostgreSQL: user_profiles Table                                │
│                                                                 │
│ id          │ user_id   │ cv_state │ source   │ extracted_at  │
│ ─────────────────────────────────────────────────────────────── │
│ prof_123    │ usr_456   │ {...}    │ linkedin │ 2026-04-07... │
│                                                                 │
│ Indexes:                                                       │
│ - PK on id                                                    │
│ - UNIQUE on user_id (one profile per user)                   │
│ - INDEX on user_id (fast lookups)                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Job Completion                                                   │
│ - Worker logs success                                         │
│ - Emits 'completed' event                                     │
│ - Removes job from queue (removeOnComplete: true)             │
└─────────────────────────────────────────────────────────────────┘
```

### 4. FRONTEND JOB POLLING

```
┌─────────────────────────────────────────────────────────────────┐
│ ProfileForm: jobStatus Polling Loop                            │
│ setInterval(..., 2000) // Every 2 seconds                     │
│                                                                 │
│ Polls: GET /api/profile/status/:jobId                        │
│ Receives: { jobId, status }                                   │
│ Status values:                                                │
│ - 'waiting'   → Queue position not yet reached               │
│ - 'active'    → Currently processing                         │
│ - 'completed' → Successfully extracted                       │
│ - 'failed'    → Error during extraction                      │
│ - 'delayed'   → Delayed (for retries)                        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    [status === 'completed']
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ On Completion:                                                  │
│ 1. Clear polling interval                                      │
│ 2. Show success toast: "Perfil extraído com sucesso"          │
│ 3. Call GET /api/profile                                      │
│ 4. Update state: setProfile(response.profile)                │
│ 5. Render profile summary                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5. NEW SESSION CREATION WITH SEEDING

```
┌─────────────────────────────────────────────────────────────────┐
│ User Creates New Session                                        │
│ POST /api/agent → createSessionWithCredit(appUserId)          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ src/lib/db/sessions.ts: createSessionWithCredit()             │
│                                                                 │
│ Process:                                                       │
│ 1. Call RPC: consume_credit_and_create_session                │
│    (Creates empty session atomically)                         │
│                                                                 │
│ 2. If session created successfully:                           │
│    mapSessionRow(rpcData)                                     │
│                                                                 │
│ 3. Check if cvState is empty:                                 │
│    - fullName === '' AND email === ''                        │
│                                                                 │
│ 4. If empty, call seedCvStateFromProfile()                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ seedCvStateFromProfile(appUserId)                              │
│                                                                 │
│ Query:                                                         │
│ supabase.from('user_profiles')                               │
│   .select('cv_state')                                        │
│   .eq('user_id', appUserId)                                  │
│   .single()                                                  │
│                                                                 │
│ Returns:                                                       │
│ - Found: Clone and return stored cvState                     │
│ - Not Found: Return empty cvState                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Update Session with Seeded cvState                             │
│ await updateSession(session.id, { cvState: profileCvState })  │
│                                                                 │
│ Database Update:                                              │
│ UPDATE sessions                                               │
│ SET cv_state = {...}, updated_at = now()                    │
│ WHERE id = :sessionId                                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Return Populated Session to Client                             │
│ Session now has:                                              │
│ - cvState: pre-populated from UserProfile                    │
│ - agentState: empty (no parse_file called)                   │
│ - Ready for agent to start                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6. AGENT INITIALIZATION WITH PRELOADED CONTEXT

```
┌─────────────────────────────────────────────────────────────────┐
│ src/lib/agent/context-builder.ts: buildSystemPrompt()         │
│                                                                 │
│ Check conditions for preloaded context:                       │
│ - cvState.fullName && cvState.email (has data)               │
│ - !agentState.sourceResumeText (not from file upload)       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    [Conditions met]
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Inject Resume Context Section                                   │
│                                                                 │
│ "## Resume Context                                            │
│  The user's resume is already loaded from their saved          │
│  profile. You have their full career history, education,       │
│  skills, and summary available in the current session state.   │
│                                                                 │
│  Do not ask the user to upload a resume. Do not call          │
│  parse_file. The ingestion phase is complete.                 │
│                                                                 │
│  When the user provides a job description, immediately        │
│  assess fit based on the loaded cvState, identify gaps, and   │
│  suggest targeted improvements. Start doing useful work on     │
│  the first turn."                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ System Prompt Construction Order:                              │
│ 1. ROLE_PREAMBLE                                              │
│ 2. PHASE_INSTRUCTIONS[session.phase]                          │
│ 3. buildPreloadedResumeContext() ← Injected here             │
│ 4. Canonical resume state (cvState JSON)                     │
│ 5. Extracted resume text (if any)                            │
│ 6. Target job description (if any)                           │
│ 7. ATS score context                                         │
│ 8. Gap analysis context                                      │
│ 9. Target fit assessment                                     │
│ 10. STATIC_SUFFIX (tools rules, security rules)             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Agent Receives System Prompt                                    │
│ OpenAI API call with:                                         │
│ - system: Full prompt with injected context                   │
│ - messages: User's first message                             │
│ - tools: rewrite_section, score_ats, analyze_gap, etc.      │
│                                                                 │
│ Agent skips asking for resume upload                          │
│ Agent starts working on user's stated goal immediately        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### UserProfile Table Schema
```typescript
interface UserProfile {
  id: string              // @id @default(cuid())
  userId: string          // @unique, Maps to "user_id" in DB
  cvState: Json           // Full CVState object as JSONB
  source: string          // 'linkedin' | 'pdf'
  linkedinUrl?: string    // Maps to "linkedin_url" in DB
  extractedAt: DateTime   // When profile was extracted
  createdAt: DateTime     // Profile creation timestamp
  updatedAt: DateTime     // Last modification timestamp
}
```

### CVState Structure (Populated by LinkedIn Extraction)
```typescript
interface CVState {
  fullName: string
  email: string
  phone: string
  linkedin?: string
  location?: string
  summary: string
  experience: ExperienceEntry[]
  skills: string[]
  education: EducationEntry[]
  certifications?: CertificationEntry[]
}
```

### API Request/Response Examples

#### POST /api/profile/extract
```
Request:
{
  "linkedinUrl": "https://www.linkedin.com/in/john-doe-123/"
}

Response:
{
  "success": true,
  "jobId": "job_abc123",
  "position": 3,
  "message": "Profile extraction started"
}
```

#### GET /api/profile/status/:jobId
```
Response:
{
  "jobId": "job_abc123",
  "status": "active" | "completed" | "failed"
}
```

#### GET /api/profile
```
Response (with profile):
{
  "profile": {
    "id": "prof_123",
    "source": "linkedin",
    "cvState": { /* CVState object */ },
    "linkedinUrl": "https://www.linkedin.com/in/john-doe-123/",
    "extractedAt": "2026-04-07T14:23:45Z",
    "createdAt": "2026-04-07T14:23:45Z",
    "updatedAt": "2026-04-07T14:23:45Z"
  }
}

Response (no profile):
{
  "profile": null
}
```

## Error Handling Flows

### LinkedIn URL Validation Fails
```
User Input → POST /api/profile/extract
           ↓
           Zod validation fails
           ↓
           Return 400: { error: validation.error.flatten() }
           ↓
           Frontend shows error toast
```

### LinkdAPI Request Fails
```
Worker processes job
           ↓
           fetchLinkedInProfile() throws error
           ↓
           Worker catches error
           ↓
           Logs error with appUserId
           ↓
           Throws to BullMQ
           ↓
           BullMQ retries (max 3 times)
           ↓
           If all retries fail: Job moves to 'failed' state
           ↓
           Frontend polling detects 'failed' status
           ↓
           Shows error toast: "Falha ao extrair perfil. Tente novamente."
```

### Session Creation Without Profile
```
User creates session (no saved profile)
           ↓
           seedCvStateFromProfile() queries database
           ↓
           No user_profiles row found
           ↓
           Returns empty cvState
           ↓
           Session created with empty cvState
           ↓
           buildPreloadedResumeContext() returns empty string
           ↓
           Agent receives normal prompt
           ↓
           Agent follows INTAKE phase: asks for resume upload
           ↓
           User calls parse_file as usual
```

## Performance Considerations

### Rate Limiting
```
Queue Config:
- Max: 10 jobs
- Duration: 60 seconds (1 minute)
- Effective: 10 jobs per minute maximum

This respects LinkdAPI rate limits and prevents
overwhelming the external service.
```

### Concurrency
```
Worker Concurrency: 2
- Only 2 extraction jobs process simultaneously
- Remaining jobs wait in queue
- Reduces resource usage on main application server
```

### Polling Interval
```
Frontend Polling: 2 seconds
- GET /api/profile/status/:jobId every 2 seconds
- Trade-off: Users see updates quickly
- Minimal server load (one query per user per 2 seconds)
```

### Database Queries
```
Seeding Operation:
- Single query to user_profiles table
- Uses index on user_id for O(1) lookup
- Happens once per session creation
- Cached in session object for entire session lifetime
```

---

**Last Updated:** 2026-04-07  
**Status:** Complete & Verified
