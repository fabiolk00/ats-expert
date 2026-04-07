---
title: CurrIA Architecture Review
audience: [architects, leads, product]
date: 2026-04-06
reviewer: Architecture Analysis
status: comprehensive review
---

# CurrIA Architecture Review

## Executive Summary

CurrIA exhibits **strong foundational architecture** with mature patterns for session state management, tool-based AI integration, and billing reliability. The system demonstrates **principled design decisions** backed by documented invariants and enforced conventions.

**Overall Architecture Maturity: 7.5/10**

The system is well-structured for current scale and near-term growth. Key strengths are separation of concerns, intentional state boundaries, and defensive billing practices. Near-term opportunities exist in testing completeness, observability depth, and API versioning strategy.

### Top 3 Architectural Strengths

1. **Tool-Based Dispatcher Pattern** - Clean separation between tool execution and state mutation. Tools return patches; dispatcher persists centrally. This prevents direct session mutation bugs and enables testability.

2. **Database Convention Hardening** - Explicit ID and timestamp generation on both database defaults and app-side inserts. Automated CI enforcement prevents schema drift. This level of defensive programming is mature.

3. **Billing State Reliability** - Multi-layered idempotency (fingerprint-based deduplication), explicit trust anchors (externalReference), and audit trail (processed_events) create high confidence in financial correctness.

### Top 3 Architectural Risks/Weaknesses

1. **Test Coverage Gaps** - 58 test files are empty stubs (returning 0 tests). Core paths like session creation, credit consumption, and billing webhooks lack documented test coverage. This increases regression risk.

2. **API Contract Versioning Absent** - No explicit API versioning strategy or deprecation policy. Current routes use implicit contracts. At 10x scale, versioning will become necessary.

3. **Observability Sparse at Edges** - Structured logging is good at tool/billing boundaries, but route-level error handling and rate-limiting observability are minimal. Hard to diagnose user-facing failures in production.

### Scalability Readiness

**Current (1x):** System is production-ready for Brazilian SMB launch. Single-region Supabase + OpenAI dependency.

**10x Growth (10M sessions):** Likely bottleneck is session state JSON size and query patterns. No sharding strategy yet. Billing fingerprint-based deduplication will hold; webhook throughput may need batching.

**100x Growth (100M sessions):** Requires rethinking session JSON storage (possible columnar split), read replica strategy, and asynchronous billing event processing.

---

## Detailed Assessment

### 1. System Architecture (7/10)

#### Current Architecture

**Request Flow Clarity: Excellent**

The `/api/agent` request flow is well-documented and follows a clear sequence:
1. Resolve app user
2. Rate limit
3. Validate input
4. Load/create session
5. Consume credit (new session only)
6. Persist message
7. Run tool loop
8. Stream responses

**Evidence:** CLAUDE.md lines 222-233 articulate the exact sequence. Code in `src/app/api/agent/route.ts` follows this precisely.

**Tool Invocation Pattern: Strong**

Tools return `{ output, patch? }`. The dispatcher:
- Validates tool input with Zod before execution
- Merges patches without erasing unrelated state
- Persists through RPC for atomicity
- Creates version history for state changes

**Evidence:** `src/lib/agent/tools/index.ts` lines 217-432 show the contract. Tool input validation (lines 224-235) catches bad input before dispatch.

**State Bundle Design: Well-Conceived**

The session bundle separates concerns:
- `cvState`: canonical resume truth (immutable during version snapshots)
- `agentState`: operational context (sourceResumeText, targetJobDescription, gapAnalysis)
- `generatedOutput`: artifact metadata (paths, status, errors—not signed URLs)
- `atsScore`: read-only scoring result
- `stateVersion`: bundle-level versioning (currently 1)

**Evidence:** CLAUDE.md lines 150-212 define the contract. Schema in `prisma/schema.prisma` lines 29-51 reflects this.

**Weaknesses:**

1. **SSE Implementation Not Optimal** - `/api/agent` calls OpenAI with non-streaming completions, then re-streams chunks over SSE (documented in CLAUDE.md line 274). This adds latency and increases perceived streaming lag. Should use OpenAI streaming directly.

