# Architecture Engineer System Design Review: CurrIA

**Date:** 2026-04-06  
**Reviewed By:** Architecture Engineer AI Agent  
**Review Scope:** System design, database architecture, API contracts, billing reliability, identity & security

---

## Executive Summary

**Overall Architecture Score: 7.5/10**

CurrIA has a **well-thoughtout system architecture** with exceptional billing reliability and **excellent database hardening practices**. The tool-based dispatcher pattern is clean and prevents state mutation bugs. However, the architecture shows **gaps in observability**, **missing API versioning strategy**, and **critical test coverage deficits** that will create friction at 10x scale.

### Top 3 Architectural Strengths
1. **Tool-Based Dispatcher Pattern**: Clean separation between tool execution and state mutation prevents bugs and enables testability. Each tool returns `{ output, patch? }` immutably applied through dispatcher.
2. **Database Convention Hardening**: Dual hardening (database defaults + app-side generation) with automated CI enforcement prevents schema drift. Custom audit script ensures ID/timestamp consistency.
3. **Billing State Reliability**: Multi-layered idempotency with fingerprint-based deduplication creates high confidence in financial correctness. Webhook processing doesn't mark events complete until side effects succeed.

### Top 3 Architectural Risks
1. **Test Coverage Gaps**: 58 empty test stubs (0 tests run). Critical paths like session creation with credit consumption lack documented coverage.
2. **API Contract Versioning Absent**: No versioning strategy or deprecation policy. At 10x scale with multiple clients this becomes critical.
3. **Observability Sparse**: Structured logging exists at tool/billing boundaries but route-level error diagnostics are minimal. Hard to debug production incidents.

---

## Detailed Assessment

### 1. System Architecture (7/10)

**Current State:** Well-organized request flows with clean tool dispatch pattern, but SSE re-streaming and observability gaps.

#### **Request Flow Architecture**

**Strengths:**
- **Clear flow boundaries**: Auth → rate limit → session load/create → tool loop → streaming response
- **Tool dispatch pattern** is exemplary:
  ```ts
  executeTool() → returns { output, patch? }
    → dispatchTool() → applies patch immutably
    → applyToolPatchWithVersion() → merges + persists centrally
  ```
  This prevents direct session mutations and enables testing tool logic independently from persistence.

- **Session state versioning** (stateVersion field) provides forward-compatibility for future schema changes
- **Pre-stream enrichment**: Job description auto-detection + gap analysis pre-computed before streaming starts (good UX)
- **SSE implementation**: Proper event-stream protocol with message aggregation

#### **Weaknesses:**

- **SSE re-streaming is suboptimal**:
  - OpenAI is called with `stream: false` (non-streaming), then response is chunked and re-streamed as SSE
  - Creates unnecessary buffering and latency (chunk → parse → re-stream)
  - **Recommendation:** Switch to OpenAI streaming (`stream: true`) and pipe directly to SSE
  - **Impact:** 100-200ms latency reduction, cleaner code
  - **Effort:** 2-3 hours

- **Session state enrichment has side effects**:
  ```ts
  // Pre-stream enrichment (lines 568-615 in route.ts)
  const enrichedState = enrichSessionWithGapAnalysis(session)  // auto side-effects
  ```
  - If gap analysis fails, silently continues with stale state
  - If job description detection is wrong, user gets misleading suggestions
  - **Recommendation:** Explicit enrichment step with fallback behavior documented
  - **Impact:** Better debuggability, clearer error handling

- **Message cap enforcement is implicit**:
  - 15-message limit enforced in `applyToolPatchWithVersion()` but enforcement only on persistence
  - If user is at message 14 and makes 2 concurrent requests, race condition possible
  - **Recommendation:** Check cap before tool execution begins (atomic check-then-mutate)

#### **Tool Architecture Robustness:**

**Strengths:**
- 8-tool registry (parse_file, score_ats, analyze_gap, rewrite_section, generate_file, etc.)
- Each tool has typed input/output schema
- Tool failures don't mutate session state (fail gracefully)
- Tool patches are validated before merge (enforces shape)

**Weaknesses:**
- **Tool ordering is implicit**: No documented dependency graph (e.g., must `parse_file` before `analyze_gap`?)
  - If client calls tools out of order, behavior is undefined
  - **Recommendation:** Document tool sequencing contract or add runtime validation
  
