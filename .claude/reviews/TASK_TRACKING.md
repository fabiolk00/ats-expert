# CurrIA Code Review - Task Tracking Dashboard

**Last Updated:** 2026-04-06  
**Overall Progress:** 0% (0/20 tasks)  
**Week 1 Progress:** 0% (0/5 tasks)  
**Estimated Completion:** 2026-04-24

---

## WEEK 1: CRITICAL FOUNDATION (9.5 hours) 🔴

### ☐ Task 1: Fix Vitest Configuration
**Priority:** CRITICAL (BLOCKER)  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2-4h | **Actual:** --  
**Due Date:** 2026-04-07

**Checklist:**
- [ ] Diagnose Vitest issue
- [ ] Verify/create vitest.config.ts
- [ ] Fix ESM/CJS mismatch
- [ ] Run `npm test` successfully
- [ ] 50+ tests discover and pass
- [ ] CI pipeline shows test execution

**Blocker Status:** 🔴 BLOCKS Tasks 3, 6-11

---

### ☐ Task 2: Add File Upload Size Limit
**Priority:** CRITICAL (SECURITY)  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 0.5h | **Actual:** --  
**Due Date:** 2026-04-07

**Checklist:**
- [ ] Update Zod schema in `/api/agent/route.ts`
- [ ] Add `.max(50_000_000)` to file field
- [ ] Test with oversized file (expect 400)
- [ ] Add unit test
- [ ] Verify error message

**Depends On:** None (can run in parallel with Task 1)

---

### ☐ Task 3: Create Test Validation Suite
**Priority:** HIGH (REGRESSION PREVENTION)  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 1h | **Actual:** --  
**Due Date:** 2026-04-08

**Checklist:**
- [ ] Create `src/test-validation.test.ts`
- [ ] Add 9+ validation test cases
- [ ] Verify all tests pass
- [ ] Add to CI pipeline
- [ ] Document test purpose

**Depends On:** Task 1 (Vitest must be working)

---

### ☐ Task 4: Fix Session Creation Order Bug
**Priority:** CRITICAL (REVENUE)  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2-3h | **Actual:** --  
**Due Date:** 2026-04-08