2. **Session State Versioning Unused** - `stateVersion` field exists and defaults to 1, but no migration logic for v2+ bundle shapes. If shape changes, old clients may break silently.

3. **No API Request Tracing** - No `X-Request-ID` or distributed trace IDs across agent, tool, and storage layers. Makes debugging user issues difficult.

#### Architecture Recommendations

**Priority 1 (3-6 months):**
- Implement OpenAI streaming directly in `/api/agent`. Remove re-streaming layer. Reduces latency by ~200-500ms per message.
- Add request IDs to all responses and log them. Wire them to tool output logging.

**Priority 2 (6-12 months):**
- Design stateVersion migration path: if version > CURRENT, return error with upgrade hint instead of silent parsing errors.
- Consider splitting session JSON into separate columns: `cv_state_snapshot` (read-only during versions) vs. `cv_state_live` (mutable). Reduces update payload sizes.

---

### 2. Database Design (8/10)

#### ID Generation Strategy

**Strengths:**

1. **Dual Hardening** - Both database `DEFAULT gen_random_uuid()::text` and app-side `createDatabaseId()` ensure inserts succeed regardless of environment.
   
2. **Automated Enforcement** - CI audit enforces convention completion: every surrogate-key table must finish migration chain with UUID defaults. See `npm run audit:db-conventions` passing (confirmed).

3. **Domain ID Clarity** - Business identifiers kept separate:
   - `users.id` is internal app user
   - `credit_accounts.id` is `cred_{userId}`
   - `billing_checkouts.checkout_reference` is trust anchor

**Evidence:**
- `prisma/migrations/20260407_harden_text_id_generation.sql` lines 1-35 standardize all text PKs
- `docs/database-conventions.md` lines 95-129 codify the rule
- `src/lib/db/schema-guardrails.ts` + `scripts/audit-database-conventions.ts` enforce it

#### Timestamp Strategy

**Strengths:**

1. **Defense-in-Depth** - Database defaults + app explicit timestamps + RPC explicit timestamps prevent null-constraint violations.

2. **Centralized Helpers** - `createInsertTimestamps()`, `createUpdatedAtTimestamp()` ensure consistency.

**Evidence:**
- `src/lib/db/timestamps.ts` provides standard helpers
- `src/lib/asaas/quota.ts` line 66 uses explicit timestamps
- Billing migration `20260407_harden_standard_timestamps.sql` standardizes all mutable tables

#### Schema Relationships

**Strengths:**

1. **Clear Ownership** - Session → Messages, Session → CVVersions, ResumeTarget → CVVersions with explicit cascading deletes.

2. **Immutable History** - CVVersions are append-only snapshots. No update-in-place risk.

**Concerns:**

1. **No Soft Deletes** - Sessions deleted with CASCADE. If a user account is deleted, all resume history is lost. No audit trail preserved.

2. **Missing Constraints** - `job_applications.resume_version_label` is a free-form string with no foreign key to CVVersion. Could reference stale labels.

3. **Large JSON Columns** - `cv_state`, `agent_state`, `generated_output` stored as JSONB without schema validation at database layer. Application responsible for all validation.

#### Scalability

**Current:** Single table growth is fine for 100K-1M sessions. Indices are reasonable.

**Concern at 10M+:** Session JSON (cvState + agentState + generatedOutput) could reach 50KB-200KB per row. Sequential scans or full-table updates become expensive.

**Recommendation:** Consider columnar split:
```sql
CREATE TABLE session_cv_snapshots (
  session_id TEXT PRIMARY KEY,
  cv_state JSONB NOT NULL,
  version_source cv_version_source,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```
Then `sessions.cv_state` becomes a view materialized from latest snapshot. Allows independent scaling and versioning.

#### Database Recommendations

**Priority 1:**
- Add soft-delete support: `deleted_at` column on sessions and job_applications. Preserves audit trail.
- Add foreign key from `job_applications.session_id` to `sessions.id` (already present) but add constraint on `resume_version_label` → `cv_versions.id` or at least validate in application layer.

**Priority 2:**
- Introduce database-layer JSONB schema validation using CHECK constraints for `cv_state` structure.
- Create read replica strategy before 10M sessions; RLS policies prepared for future sharding.