- **Tool state transitions lack guards**:
  - `generateFile` reads `cvState` but doesn't validate if state is "ready"
  - `rewriteSection` updates canonical `cvState` but doesn't check if `parseStatus` is "complete"
  - **Recommendation:** Add tool-level precondition checks with clear error messages

---

### 2. Database Design (8/10)

**Current State:** Excellent ID/timestamp hardening and convention enforcement. Scalability concerns emerge at 100M+ records.

#### **Schema Strengths:**

- **ID Generation Hardening**:
  - `sessions` table uses BIGSERIAL with app-side secondary text IDs (`sess_<uuid>`)
  - `credit_accounts` uses custom format `cred_<userId>`
  - `processed_events` uses stable fingerprints (not transient delivery IDs)
  - **Dual-layer approach** prevents off-by-one errors and provides human-readable references
  - **CI enforcement** via `npm run audit:db-conventions` prevents drift

- **Timestamp Consistency**:
  - All rows have `created_at` (immutable), `updated_at` (mutable)
  - Defaults to `now()` at DB layer
  - Application cannot accidentally bypass timestamp logging

- **Constraint Coverage**:
  - Foreign keys prevent orphaned sessions/messages
  - Unique constraints on `user_auth_identities.clerk_id` prevent duplicate Clerk mappings
  - Unique constraints on `processed_events.event_fingerprint` enforce webhook idempotency
  - NOT NULL constraints on critical fields (user_id, session_id)

- **Relationship Modeling**:
  - `sessions → messages` (1:N): proper cascade delete
  - `sessions → cv_versions` (1:N): immutable snapshots isolated from mutation
  - `sessions → resume_targets` (1:N): target-specific variants don't interfere with base
  - `users → credit_accounts` (1:1): clear ownership boundary

#### **Scalability Concerns:**

- **`processed_events` table unbounded growth**:
  - Stores every webhook delivery for deduplication
  - At 1000 users × 1 subscription event/month = 12,000 rows/year
  - At 10x scale (10k users), could grow to 120k rows + weekly churn + event spam from Asaas retries
  - **Current approach:** Periodic `GET /api/cron/cleanup` deletes old events
  - **Risk:** Cleanup job may fall behind, leading to large table scans on `event_fingerprint` lookups
  - **Recommendation:** 
    - Partition by month: `processed_events_2026_04`, `processed_events_2026_05`
    - Or add TTL: `created_at` older than 90 days, delete automatically
    - Estimated effort: 2 hours + data migration

