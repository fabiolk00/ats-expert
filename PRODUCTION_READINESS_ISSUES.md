---
title: Production Readiness Issues - LinkedIn Profile Feature
date: 2026-04-07
severity: [High, Medium, Low]
status: Requires Resolution
---

# Production Readiness Issues

## 🔴 HIGH: BullMQ Worker Never Executes (Vercel Incompatibility)

**Issue:** `queue.ts` instantiates a BullMQ Worker inside the Next.js app, but Vercel is serverless and doesn't support persistent processes.

**Current Code:**
```typescript
// src/lib/linkedin/queue.ts
const linkedinWorker = new Worker<LinkedInProfileJob, LinkedInProfileJobResult>(
  'linkedin-profile-extract',
  processor,
  { connection: redis, concurrency: 2 }
)
```

**What Happens:**
1. Extract route calls `linkedinQueue.add()` → job queued to Upstash Redis ✅
2. Worker is never instantiated (or dies immediately on Vercel)
3. Job sits in queue forever, never processes
4. Status poll returns "waiting" indefinitely
5. User sees infinite spinner

**Why It Matters:**
- LinkedIn extraction doesn't work in production
- Queue backs up with unprocessed jobs
- Users think feature is broken (it is, silently)

**Why It Happened:**
- BullMQ is designed for self-hosted or long-lived worker environments
- Vercel (serverless) can't run persistent processes
- The queue initialization works locally (where you can keep Node running)

---

## 🔴 HIGH: Completed Job Polling Race Condition

**Issue:** `removeOnComplete: true` in queue config, but status endpoint depends on `getJob(jobId)` existing, and UI treats job-not-found as failure.

**Current Code:**
```typescript
// queue.ts
const linkedinQueue = new Queue('linkedin-profile-extract', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,  // ← Problem
    removeOnFail: false,
  },
})

// status/[jobId]/route.ts
const job = await linkedinQueue.getJob(jobId)
if (!job) {
  return NextResponse.json({ error: 'Job not found' }, { status: 404 })
}

// resume-builder.tsx
if (status === 'failed' || !status) {
  toast.error('Falha ao extrair perfil')
}
```

**Race Condition:**
1. Worker completes job, upserts profile to database ✅
2. Job deleted from queue (removeOnComplete: true)
3. Frontend polling: GET /api/profile/status/{jobId}
4. Job not found → 404
5. UI treats 404 as failure and shows error toast
6. But profile is actually already saved to database ✅

**User Experience:**
- Profile was successfully extracted
- But user sees error message
- User thinks import failed
- User may retry or abandon feature

**Why It Matters:**
- Trust erosion: UI lies about success/failure
- Silent data loss perception (profile saved but user doesn't know)

---

## 🟡 MEDIUM: JSON Parsing Outside Try/Catch

**Issue:** `route.ts` parses `await request.json()` before try/catch block.

**Current Code:**
```typescript
// route.ts (line 105)
export async function PUT(request: Request) {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = CVStateSchema.safeParse(await request.json())  // ← Unguarded
  
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  try {
    // ... database operations
  } catch (error) {
    logError('[api/profile] Unexpected save error', {...})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Problem:**
- Malformed JSON in request body → `await request.json()` throws
- Exception not caught → 500 Internal Server Error
- Inconsistent with agent route (which wraps `req.json()` in try/catch)

**Impact:**
- Users with network corruption or proxy issues get 500
- Should be 400 Bad Request
- Inconsistent API error behavior

**Comparison with Agent Route (Correct Pattern):**
```typescript
// src/app/api/agent/route.ts - correct pattern
let rawBody: unknown
try {
  rawBody = await req.json()
} catch {
  logWarn('agent.request.invalid_json', {...})
  return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 })
}
```

---

## 🟡 MEDIUM: Synchronous Gap Analysis Delays sessionCreated Event

**Issue:** `persistDetectedTargetJobDescription()` in agent route runs synchronous gap analysis, delaying the `sessionCreated` event needed for session persistence.

**Current Code:**
```typescript
// route.ts (line 544)
await persistDetectedTargetJobDescription(session!, message, appUserId, requestId)