**Checklist:**
- [ ] Create credit check helper
- [ ] Update `/api/agent/route.ts` to check credit first
- [ ] Return 402 if insufficient credits
- [ ] Add integration tests
- [ ] Verify session not created on credit fail
- [ ] Test idempotency (retry doesn't double-charge)

**Depends On:** Task 10 (preferred) or can do in parallel

---

### ☐ Task 5: Add Security Headers
**Priority:** HIGH (SECURITY)  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 1h | **Actual:** --  
**Due Date:** 2026-04-07

**Checklist:**
- [ ] Create `src/middleware.ts`
- [ ] Add CSP header
- [ ] Add HSTS header (31536000s)
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Verify headers in browser DevTools
- [ ] Test for functional regressions

**Depends On:** None (can run in parallel)

---

## WEEK 1 SUMMARY

**Total Effort:** 9.5 hours  
**Critical Blockers:** Task 1 (Vitest)  
**Parallel Opportunities:**
- Tasks 1, 2, 4, 5 can start simultaneously
- Task 3 waits for Task 1
- Task 7 (Week 2) waits for Task 6

**Success Criteria for Week 1:**
- ✅ Tests running (50+ tests discover and pass)
- ✅ File upload DoS prevented
- ✅ Credit consumption order fixed
- ✅ Security headers deployed
- ✅ Zero critical issues remaining

---

## WEEK 2-3: HIGH PRIORITY (18 hours) 🟡

### ☐ Task 6: Extract URL Detection Module
**Priority:** HIGH  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-11

**Checklist:**
- [ ] Create `src/lib/agent/url-detection.ts`
- [ ] Extract `detectTargetJobDescription()` from route.ts
- [ ] Extract sanitization helpers
- [ ] Add unit tests for detection logic
- [ ] Document heuristic scoring

**Depends On:** Task 1 (tests must be working)

---

### ☐ Task 7: Refactor /api/agent Route
**Priority:** HIGH  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 6h | **Actual:** --  
**Due Date:** 2026-04-15

**Checklist:**
- [ ] Create `src/lib/agent/session-lifecycle.ts`
- [ ] Create `src/lib/agent/file-attachment.ts`
- [ ] Move helpers from route.ts (690 → 400 lines)
- [ ] Add unit tests for extracted functions
- [ ] Verify route still works end-to-end
- [ ] No functional regression

**Depends On:** Task 6 (URL detection extraction)

---

### ☐ Task 8: Add Billing Validation Guards
**Priority:** HIGH  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-11

**Checklist:**
- [ ] Create `validateBillingStateTransition()` function
- [ ] Test carryover on plan change
- [ ] Test replacement on renewal
- [ ] Add 40+ billing test cases
- [ ] Verify no double-spend scenarios
- [ ] Test credit carryover logic

**Depends On:** None (can start Week 1)

---

### ☐ Task 9: Add Missing Database Indexes
**Priority:** HIGH  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2h | **Actual:** --  
**Due Date:** 2026-04-11

**Checklist:**
- [ ] Create index: `sessions(user_id, updated_at DESC)`
- [ ] Create index: `messages(session_id, created_at DESC)`
- [ ] Test query plans show index usage
- [ ] Verify no performance regression
- [ ] Document index rationale

**Depends On:** None (database work independent)

---

### ☐ Task 10: Implement Credit Check Helper
**Priority:** HIGH  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 1h | **Actual:** --  
**Due Date:** 2026-04-09

**Checklist:**
- [ ] Create `src/lib/asaas/credit-check.ts`
- [ ] Implement `checkCreditAvailability(userId)`
- [ ] Return: { available, remaining, required }
- [ ] Add unit tests
- [ ] Used by Task 4 and other routes

**Depends On:** None (prerequisite for Task 4 usage)

---

### ☐ Task 11: Document Job Detection Heuristic
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2h | **Actual:** --  
**Due Date:** 2026-04-13

**Checklist:**
- [ ] Create `docs/job-description-detection.md`
- [ ] Document algorithm stages
- [ ] Document keyword scoring values
- [ ] Document confidence formula
- [ ] Add tuning guide for false positives
- [ ] Reference code in comments

**Depends On:** Task 6 (after extraction)

---

## WEEK 2-3 SUMMARY

**Total Effort:** 18 hours  
**Parallel Groups:**
- Group A (Week 2): Tasks 6, 8, 9, 10 (can start after Task 1)
- Group B (Week 3): Task 7 (after Task 6), Task 11 (after Task 6)

**Success Criteria:**
- ✅ `/api/agent` route reduced to ~400 lines
- ✅ 40+ billing test cases added
- ✅ All database indexes created
- ✅ Job detection heuristic documented

---

## WEEK 4+: QUALITY & OBSERVABILITY (20-25 hours) 🟠

### ☐ Task 12: Standardize Error Responses
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2h | **Actual:** --  
**Due Date:** 2026-04-18

Standardize all routes to return: `{ success, code, error, details? }`

---

### ☐ Task 13: Implement API Versioning
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 4h | **Actual:** --  
**Due Date:** 2026-04-20

Create `/api/v1/` routes with deprecation policy.

---

### ☐ Task 14: Add Billing Audit Trail Table
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-18

Immutable logging of all credit grants/consumption.

---

### ☐ Task 15: Add Rate Limit Headers
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 1h | **Actual:** --  
**Due Date:** 2026-04-16

X-RateLimit headers in responses.

---

### ☐ Task 16: Implement Webhook Transaction Wrapper
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-20

Atomic billing webhook processing.

---

### ☐ Task 17: Add Processed Events TTL
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 2h | **Actual:** --  
**Due Date:** 2026-04-18

Prevent unbounded growth of processed_events table.

---

### ☐ Task 18: Add Request Tracing
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-20

X-Request-ID propagation and logging.

---

### ☐ Task 19: Add Performance Baselines
**Priority:** MEDIUM  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 3h | **Actual:** --  
**Due Date:** 2026-04-22

Document and monitor latency baselines.

---

### ☐ Task 20: Create Rollout Checklist
**Priority:** LOW  
**Status:** ⏸️ Not Started  
**Owner:** [Assign]  
**Effort:** 1h | **Actual:** --  
**Due Date:** 2026-04-24

Pre-deployment verification procedures.

---

## OVERALL PROGRESS

```
Week 1:  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (0/5)
Week 2-3:[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (0/6)
Week 4+ :[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (0/9)
─────────────────────────────────────────────────────────────
TOTAL:  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (0/20)
```

---

## EFFORT TRACKING

| Phase | Planned | Actual | Variance |
|-------|---------|--------|----------|
| Week 1 | 9.5h | -- | -- |
| Week 2-3 | 18h | -- | -- |
| Week 4+ | 20-25h | -- | -- |
| **TOTAL** | **47.5-52.5h** | **--** | **--** |

---

## RISK LOG

| Risk | Status | Mitigation | Assigned |
|------|--------|-----------|----------|
| Vitest cannot be fixed | 🟢 LOW | Prepare Jest fallback | -- |
| Route refactoring breaks | 🟢 LOW | Comprehensive tests | -- |
| DB index locks table | 🟢 LOW | Use CONCURRENT flag | -- |
| Credit logic regression | 🟢 LOW | 40+ test cases | -- |

---

## NOTES & BLOCKERS

- **2026-04-06:** Execution plan created, all tasks ready for assignment
- **Next:** Assign Task 1 (Vitest fix) as highest priority

---

## Quick Links

- [Full Execution Plan](./EXECUTION_PLAN.md)
- [Code Review Executive Summary](./EXECUTIVE_SUMMARY.md)
- [Staff Engineer Review](./staff-engineer-code-quality-review.md)
- [Architecture Engineer Review](./architecture-engineer-system-design-review.md)

---

**Dashboard Created:** 2026-04-06  
**Last Updated:** 2026-04-06  
**Next Update:** When first task starts