- **JSON columns for `cvState` + `agentState`**:
  - Currently stored as `JSONB` in `sessions.cv_state` and `sessions.agent_state`
  - Works well for <10k sessions but consider:
    - No indexing on nested fields (e.g., can't efficiently query sessions with "Python" skill)
    - JSONB ops slower than typed columns for frequent queries
    - At 100M sessions, JSONB serialization/deserialization becomes a bottleneck
  - **Current approach is appropriate** for current scale, but document migration path

- **Messages table lacks composite index**:
  - `GET /api/session/[id]/messages` queries `WHERE session_id = ? ORDER BY created_at DESC`
  - If not indexed as `(session_id, created_at DESC)`, query becomes full table scan on large tables
  - **Recommendation:** Verify index exists in migrations, or add:
    ```sql
    CREATE INDEX idx_messages_session_created ON messages(session_id, created_at DESC);
    ```

#### **Audit Trail Gap:**

- **No immutable audit log** for billing changes:
  - Credit consumption recorded in `credit_accounts.credits_remaining` (current state only)
  - No history of who/when credits were granted or spent
  - Makes support investigations (user claims they were double-charged) difficult
  - **Recommendation:** Add optional `credit_history` table:
    ```ts
    credits_history {
      id, credit_account_id, amount_change, reason, session_id, created_at
    }
    ```
    - Effort: 3-4 hours

---

### 3. API Contract Consistency (6/10)

**Current State:** Status codes and basic error handling are correct, but inconsistent error formats and missing versioning strategy limit long-term scalability.

#### **Status Code Usage (Correct):**

| Endpoint | 200 | 201 | 400 | 401 | 402 | 403 | 404 | 429 | 500 |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| `/api/agent` | ✓ | - | ✓ | ✓ | ✓ | - | - | ✓ | ✓ |
| `/api/session` | ✓ | - | - | ✓ | - | ✓ | - | - | ✓ |
| `/api/checkout` | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |
| `/api/webhook/asaas` | ✓ | - | ✓ | - | - | - | - | - | ✓ |

**Assessment:** Status code usage follows REST conventions correctly.

#### **Error Response Inconsistency:**

**Issue 1: Structured vs. Plain Errors**
```ts
// /api/agent returns:
{ error: "message" }

// /api/webhook/asaas returns:
{ success: false, code: "VALIDATION_ERROR", error: "message" }

// /api/checkout returns:
{ error: "message" } or { success: false, error: "message" }
```

**Impact:** Clients must handle different error shapes for different endpoints. At scale with multiple clients (web, mobile, integrations), this creates maintenance burden.

**Recommendation:** Standardize to structured errors everywhere:
```ts
// Consistent across all routes
{
  success: false,
  code: "VALIDATION_ERROR",  // from TOOL_ERROR_CODES
  error: "user-facing message",
  details?: { field: "reason" }  // for 400 validation
}
```
Effort: 3-4 hours

**Issue 2: Missing Versioning Strategy**

Current API has no versioning. If you need to:
- Rename a request field (e.g., `file` → `resumeFile`)
- Change response shape (e.g., `{ credits }` → `{ creditsRemaining }`)
- Deprecate a tool (e.g., old `apply_gap_action`)

You must break existing clients. At 10x scale this is critical risk.

**Recommendation:** Implement versioning:
```
POST /api/v1/agent
POST /api/v2/agent (if changes needed)
```

Define deprecation policy:
- v1 supported for 6 months
- v2 launched with breaking changes
- v1 turned off after 12 months

Effort: 4-6 hours design + implementation

**Issue 3: Missing Rate Limit Headers**

Upstash rate limiting is applied but headers not returned to client.

Current: Client has no way to know remaining quota
```ts
// Client can't see this:
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1617283200
```

**Recommendation:** Add to `/api/agent` response:
```ts
headers.set('X-RateLimit-Limit', limit.toString())
headers.set('X-RateLimit-Remaining', remaining.toString())
headers.set('X-RateLimit-Reset', reset.toString())
```

Effort: 1 hour

---

### 4. Billing & State Reliability (9/10)

**Current State:** Exemplary idempotency design with high confidence in financial correctness. Minor gaps in audit trail and webhook resilience.

#### **Idempotency Strengths (Exceptional):**

- **Fingerprint-based deduplication**: `processed_events.event_fingerprint` derived from stable payload (not transient Asaas delivery ID)
  ```ts
  const fingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify({ type, customerId, reference }))
    .digest('hex')
  ```
  - Prevents duplicate processing if webhook is retried
  - Even if Asaas resends with different `deliveryId`, fingerprint is same
  - **Highly effective approach**

- **Side effects applied AFTER fingerprint check**:
  - `getProcessedEvent()` checks if already processed
  - If already processed, returns early (no double-credit)
  - Only if new, side effects run (credit grant, subscription update)
  - Only then is `processed_events` entry created
  - **Atomic-like semantics** without distributed transactions

- **Webhook payload validation before processing**:
  - Zod schema enforces required fields
  - Payment event must have amount, date, reference
  - Subscription event must have customerId, date
  - Prevents processing of malformed Asaas events

- **Trust anchor with external reference**:
  - `externalReference = curria:v1:u:<userId>:c:<checkoutRef>` format
  - Prevents applying payment from different system or user
  - Allows Asaas to send events for multiple integrations on same account

#### **Weaknesses:**

- **Credit consumption order is wrong** (CRITICAL):
  ```ts
  // Current order in /api/agent route.ts (roughly):
  const session = await getOrCreateSession(...)  // ← Creates session
  await consumeCredit(appUser.id)                 // ← Consumes credit
  ```
  
  If credit consumption fails (e.g., insufficient credits), session is already created but credit wasn't consumed.
  
  **Impact:** User has empty session with no credit spent. Calling again tries to create another session (2nd credit attempt) but still fails.
  
  **Fix:** Reorder before session creation:
  ```ts
  // Check credit BEFORE session creation
  const checkResult = await checkCreditAvailability(appUser.id)
  if (!checkResult.available) return 402 Quota exceeded
  
  // Now create session with consumption as side effect
  const session = await createSessionWithCredit(...)
  ```

- **Webhook retry logic not documented**:
  - Asaas retries failed webhooks (status code 5xx)
  - Current code deduplicates by fingerprint, so retries are safe
  - **But:** What if webhook processing returns 200 but side effects partially fail?
    - Example: `grantCredit()` succeeds, `updateSubscription()` fails
    - Fingerprint is recorded but state is inconsistent
  - **Recommendation:** Wrap webhook in transaction or implement saga pattern
  - Effort: 3-4 hours

- **Billing audit trail missing**:
  - No permanent record of who granted credits, when, why
  - Makes support debugging difficult ("user says they paid but credits didn't appear")
  - **Recommendation:** Add `credit_history` table (see Database Design section)

- **Legacy external reference format** (`usr_<id>`) creates backwards-compat debt:
  - Used for pre-cutover subscriptions
  - Stays in production code as migration support
  - At 10x scale, support tickets for legacy format create friction
  - **Recommendation:** Set sunset date (e.g., 2026-12-31) for legacy format processing

#### **Renewal vs. Plan Change Credit Logic:**

**Current behavior (CLAUDE.md:22-27):**
- Plan change: credits carried over + added (preserved)
- Renewal: credits replaced (reset to plan default)

**Implementation correctness:** `p_is_renewal` parameter sent to RPC determines behavior. Application correctly detects event type and sets parameter.

**Risk:** If event type misdetection occurs, credits double or are lost.

**Recommendation:** Add test scenario:
```ts
it('grant credits on SUBSCRIPTION_CREATED for new subscription', ...)
it('replace credits on SUBSCRIPTION_RENEWED for renewal', ...)
it('carryover credits on plan change from monthly to pro', ...)
```

---

### 5. Identity & Security Model (7/10)

**Current State:** Clean auth boundary with Clerk integration. Rate limiting and secret rotation need hardening.

#### **Identity Flow (Correct):**

```
Clerk Token (external)
    ↓
getCurrentAppUser() validates + resolves
    ↓
Internal app user ID (domain logic uses this)
    ↓
Domain layers never use Clerk ID directly
```

**Strengths:**
- Clerk is authentication layer only (not identity source)
- Internal `users` table is single source of truth
- `user_auth_identities` maps Clerk → internal user
- All domain code uses internal app user IDs (no Clerk IDs leaked into tables)

**Verification:** Random sampling:
- `src/lib/db/sessions.ts`: Uses `session.user_id` (internal) ✓
- `src/lib/asaas/quota.ts`: Uses `userId` parameter (internal) ✓
- Webhook processors use `getOrCreateAppUser(clerkId)` (maps at boundary) ✓

#### **Security Gaps:**

1. **Missing Security Headers:**
   - No `Content-Security-Policy` header (prevents XSS)
   - No `Strict-Transport-Security` header (no HSTS)
   - No `X-Frame-Options: DENY` (no clickjacking protection)
   
   **Recommendation:** Add in Next.js middleware:
   ```ts
   res.setHeader('Content-Security-Policy', "default-src 'self'")
   res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
   res.setHeader('X-Frame-Options', 'DENY')
   ```
   Effort: 1 hour

2. **Rate Limiting Granularity:**
   - Rate limit is per-user on `/api/agent` (good)
   - But no global rate limit (someone could spam /api/session or /api/webhook endpoints)
   - **Recommendation:** Add global rate limit for endpoints without user context (webhooks, health checks)
   - Effort: 1-2 hours

3. **Webhook Verification Could Be Stronger:**
   - Asaas webhook uses `asaas-access-token` header (shared secret)
   - Better approach: HMAC signature (like Stripe/Github use)
   - **Current approach is acceptable** but document that token must be kept secret
   - Effort for upgrade: 2-3 hours

4. **Secret Rotation Not Documented:**
   - `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` are environment variables
   - No documented rotation process
   - If token leaked, no documented procedure to rotate
   - **Recommendation:** Document rotation SOP and implement alert for key exposure scans
   - Effort: 1-2 hours (docs + process)

5. **Missing Session Timeout:**
   - Clerk sessions could theoretically live indefinitely
   - No documented logout/session invalidation
   - **Recommendation:** Implement session timeout (e.g., 30 days inactivity)
   - Effort: 2-3 hours

#### **OWASP Top 10 Coverage:**

| Risk | Status | Evidence |
|------|--------|----------|
| A01 Injection | ✓ Safe | Parameterized queries via Prisma/Supabase |
| A02 Broken Auth | ⚠️ Partial | Clerk integration solid; but no session timeout |
| A03 Sensitive Data Exposure | ✓ Safe | HTTPS enforced; no secrets in response bodies |
| A04 XML External Entity | ✓ N/A | No XML parsing |
| A05 Broken Access Control | ✓ Safe | Session ownership verified on /api/session/* routes |
| A06 Security Misconfiguration | ⚠️ Partial | Missing security headers; no HSTS |
| A07 XSS | ✓ Safe | Next.js default escaping; no innerHTML |
| A08 Insecure Deserialization | ✓ Safe | No custom serialization |
| A09 Using Components with Known Vulns | ⚠️ Unknown | No SBOM or dependency scanning evident |
| A10 Insufficient Logging | ⚠️ Partial | Structured logs at tool/billing boundaries; limited at route level |

**Assessment:** 7/10 — Core auth is solid, but operational security needs hardening.

---

## Scalability & Extensibility Analysis

### Current Scalability Assessment: 6/10 (Growing Stage)

**Current Safe Load:** 1-10k users, 10-100k sessions, 1-10M messages

**10x Scale Analysis (10-100k users):**

**Bottlenecks that emerge:**
1. **Session table size**: 100M rows → full table scans slow without proper indexes
   - **Fix:** Verify composite indexes on (user_id, updated_at), add pagination
   - Effort: 2-3 hours

2. **`processed_events` unbounded growth**: 1.2M rows/year at 10k users
   - **Fix:** Partition by month or implement TTL
   - Effort: 2-3 hours + migration

3. **JSON deserialization overhead**: Parsing 100M JSONB `cvState` blobs
   - **Current:** Acceptable, monitor latency
   - **If P99 latency >500ms:** Consider column normalization (extract skills[], experience[] to separate typed tables)
   - Effort if needed: 8-16 hours

4. **Webhook processing latency**: If Asaas sends 100 webhooks/second during promotions
   - **Current:** Synchronous RPC calls in webhook handler
   - **Fix:** Move to async job queue (Bull, RabbitMQ)
   - Effort: 4-6 hours

5. **Billing RPC fallback not load-tested**: `consumeCredit()` has optimistic locking fallback
   - If RPC endpoint is down, fallback path is exercised
   - **Risk:** Fallback path may have bugs not caught in normal testing
   - **Fix:** Load test with RPC unavailable (chaos engineering)
   - Effort: 2-3 hours

**100x Scale Analysis (100k-1M users):**

Beyond 10x, you'll need:
1. **Database sharding** by user_id (CurrIA is regional, so could shard by region)
2. **Async job queues** for webhooks, file generation, email
3. **Caching layer** (Redis) for session reads (reads are 100x more frequent than writes)
4. **Message queue** for billing events (currently synchronous)

**Extensibility Roadmap:**

✅ **Can add today (2-4 hours each):**
- New tool (e.g., `analyze_salary_market`)
- New generation format (e.g., LinkedIn profile auto-fill)
- New target type (e.g., freelance vs. permanent roles)

⚠️ **Needs refactoring (4-8 hours each):**
- Tool versioning (if API changes)
- Custom field support in `cvState`
- Multi-resume sessions (currently 1 base resume per session)

🔴 **Requires architectural change (10+ hours each):**
- Real-time collaboration (multiple users editing same resume)
- Offline-first mobile app (requires sync conflict resolution)
- Custom workflows per company (user-defined tool chains)

---

## Recommended Evolution (Priority Order)

### Phase 1: Critical Fixes (Week 1)
**Do before scaling to 10k users**

1. **Fix session creation order** (1h)
   - Check credit → consume → create session
   - Test: verify session not created if credit insufficient
   - Impact: Revenue correctness

2. **Add security headers** (1h)
   - CSP, HSTS, X-Frame-Options
   - Test: verify headers present in responses
   - Impact: Security posture

3. **Verify database indexes** (2h)
   - Confirm `(user_id, updated_at)` exists on sessions
   - Confirm `(session_id, created_at DESC)` exists on messages
   - Test: query plans show index usage
   - Impact: Query performance

### Phase 2: Strategic Improvements (Week 2-3)
**Do before hitting scale limits**

4. **Implement API versioning** (4h)
   - Launch `/api/v1/` routes
   - Define deprecation policy
   - Impact: Long-term maintainability

5. **Add audit trail for billing** (3h)
   - Create `credit_history` table
   - Log all grants/consumption
   - Impact: Support debugging

6. **Standardize error responses** (3h)
   - Unified `{ success, code, error, details? }` format
   - Impact: Client consistency

7. **Switch to OpenAI streaming** (3h)
   - Stop buffering; pipe directly to SSE
   - Impact: Latency reduction

### Phase 3: Observability (Week 4+)
**Do when operational visibility becomes important**

8. **Request ID tracing** (3h)
   - Add X-Request-ID header propagation
   - Log request ID in all messages
   - Impact: Easier incident debugging

9. **Structured error aggregation** (4h)
   - Collect error codes by endpoint/tool
   - Alert on error rate spikes
   - Impact: Proactive incident detection

10. **Performance baselines** (3h)
    - Benchmark session creation, tool execution, file generation
    - Document acceptable latencies
    - Impact: Catch regressions early

---

## Risk Assessment & Failure Scenarios

### Session Creation Race Condition (MEDIUM)

**Scenario:** User submits 2 agent requests concurrently
1. Both check message count (both see 5/15 messages)
2. Both execute tools (both create message 6 and 7)
3. Both try to increment message count to 8
4. One succeeds, other fails

**Current mitigation:** `incrementMessageCount()` uses atomic RPC
**Risk:** Low, but document the atomic guarantee

### Credit Double-Spending (HIGH)

**Scenario:** Credit consumption RPC times out
1. User's request hangs waiting for RPC response
2. User resubmits
3. Both requests could consume credits (if dedup not working)

**Current mitigation:** Credit account locks (implicit in RPC)
**Risk:** Medium — not documented or tested
**Recommendation:** Add test case for this scenario

### Webhook Processing Failure (MEDIUM)

**Scenario:** Asaas sends "PAYMENT_RECEIVED" webhook
1. Webhook handler receives event
2. `grantCredit()` succeeds
3. `updateSubscription()` RPC fails
4. Handler returns 500 (Asaas will retry)
5. On retry, `grantCredit()` is skipped (already in processed_events)
6. But `updateSubscription()` still fails

**Current mitigation:** Side effects run together in single request
**Risk:** Medium — potential state inconsistency
**Recommendation:** Wrap in transaction or saga pattern (see Billing section)

---

## Conclusion

### Architecture Maturity: 7.5/10 (Late Growth Stage)

CurrIA is **well-architected** with **exceptional billing design** and **excellent database practices**. The team has thoughtfully separated concerns and built reliable foundations.

**The gap between 7.5 and 8.5/10 is:**
1. Observability (structured logging, tracing, metrics)
2. Versioning (API contracts, deprecation policy)
3. Test coverage (critical paths documented)
4. Security headers (HSTS, CSP, etc.)

**The gap between 8.5 and 9.5/10 would require:**
1. Distributed tracing (full request lifecycle visibility)
2. Chaos engineering (failure scenario testing)
3. SLO/SLI definitions (clear reliability targets)
4. Async architecture (for 100x scale)

### Production Readiness: 8/10

- ✅ Can handle 10k users confidently
- ✅ Billing reliability is high
- ⚠️ Observability needs strengthening
- ⚠️ No versioning strategy for breaking changes
- 🔴 Test infrastructure broken (58 empty test files)

### Next 12 Months Roadmap:

**Q2 2026 (Immediate):**
- Fix test infrastructure (enable regression detection)
- Add security headers
- Implement API versioning

**Q3 2026:**
- Add observability (request tracing, error aggregation)
- Implement audit trails (billing history)
- Load test at 10x scale

**Q4 2026:**
- Prepare async architecture for webhooks/file generation
- Implement caching layer for session reads
- Document scaling runbook

---

**Overall Architecture Assessment: 7.5/10 ⭐⭐⭐⭐**

**Confidence in 10x Scale:** 7/10 (needs observability work)  
**Confidence in 100x Scale:** 5/10 (needs async architecture, caching, sharding)