if (!isNewSession) {
  // ... existing session handling
} else {
  const stream = new ReadableStream({
    async start(controller) {
      if (isNewSession) {
        send({ sessionCreated: true, sessionId: session!.id })  // ← Delayed by gap analysis above
```

**Sequence (New Session + Seeded Profile + Job Description):**
1. User creates session with pasted job description
2. `persistDetectedTargetJobDescription()` called BEFORE stream starts
3. Function detects job description, runs `analyzeGap()`
4. Gap analysis is compute-heavy (calls LLM)
5. `sessionCreated` event delayed 2-5 seconds
6. Frontend waits for sessionId before persisting URL
7. If user refreshes during this window, second session created (double charge)

**Why It Matters:**
- Defeats the "return sessionId immediately" pattern
- Increases risk of accidental duplicate sessions
- Degrades perceived performance

**Root Cause:**
- `persistDetectedTargetJobDescription()` runs synchronously before stream
- Should either be async/deferred, or moved inside the stream

---

## 🟢 LOW: Test Coverage Gaps

**Issue:** Tests don't cover new code paths:

1. **route.test.ts** - Still reflects old credit-check logic
   - Missing: PUT /api/profile save flow
   - Missing: Profile retrieval with seeded data
   - Missing: Data validation and sanitization

2. **No tests for profile routes**
   - GET /api/profile
   - PUT /api/profile
   - POST /api/profile/extract
   - GET /api/profile/status/:jobId

3. **No tests for UI components**
   - src/components/resume/user-data-page.tsx
   - src/components/resume/resume-builder.tsx
   - src/components/resume/visual-resume-editor.tsx
   - ImportResumeModal behavior

4. **No tests for webhook limiter branch**
   - Rate limit bypass logic
   - Rate limit exceeded path
   - Logging behavior

5. **No integration tests**
   - Extract → Poll → Retrieve flow
   - Seeding on session creation
   - Agent context injection

**Coverage Estimate:**
- Current: ~40% of new code untested
- Needed: >80% on critical paths (seeding, polling, saves)

---

## 📋 Summary Table

| Issue | Severity | Impact | Fix Complexity |
|-------|----------|--------|-----------------|
| Worker never executes | 🔴 HIGH | Feature broken in prod | High (arch change) |
| Job disappears race | 🔴 HIGH | Silent false failures | Low (config change) |
| JSON parsing unguarded | 🟡 MED | Wrong HTTP status | Low (move try/catch) |
| Gap analysis sync delays | 🟡 MED | Double-charge risk | Medium (refactor) |
| Test coverage gaps | 🟢 LOW | Regression risk | Medium (write tests) |

---

## 🔧 Recommended Fixes (Priority Order)

### Fix 1: Remove BullMQ Worker (Immediate)
**Problem:** Worker never runs on Vercel  
**Solution Options:**
A. Use Upstash REST API directly (if available)
B. Process on-demand (poll → extract on-demand)
C. Move to platform supporting persistent workers

```typescript
// Option B: On-demand extraction (safest for Vercel)
// When UI polls status, if job still queued, process it now
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const job = await linkedinQueue.getJob(jobId)
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  
  const state = await job.getState()
  
  // If still queued and idle, process it now
  if (state === 'waiting' && Date.now() - job.createdAt > 1000) {
    try {
      const result = await processor(job, new MockWorker())
      job.progress(100)
      await job.complete(result)
    } catch (error) {
      await job.failed(error)
    }
  }
  
  const newState = await job.getState()
  return NextResponse.json({ jobId, status: newState })
}
```

### Fix 2: Change removeOnComplete to removeOnFail (Quick)
```typescript
const linkedinQueue = new Queue('linkedin-profile-extract', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: false,  // ← Keep completed jobs
    removeOnFail: false,
  },
})
```
Then add cleanup cron to remove jobs > 24h old.

### Fix 3: Wrap JSON Parsing (Quick)
```typescript
export async function PUT(request: Request) {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CVStateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // database operations
  } catch (error) {
    // ...
  }
}
```

### Fix 4: Defer Gap Analysis (Medium effort)
Move `persistDetectedTargetJobDescription()` inside stream, or queue as background job.

### Fix 5: Add Test Coverage (Medium effort)
- Unit tests for each route
- Integration tests for extract → poll → retrieve
- Component tests for resume editor
- Snapshot tests for sanitization

---

## 🚨 Blocking Production Deployment

**Do not deploy to production until:**
- [ ] BullMQ worker issue resolved (or removed)
- [ ] Polling race condition fixed
- [ ] JSON parsing wrapped in try/catch
- [ ] Manual testing of extract → poll → retrieve flow succeeds
- [ ] Minimum test coverage (>80% on seeding, polling, saves)

**Safe to Deploy After:**
- [ ] Fix 1-3 applied
- [ ] Manual end-to-end test passes
- [ ] Deployed to staging for 24h monitoring

---

**Generated:** 2026-04-07  
**Severity Distribution:** 2 High, 2 Medium, 1 Low  
**Estimated Fix Time:** 8-12 hours (prioritized)