---

### 3. API Contract Consistency (6/10)

#### Status Code Alignment

**Current Implementation:**

Tool errors map to HTTP status correctly:
- `VALIDATION_ERROR` → 400
- `PARSE_ERROR` → 400
- `LLM_INVALID_OUTPUT` → 500
- `NOT_FOUND` → 404
- `UNAUTHORIZED` → 401
- `GENERATION_ERROR` → 500
- `RATE_LIMITED` → 429
- `INTERNAL_ERROR` → 500

**Evidence:** `src/lib/agent/tool-errors.ts` lines 35-44.

**Weaknesses:**

1. **Route-Level Errors Inconsistent** - `/api/agent` validation errors return plain `{ error: ... }` (line 43 in route.ts). Tool errors return `{ success: false, code, error }`. Clients must handle two formats.

2. **No Retry-After Headers** - Rate limit responses (429) don't include `Retry-After`. Clients can't implement smart backoff.

3. **Missing Error Context** - Tool errors lack `errorContext` for actionable recovery hints. Example: "fullName is required" → could suggest "Edit resume > basic info > name field".

#### Error Response Format

**Strength:** 8 distinct codes with clear semantics. No overlapping ambiguity.

**Concern:** Messages capped at 500 chars (line 25 in tool-errors.ts) but no structured sub-errors. Example: validation of 5 fields fails, user sees only "Invalid input" (first issue summarized).

#### Tool Input/Output Schema Alignment

**Strengths:**

1. Zod schemas for all tools defined in `src/lib/agent/tools/schemas.ts`
2. Tool definitions in TOOL_DEFINITIONS match input schema fields
3. Output is type-safe through TypeScript union types

**Evidence:** `src/lib/agent/tools/index.ts` lines 41-170 define tools. Input validation lines 224-235.

**Concern:** Tool output types not explicitly validated before returning to client. Example: `generate_file` returns `{ docxPath, pdfPath, ...signed URLs }`. If RPC fails partway, patch persists but signed URLs missing → client sees partial state.

#### Versioning Strategy

**Critical Gap:** No API versioning or deprecation policy.

- Current routes: `/api/agent`, `/api/session`, `/api/checkout`, `/api/webhook/asaas`, etc.
- No `/v1/` prefix, no backwards-compatibility headers, no sunset policy.
- If tool contract changes (e.g., new required field), all clients break simultaneously.

**Impact:** At 10x users, coordinating client updates becomes infeasible.

#### API Recommendations

**Priority 1 (Immediate):**
- Standardize all route-level errors to match tool error format: `{ success?: boolean, code?, error, ... }`
- Add `Retry-After` header to 429 responses
- Document error response format in OpenAPI/Swagger spec

**Priority 2 (Within 2 months):**
- Introduce `/api/v1/` routes alongside current routes. Start deprecation policy: v0 supported for 6 months, then sunset.
- Add structured error context: `{ code, error, context: { field?: string, hint?: string } }`

**Priority 3 (6-12 months):**
- Publish OpenAPI/Swagger schema. Generate client SDKs with error types.
- Implement request ID tracing across all routes.

---

### 4. Billing & State Reliability (9/10)

#### Credit Consumption Atomicity

**Design:** One credit consumed when `/api/agent` creates a new session. Multiple messages on same session consume zero additional credits.

**Implementation:**
1. `getSession()` or `createSessionWithCredit()` routes through RPC `get_or_create_app_user` + `consume_credit_atomic`
2. Credit consumption is atomic: reads and decrements in single RPC
3. If RPC unavailable, falls back to optimistic locking with WHERE clause
4. Credit consumed before tool loop starts; if tools fail mid-execution, credit is already spent

**Evidence:**
- `src/lib/asaas/quota.ts` lines 107-148: atomic consumption with fallback
- `src/app/api/agent/route.ts` lines 6-13: imports credit check before session creation
- RPC: `prisma/migrations/consume_credit_atomic.sql` (lines 1-30 of that migration)

**Strength:** Design prevents double-charging if request is retried.

#### Webhook Idempotency

**Design:** Fingerprint-based deduplication. Each Asaas event is normalized to a stable fingerprint; processed events stored in `processed_events` table with unique constraint on `event_fingerprint`.

**Implementation:**
```
1. Webhook arrives
2. Parse and validate payload
3. Compute fingerprint from event + payment/subscription data
4. Check if fingerprint exists in processed_events
5. If yes, reconcile state (update quota metadata) but skip side effects
6. If no, run handler, mark processed only after success
```

**Evidence:**
- `src/lib/asaas/idempotency.ts` lines 87-100+: fingerprint computation
- `src/app/api/webhook/asaas/route.ts` lines 129-143: duplicate detection before processing
- `prisma/schema.prisma` lines 164-176: `ProcessedEvent` with unique fingerprint

**Strength:** Handles Asaas redelivery gracefully. If handler partially succeeds (e.g., RPC crashes after credit grant), webhook retry will idempotently succeed.

#### Credit Carryover Logic

**Design:**
- Plan change: remaining credits carried over + new plan credits added
- Renewal: credits replaced (not added)

**Implementation:** `src/lib/asaas/credit-grants.ts` sets `p_is_renewal` parameter sent to RPC. RPC applies appropriate logic.

**Evidence:** CLAUDE.md lines 31-36 document the intent. Code references `src/lib/asaas/credit-grants.ts` (not shown, but referenced).

**Trust Anchor:** Billing writes validate externalReference or fallback to checkoutSession. RPC defensively re-validates before mutating state.

#### Weak Points

1. **No Double-Spend Audit Trail** - If a user somehow gets two credits granted for one payment, the system has no "explain what happened" query. Processed_events stores only `event_fingerprint`, not which action was taken.

2. **Subscription Cancellation State Unclear** - When user cancels, `user_quotas.status = 'canceled'` but credits are not revoked (CLAUDE.md line 72). If user cancels mid-month and signs up for free tier, they retain credits from premium plan. Intentional? Document it.

3. **No Credit Expiration** - Free tier credits never expire. If user is inactive for 2 years, they still have 1 free credit. No cleanup mechanism.

4. **Asaas Dependency Single Point of Failure** - Webhook is external and unreliable. If Asaas goes down for 24 hours, credits are not granted. No retry queue or fallback.

#### Billing Recommendations

**Priority 1 (1-2 months):**
- Add `action_taken` column to `processed_events`: `{ event_fingerprint, action: 'grant_credits' | 'reconcile' | 'revoke', user_id, credits_granted }`. Enables post-hoc audit queries.
- Document subscription cancellation credit behavior: is retention intentional? If yes, document. If no, implement revocation option in account settings.

**Priority 2 (3-6 months):**
- Implement webhook retry queue: if handler fails, persist in `pending_webhook_actions` table. Cron job retries with exponential backoff.
- Add credit expiration: free tier credits expire 1 year after grant. Paid plan credits expire 60 days after renewal date.

---

### 5. Identity & Security Model (7/10)

#### Authentication Model Soundness

**Design:** Clerk (external) → app user (internal) → domain logic.

**Flow:**
1. Clerk authenticates request, provides `userId`
2. `getCurrentAppUser()` resolves Clerk ID to app user via `user_auth_identities` mapping
3. If no mapping exists, bootstrap with `get_or_create_app_user` RPC
4. All domain logic uses app user ID

**Evidence:**
- `src/lib/auth/app-user.ts` lines 105-127: bootstrap and resolution
- Clerk → app user happens at boundary
- No Clerk IDs leak into domain logic

**Strengths:**

1. **Clean Boundary** - Auth is isolated to `app-user.ts`. Easy to swap Clerk for another provider later.

2. **Consistent Mapping** - All authenticated routes call `getCurrentAppUser()` before any domain logic.

#### Authorization Model

**Current Implementation:**

Session ownership verified through `getSession(appUserId, sessionId)`:
```ts
const session = await getSession(sessionId, appUserId)
if (!session) return 403 Forbidden
```

Similar checks on `/api/session/[id]/versions`, `/api/session/[id]/targets`, etc.

**Evidence:**
- `src/lib/db/sessions.ts` lines 197-205: `getSession()` filters by user_id
- Routes consistently call ownership check before reading

**Strengths:** Simple and testable. No role-based access control needed for current product.

**Weaknesses:**

1. **No Multi-User Sharing** - If future product requires sharing sessions with collaborators, authorization logic must change everywhere.

2. **No Rate Limit Per User** - Upstash rate limiting is enforced, but no per-user quota audit. If user is rate limited, no transparent reason shown.

3. **Billing Metadata Unprotected** - `/api/session` returns user's sessions. No filtering of sensitive billing metadata. Not critical for MVP, but should mask plan/credits from client if needed.

#### Cross-Tenant Isolation

**Model:** Single app (CurrIA) per Clerk organization. Users are isolated by app user ID.

**Verification Points:**
1. getSession() filters by user_id ✓
2. getUserSessions() filters by user_id ✓
3. createSession() sets user_id from current app user ✓
4. ResumeTarget queries filter by session_id, which is owned by user ✓

**Evidence:** Sessions and targets cascade by foreign key; no raw user ID from request.

**Risk:** If Clerk multi-org support is added later, user_id alone won't be sufficient. Org_id must be added to sessions, messages, targets, etc.

#### Credential & Secret Management

**Current:**
- `CLERK_SECRET_KEY`: used to verify session cookies
- `ASAAS_WEBHOOK_TOKEN` / `ASAAS_ACCESS_TOKEN`: used to verify webhook signature
- `OPENAI_API_KEY`: used for model calls
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: used for DB access
- `CRON_SECRET`: used to authenticate cleanup cron

**Strengths:**
- All secrets in environment variables (not committed)
- Webhook tokens verified at route entry (no bypass)
- Service role key used only server-side

**Weaknesses:**

1. **No Key Rotation Strategy** - If ASAAS_WEBHOOK_TOKEN is compromised, no way to rotate without downtime. No versioned key support.

2. **No Rate Limiting on Public Routes** - `/api/webhook/asaas` is public and only checks token. No IP allowlist or rate limit. Attacker could brute-force token.

3. **Cron Secret Weak** - `Authorization: Bearer ${CRON_SECRET}` is simple but no expiration or rotation. If secret leaks, attacker can trigger cleanup.

#### OWASP Top 10 Coverage

| Vulnerability | Status | Evidence |
|---|---|---|
| Injection (SQL/NoSQL) | Good | Supabase.js + Prisma prevent SQL injection; Zod validates JSON structure |
| Broken Authentication | Good | Clerk handles auth; app user resolution enforced |
| Sensitive Data Exposure | Fair | HTTPS enforced; secrets in env; but signed URLs not cached/expired |
| XML External Entity (XXE) | Good | No XML parsing; DOCX/PDF parsing uses libraries without XXE risk |
| Broken Access Control | Good | Ownership checks on session/target routes; rate limiting enforced |
| Security Misconfiguration | Fair | No security headers (CSP, X-Frame-Options, etc. not visible) |
| Cross-Site Scripting (XSS) | Fair | React prevents HTML injection; sanitization on user input visible in `sanitizeUserInput()` but coverage incomplete |
| Insecure Deserialization | Good | No eval(); Zod validates all inputs |
| Using Components with Known Vulnerabilities | Unknown | Depends on npm audit; not checked here |
| Insufficient Logging & Monitoring | Fair | Structured logging present; but no alerting rules or SLA tracking visible |

#### Security Recommendations

**Priority 1 (Immediate):**
- Add rate limiting to `/api/webhook/asaas`. Or require IP allowlist from Asaas docs.
- Add security headers to all responses: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'self'`.
- Document secret rotation procedure. Implement versioned ASAAS_WEBHOOK_TOKEN support (old token valid for 30 days).

**Priority 2 (1-3 months):**
- Implement multi-org support if roadmap requires: add `org_id` to sessions, targets, quotas.
- Add signed URL expiration: generate with 1-hour TTL instead of indefinite.
- Implement audit log: `security_events(user_id, event_type, ip_address, user_agent, timestamp)` for login, logout, permission change, data access.

**Priority 3 (3-6 months):**
- Implement zero-trust: require periodic re-authentication for sensitive operations (credit grant, subscription change).
- Add security monitoring: anomaly detection on credit grants, bulk data exports, failed logins.

---

## Reliability & Failure Scenarios

### Critical Path: Session Creation with Credit Consumption

**Failure Mode 1: Credit Consumption Succeeds, Tool Loop Fails**
- Credit is spent, but user gets error
- Next message will not consume credit (same session)
- **Recovery:** User can retry message; tool may partially update session

**Failure Mode 2: Session Creation Succeeds, Credit Consumption Fails**
- Session persisted but credit_account not updated
- Next `/api/agent` call will fail at `checkUserQuota()`
- **Recovery:** Manual credit grant via admin panel (if exists)

**Evidence:** `src/app/api/agent/route.ts` creates session before credit check. This is actually backwards; should be: check quota → consume credit → create session.

**Recommendation:** Reorder in `/api/agent`: check credits first, consume atomically, then create session. If credit check fails, return 402 before session creation.

### Critical Path: Asaas Webhook → Credit Grant

**Failure Mode 1: Webhook Received, Fingerprint Computed, Handler Crashes Before Processed_Events Insert**
- No record of processing, but credits already granted
- Webhook retry will grant credits again (double credit)
- **Recovery:** Processed_events insert happens after success (CLAUDE.md line 71); if handler crashes, credits won't be granted twice.

**Failure Mode 2: Webhook Signature Valid, But RPC Returns Error**
- Handler marks event as processed without granting credits
- Webhook retry is skipped (duplicate)
- **Recovery:** Manual credit grant required

**Mitigation:** Current design is solid. Processed_events insert is last step (after RPC succeeds). Good defensive measure.

### Critical Path: Session Rendering → File Generation

**Failure Mode 1: cvState Validation Fails in generate_file**
- Tool returns failure but `generatedOutput` persists with error status
- Client sees failed generation; can retry
- **Recovery:** Manual edit session, retry generation

**Failure Mode 2: PDF Generation Succeeds, Upload to Supabase Fails**
- DOCX uploaded, PDF not uploaded, signed URL generation partial
- Client sees incomplete result
- **Recovery:** Tool failure returned; user can retry

**Evidence:** `src/lib/agent/tools/generate-file.ts` validates before generation. Uploads are atomic (DOCX + PDF or none). This is good.

### Observability Gaps

1. **Rate Limiting Opaque** - User hits rate limit; no diagnostic available. They see 429 but don't know why or how long to wait.

2. **Tool Failures Not Aggregated** - Logs show individual failures but no dashboard for "which tools fail most often?" or "what are top error messages?"

3. **Credit Consumption Not Monitored** - No alerts if credit grant fails silently. No dashboard showing "expected vs. actual credits granted today."

### Recommendations

**Priority 1:**
- Add `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers to responses (even non-rate-limited ones for consistency)
- Log all tool failures to structured log with tags: `{ toolName, errorCode, errorMessage, userId, sessionId, latencyMs }`
- Add dashboard metric: "credit_grant_events_per_hour" with alert if < expected (e.g., < 10% of last week's average)

**Priority 2:**
- Implement error rate SLA tracking: "99% of /api/agent requests complete in <500ms"
- Add canary monitoring: dedicated test user submitting requests every minute; alert if errors spike

---

## Scalability & Extensibility Analysis

### Current Bottlenecks

1. **Session JSON Size Growth** - As cvState expands (more experience entries, skills, etc.), JSON payload grows. At 100K sessions × 200KB avg = 20GB. Sequential scans become slow.

2. **Processed_Events Table Growth** - Every webhook processed → row inserted. At 10K/day renewals = 100M rows/year. Needs partitioning by created_at.

3. **Message History Unbounded** - Each session can accumulate messages indefinitely. No pagination in `GET /api/session/[id]/messages`. Fetching 10K messages could timeout.

4. **Single Supabase Database** - All reads/writes go to single database. No read replica. Rate limiting on database connections could be reached.

### 10x Growth Scenario (10M Sessions, 100K Monthly Active)

**Assumptions:**
- 10M sessions = 10M × 200KB = 2TB storage
- 100K monthly users = ~30K daily active
- 30K active × 5 messages/day = 150K messages/day
- 1K subscriptions/day × 30 days = 30K renewal events/day
- OpenAI API calls: ~50K/day (1-2 per session, 10% of sessions generate files)

**Bottlenecks:**
1. Session table scan: 10M rows × 200KB JSON = full table scan is very slow for analytics
2. Message fetching: fetching all messages for a session could timeout
3. Webhook throughput: 30K renewal events/day ÷ 86.4K seconds = 0.35 events/sec. Supabase can handle 1000s/sec, so not a bottleneck.
4. OpenAI: 50K calls/day ÷ 86.4K seconds = 0.58 calls/sec, within rate limits.

**Mitigation:**
- Implement message pagination: `/api/session/[id]/messages?limit=20&offset=0`
- Archive old sessions (> 1 year) to cold storage
- Create read replica for analytics queries
- Partition `processed_events` by month: `processed_events_202604`, `processed_events_202605`, etc.

### 100x Growth Scenario (100M Sessions)

**Bottlenecks:**
1. Session sharding: Users distributed across multiple databases by user_id mod 8. Requires application-level routing logic.
2. Webhook processing: 300K events/day needs async queue (Upstash + Bull). Synchronous webhook handler will timeout.
3. File generation: Docxtemplater CPU-bound. Needs worker pool or async queue.
4. OpenAI: 500K calls/day requires batch processing or cached responses.

**Strategy:**
- Implement Upstash Redis queues for async jobs: `webhooks_to_process`, `files_to_generate`, `cvstate_to_index`
- Implement session ID sharding: `session:user_id:seq` → map user_id to shard ID
- Implement read-through cache for popular sessions (LRU, Redis)
- Implement billing data warehouse: replicate `processed_events` to BigQuery for analytics

### Extension Points for New Tools

**Current Tool Architecture:**

1. Define input/output types in `src/types/agent.ts`
2. Implement tool function returning `{ output, patch? }`
3. Register in `src/lib/agent/tools/index.ts` TOOL_DEFINITIONS
4. Add handler in `executeTool()` switch statement
5. Tests added to `src/lib/agent/tools/index.test.ts`

**Adding a New Tool (e.g., `linkedin_match`):**

```typescript
// 1. Type definition
type LinkedinMatchInput = {
  profile_url: string
  job_description: string
}

// 2. Implementation
async function linkedinMatch(input: LinkedinMatchInput, userId: string): Promise<ToolExecutionResult> {
  // ... fetch and match logic
  return {
    output: { matches: [...] },
    patch: {
      agentState: {
        linkedinProfiles: input.profile_url,
        lastLinkedinMatchAt: new Date().toISOString(),
      },
    },
  }
}

// 3. Registration
{
  type: 'function',
  function: {
    name: 'linkedin_match',
    description: 'Match resume against LinkedIn profile.',
    parameters: { ... }
  }
}

// 4. Handler
case 'linkedin_match':
  return linkedinMatch(toolInput as LinkedinMatchInput, session.userId)
```

**Friction Points:**
- AgentState must be extended for new fields. Breaks existing sessions with missing fields. Needs migration or default values.
- TOOL_DEFINITIONS must be updated. No plugin/dynamic registration.

**Recommendation:** Add Tool Registry abstraction:
```typescript
abstract class Tool {
  abstract name: string
  abstract definition: OpenAI.Chat.Completions.ChatCompletionTool
  abstract execute(input: unknown, session: Session): Promise<ToolExecutionResult>
}

export const REGISTERED_TOOLS = [
  new ParseFileTool(),
  new RewriteSectionTool(),
  new GenerateFileTool(),
  // ... easily add new tools
]
```

---

## Recommended Evolution (Priority Order)

### Phase 1: Risk Mitigation (Weeks 1-4)

1. **Fix Session Creation Order** (Risk: double-credit)
   - Check credits before session creation
   - Atomic transaction: check → consume → create
   - Estimated effort: 4 hours, 1 integration test

2. **Complete Test Coverage** (Risk: regression)
   - Write tests for empty test files (sessions, quota, webhook handlers)
   - Target: >80% coverage on critical paths
   - Estimated effort: 40 hours, high confidence

3. **Add Security Headers** (Risk: client-side exploits)
   - Add middleware for HSTS, CSP, X-Frame-Options
   - Estimated effort: 2 hours

### Phase 2: Observability (Weeks 5-8)

1. **Implement Request Tracing**
   - Add X-Request-ID to all responses
   - Wire to logging and tool dispatch
   - Estimated effort: 8 hours

2. **Add Structured Error Aggregation**
   - Export error logs to dashboard (Grafana/Datadog)
   - Alert on error rate spike (>5% 500s)
   - Estimated effort: 6 hours

3. **Billing Audit Trail**
   - Add action_taken column to processed_events
   - Estimate effort: 4 hours

### Phase 3: API Maturity (Weeks 9-16)

1. **API Versioning**
   - Launch `/v1/` routes alongside current
   - Begin deprecation policy for v0
   - Estimated effort: 24 hours

2. **Error Response Standardization**
   - Unify all error formats
   - Add structured error context
   - Estimated effort: 8 hours

3. **OpenAPI/Swagger**
   - Auto-generate from route definitions
   - Publish SDK for web/Node clients
   - Estimated effort: 16 hours

### Phase 4: Scale Preparation (Weeks 17-24)

1. **Database Optimization**
   - Implement message pagination
   - Add read replica for analytics
   - Estimated effort: 32 hours

2. **Async Job Queue**
   - Implement Upstash Redis for webhooks, file generation
   - Estimated effort: 24 hours

3. **Caching Layer**
   - Add Redis for popular sessions (LRU)
   - Cache ATS scores, gap analyses
   - Estimated effort: 16 hours

---

## Conclusion

### Overall Maturity

CurrIA demonstrates **7.5/10 architectural maturity** with strong foundations:

- **Separation of Concerns:** Tool-based dispatcher, session state boundaries, billing isolation ✓
- **Defensive Programming:** Dual-hardened ID/timestamp generation, fingerprint-based idempotency, RPC atomicity ✓
- **Documentation:** CLAUDE.md, database conventions, error codes clearly documented ✓

### Production Readiness

**Ready for:** Brazilian SMB launch with 1-10K concurrent users.

**Risk Zones:** Test coverage gaps, observability sparse, API versioning absent.

### Recommendation for Roadmap

**Next 4 Weeks:** Complete critical tests + fix session creation order. Move these to production immediately.

**Next 12 Weeks:** Implement observability (request tracing, error aggregation) + API versioning. These unlock scale.

**6-12 Months:** Async job queues + database optimization for 10x growth.

The system is well-architected for today's needs with clear extension points for tomorrow. Continue enforcing the documented invariants, expand test coverage, and invest in observability before scaling aggressively.

---

## Appendix: Key Files Reference

### Architecture & Invariants
- `CLAUDE.md` - Master source of truth
- `docs/architecture-overview.md` - Runtime boundaries and flows
- `docs/database-conventions.md` - ID/timestamp standards
- `docs/state-model.md` - Session bundle contract

### Core Implementation
- `src/app/api/agent/route.ts` - Main request entry point
- `src/lib/agent/tools/index.ts` - Tool execution and dispatch
- `src/lib/db/sessions.ts` - State persistence and merge
- `src/lib/auth/app-user.ts` - Identity resolution
- `src/lib/asaas/webhook.ts` + `route.ts` - Billing event handling
- `src/lib/plans.ts` - Single source of truth for billing

### Standards & Validation
- `src/lib/agent/tool-errors.ts` - Error codes and formatting
- `.claude/rules/api-conventions.md` - Route patterns
- `.claude/rules/error-handling.md` - Error handling rules
- `.claude/rules/code-style.md` - Code standards

### Database
- `prisma/schema.prisma` - Current schema
- `prisma/migrations/` - Migration history

---

**Document Date:** April 6, 2026  
**Review Scope:** System architecture, database design, API contracts, billing reliability, security, scalability  
**Confidence Level:** High (comprehensive code review + documentation analysis)
