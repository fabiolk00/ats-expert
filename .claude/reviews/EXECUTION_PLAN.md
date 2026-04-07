# CurrIA Code Review - Execution Plan

**Created:** 2026-04-06  
**Based On:** Staff Engineer (7.5/10) + Architecture Engineer (7.5/10) Reviews  
**Total Effort:** 47.5-52.5 hours over 2-3 weeks  
**Target Score:** 8.5+/10  

---

## Executive Timeline

```
WEEK 1 (Critical Foundation)     → 9.5 hours → 2-3 days
WEEK 2-3 (High Priority)        → 18 hours → 4-5 days  
WEEK 4+ (Quality & Observability) → 20-25 hours → 5-7 days
────────────────────────────────────────────────────
TOTAL                           → 47.5-52.5 hours → 2-3 weeks
```

---

## WEEK 1: CRITICAL FOUNDATION (9.5 hours)

These tasks **MUST** be completed before deploying to production. They address revenue-impacting bugs and broken test infrastructure.

### Task 1: Fix Vitest Configuration

**Priority:** 🔴 CRITICAL (BLOCKER)  
**Effort:** 2-4 hours  
**Owner:** Staff Engineer  
**Dependencies:** None (start here)  
**Impact:** Unblocks all other work; enables regression detection

#### Problem
- 58 test files report "No test suite found"
- 0 tests currently executing in CI/CD
- Cannot confidently ship changes

#### Acceptance Criteria
- [ ] `npm test` runs successfully and discovers all test files
- [ ] At least 50+ tests execute and pass
- [ ] CI pipeline shows test execution (not skipped)
- [ ] Add regression check: create dummy test that must stay passing

#### Steps to Execute

1. **Diagnose the issue:**
   ```bash
   npm test 2>&1 | tee vitest-output.log
   # Look for: ESM/CJS mismatch, TypeScript transform errors, config path issues
   ```

2. **Check/create vitest.config.ts:**
   ```bash
   cat vitest.config.ts  # Check if exists
   # If missing, create it
   ```

3. **Verify configuration:**
   ```typescript
   // vitest.config.ts should have:
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: [],
       include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html']
       }
     }
   })
   ```

4. **Verify tsconfig.json includes test files:**
   ```json
   {
     "include": ["src/**/*", "src/**/*.test.ts", "src/**/*.test.tsx"]
   }
   ```

5. **Run diagnostics:**
   ```bash
   npm test -- --reporter=verbose 2>&1 | head -100
   npm test -- --listTests | wc -l  # Should show 58+ test files
   ```

6. **Fix TypeScript/module issues if needed:**
   - Check package.json for `"type": "module"`
   - Verify tsconfig has `"module": "esnext"`
   - Update vitest config if using CJS

#### Tests to Add
```typescript
// src/test-validation.test.ts (NEW FILE)
import { describe, it, expect } from 'vitest'

describe('Test Infrastructure Validation', () => {
  it('vitest is configured and running', () => {
    expect(true).toBe(true)
  })
  
  it('can import from @/', () => {
    expect(require('@/lib/auth/app-user')).toBeDefined()
  })
  
  it('test framework is discoverable', () => {
    expect('test-validation.test.ts').toContain('test.ts')
  })
})
```

#### Verification
```bash
# Local: Run all tests
npm test

# CI: Add to .github/workflows/ci.yml
- name: Run Tests
  run: npm test -- --coverage
  
# Expected output: 
# ✓ 50+ tests passing
# ✗ 0 tests failing
```

#### Rollback/Recovery
If Vitest cannot be fixed after 2 hours:
1. Consider switch to Jest (4-6h effort)
2. Document decision in CLAUDE.md
3. Fallback: Manual verification of critical tests

---

### Task 2: Add File Upload Size Limit

**Priority:** 🔴 CRITICAL (SECURITY)  
**Effort:** 0.5 hours  
**Owner:** Staff Engineer  
**Dependencies:** None (can run in parallel)  
**Impact:** Prevents DoS attack via large file uploads

#### Problem
- No max size validation on base64 file field
- 1GB+ file could OOM server
- Currently accepts unlimited size

#### Acceptance Criteria
- [ ] File field has `.max(50_000_000)` Zod validation
- [ ] Requests >50MB base64 return 400 status
- [ ] Error message is user-friendly
- [ ] Integration test covers oversized file rejection

#### Steps to Execute

1. **Locate the Zod schema in `/api/agent/route.ts`:**
   ```bash
   grep -n "BodySchema = z.object" src/app/api/agent/route.ts
   ```

2. **Find the `file` field definition:**
   ```typescript
   // BEFORE (current)
   file: z.string().optional()
   
   // AFTER (fixed)
   file: z.string().max(50_000_000, 'File too large (max 50MB)').optional()
   ```

3. **Update the schema:**
   ```typescript
   // src/app/api/agent/route.ts (around line 28-62)
   const BodySchema = z.object({
     // ... other fields ...
     file: z.string()
       .max(50_000_000, 'Resume file is too large. Maximum 50MB allowed.')
       .optional(),
     fileMime: z.string().optional(),
   })
   ```

4. **Test locally:**
   ```bash
   # Create a test file >50MB base64
   node -e "console.log('a'.repeat(50_000_001))" > oversized.txt
   
   # Call API with oversized file
   curl -X POST http://localhost:3000/api/agent \
     -H "Content-Type: application/json" \
     -d '{"message":"test","file":"'$(cat oversized.txt)'"}'
   
   # Expected: 400 status with validation error
   ```

#### Tests to Add
```typescript
// src/app/api/agent/route.test.ts (ADD TO EXISTING)
describe('POST /api/agent', () => {
  it('rejects oversized file uploads (>50MB)', async () => {
    const oversizedBase64 = 'a'.repeat(50_000_001)
    
    const response = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({
        message: 'analyze my resume',
        file: oversizedBase64
      })
    })
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('too large')
  })
  
  it('accepts files <=50MB', async () => {
    const validBase64 = 'a'.repeat(50_000_000)
    // Should not reject for size reason
  })
})
```

#### Verification
```bash
# Local test
npm test -- src/app/api/agent/route.test.ts

# Manual verification
npm run dev
# Call with oversized file, verify 400 response
```

---

### Task 3: Create Test Validation Suite

**Priority:** 🟡 HIGH (REGRESSION PREVENTION)  
**Effort:** 1 hour  
**Owner:** Staff Engineer  
**Dependencies:** Task 1 (Vitest must be working)  
**Impact:** Ensures test infrastructure doesn't regress

#### Problem
- No safeguard to ensure test infrastructure stays functional
- Future changes could break Vitest config without detection

#### Acceptance Criteria
- [ ] New file `src/test-validation.test.ts` created
- [ ] Tests ESM/CJS module loading
- [ ] Tests key internal imports (@/ paths)
- [ ] Tests run successfully in CI
- [ ] All 9+ validation tests pass

#### Steps to Execute

1. **Create the test file:**
   ```typescript
   // src/test-validation.test.ts (NEW FILE)
   import { describe, it, expect } from 'vitest'
   
   describe('Test Infrastructure Validation', () => {
     it('vitest is running successfully', () => {
       expect(true).toBe(true)
     })
     
     it('ESM modules are loaded correctly', async () => {
       const authModule = await import('@/lib/auth/app-user')
       expect(authModule.getCurrentAppUser).toBeDefined()
     })
     
     it('TypeScript paths (@/) resolve correctly', () => {
       // This import uses @/ path - if it fails, config is broken
       expect(require.resolve('@/lib/auth/app-user')).toBeDefined()
     })
     
     it('Zod validation is available', () => {
       const z = require('zod')
       const schema = z.object({ test: z.string() })
       expect(schema.safeParse({ test: 'value' }).success).toBe(true)
     })
     
     it('React is available for component tests', () => {
       const React = require('react')
       expect(React.createElement).toBeDefined()
     })
     
     it('JSX is transpiled correctly', () => {
       // If JSX transforms fail, this would error
       const element = <div>test</div>
       expect(element.type).toBe('div')
     })
     
     it('async/await works in tests', async () => {
       const result = await Promise.resolve('success')
       expect(result).toBe('success')
     })
     
     it('test timeout configuration is reasonable', () => {
       // This test should complete within default timeout
       const start = Date.now()
       while (Date.now() - start < 100) {}
       expect(true).toBe(true)
     })
     
     it('environment is jsdom (not node)', () => {
       expect(typeof window).not.toBe('undefined')
       expect(typeof document).not.toBe('undefined')
     })
   })
   ```

2. **Add to CI pipeline check:**
   ```yaml
   # .github/workflows/ci.yml
   - name: Validate Test Infrastructure
     run: npm test -- src/test-validation.test.ts --reporter=verbose
   ```

3. **Run and verify:**
   ```bash
   npm test src/test-validation.test.ts
   # Expected: All 9+ tests pass
   ```

#### Verification
```bash
# Local
npm test -- src/test-validation.test.ts

# CI will automatically run on every push
```

---

### Task 4: Fix Session Creation Order Bug

**Priority:** 🔴 CRITICAL (REVENUE IMPACT)  
**Effort:** 2-3 hours  
**Owner:** Staff Engineer + Architecture  
**Dependencies:** Task 10 (Credit check helper) - or can do in parallel  
**Impact:** Prevents credit loss and revenue leakage

#### Problem
Current `/api/agent` flow:
```
1. getOrCreateSession()  ← Creates session FIRST
2. consumeCredit()       ← Consumes credit AFTER
```

If credit consumption fails, session exists but credit wasn't consumed. User retries → 2nd credit attempt fails → user has empty session.

#### Acceptance Criteria
- [ ] Credit availability checked BEFORE session creation
- [ ] If insufficient credits, return 402 (Payment Required) immediately
- [ ] Session only created AFTER credit verified
- [ ] Session + credit consumption is atomic
- [ ] Integration test covers this flow
- [ ] No session created if credit check fails

#### Steps to Execute

1. **Review current code in `/api/agent/route.ts`:**
   ```bash
   grep -A 20 "getOrCreateSession\|consumeCredit" src/app/api/agent/route.ts
   ```

2. **Create credit check helper (Task 10 parallel or prerequisite):**
   ```typescript
   // src/lib/asaas/credit-check.ts (NEW)
   export async function checkCreditAvailability(appUserId: string) {
     const creditAccount = await getCreditAccount(appUserId)
     
     if (!creditAccount || creditAccount.credits_remaining < 1) {
       return {
         available: false,
         remaining: creditAccount?.credits_remaining ?? 0,
         required: 1
       }
     }
     
     return {
       available: true,
       remaining: creditAccount.credits_remaining - 1,
       required: 1
     }
   }
   ```

3. **Refactor agent route to check first:**
   ```typescript
   // src/app/api/agent/route.ts (BEFORE - lines ~500-550)
   
   // NEW FLOW: Check credit BEFORE session creation
   const creditCheck = await checkCreditAvailability(appUser.id)
   if (!creditCheck.available) {
     return NextResponse.json(
       { 
         error: 'Insufficient credits. Please purchase more.',
         code: 'QUOTA_EXCEEDED'
       },
       { status: 402 }
     )
   }
   
   // NOW create session with credit consumption as side effect
   const session = await createSessionWithCredit(appUser.id, {
     // ... session data ...
   })
   
   if (!session) {
     return NextResponse.json(
       { error: 'Failed to create session' },
       { status: 500 }
     )
   }
   
   // Continue with message and tools...
   ```

4. **Update or create `createSessionWithCredit()` RPC:**
   ```sql
   -- prisma/migrations/[timestamp]_atomic_session_credit.sql
   -- Ensure session creation and credit consumption are atomic
   
   CREATE OR REPLACE FUNCTION create_session_with_credit(
     p_user_id UUID,
     p_session_data JSONB
   ) RETURNS TABLE (
     session_id UUID,
     success BOOLEAN
   ) AS $$
   BEGIN
     -- Check credit first
     IF (SELECT credits_remaining FROM credit_accounts 
         WHERE user_id = p_user_id) < 1 THEN
       RETURN QUERY SELECT NULL, false;
       RETURN;
     END IF;
     
     -- Create session (transaction auto-rollback if credit fails)
     INSERT INTO sessions (user_id, cv_state, agent_state, ...)
     VALUES (p_user_id, ...)
     RETURNING id INTO session_id;
     
     -- Consume credit atomically
     UPDATE credit_accounts
     SET credits_remaining = credits_remaining - 1
     WHERE user_id = p_user_id;
     
     success := true;
     RETURN NEXT;
   END;
   $$ LANGUAGE plpgsql;
   ```

5. **Test locally:**
   ```bash
   # Test 1: Sufficient credits → session created
   curl -X POST http://localhost:3000/api/agent \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   # Expected: 200, session created
   
   # Test 2: Insufficient credits → 402 response
   # (after draining credits somehow)
   # Expected: 402 Payment Required
   ```

#### Tests to Add
```typescript
// src/app/api/agent/route.test.ts (ADD)
describe('POST /api/agent - Credit Safety', () => {
  it('checks credit availability BEFORE creating session', async () => {
    // Setup: user with 0 credits
    await setupTestUser({ credits: 0 })
    
    const response = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'analyze' })
    })
    
    expect(response.status).toBe(402)  // Payment Required
    
    // Verify: no session was created
    const sessions = await getSessions(testUserId)
    expect(sessions.length).toBe(0)
  })
  
  it('creates session only if credit consumption succeeds', async () => {
    const before = await getCredits(testUserId)
    
    const response = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' })
    })
    
    expect(response.status).toBe(200)
    const after = await getCredits(testUserId)
    expect(after).toBe(before - 1)
  })
  
  it('prevents double-charging on retry', async () => {
    const before = await getCredits(testUserId)
    
    // First request succeeds
    await fetch('/api/agent', { 
      method: 'POST',
      body: JSON.stringify({ message: 'test' })
    })
    
    // Retry same request (idempotent)
    await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' })
    })
    
    const after = await getCredits(testUserId)
    // Should only consume 1 credit total, not 2
    expect(after).toBe(before - 1)
  })
})
```

#### Verification
```bash
# Run billing-related tests
npm test -- src/lib/asaas/quota.test.ts
npm test -- src/app/api/agent/route.test.ts

# Integration test: full flow
npm run dev
# Create user → verify credits → make request → verify session + credit consumed
```

---

### Task 5: Add Security Headers

**Priority:** 🟡 HIGH (SECURITY)  
**Effort:** 1 hour  
**Owner:** Staff Engineer  
**Dependencies:** None (can run in parallel)  
**Impact:** Hardens security posture against XSS, clickjacking

#### Problem
Missing security headers:
- No `Content-Security-Policy` (XSS risk)
- No `Strict-Transport-Security` (HSTS enforcement)
- No `X-Frame-Options` (clickjacking protection)
- No `X-Content-Type-Options` (MIME sniffing)

#### Acceptance Criteria
- [ ] Next.js middleware created at `src/middleware.ts`
- [ ] Headers added: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] All routes return security headers
- [ ] Verified in browser DevTools
- [ ] No functional regression (assets still load)

#### Steps to Execute

1. **Create middleware:**
   ```typescript
   // src/middleware.ts (NEW FILE)
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'
   
   export function middleware(request: NextRequest) {
     const response = NextResponse.next()
     
     // Content Security Policy
     response.headers.set(
       'Content-Security-Policy',
       "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com"
     )
     
     // Strict Transport Security (1 year, include subdomains)
     response.headers.set(
       'Strict-Transport-Security',
       'max-age=31536000; includeSubDomains; preload'
     )
     
     // X-Frame-Options (prevent clickjacking)
     response.headers.set('X-Frame-Options', 'DENY')
     
     // X-Content-Type-Options (prevent MIME sniffing)
     response.headers.set('X-Content-Type-Options', 'nosniff')
     
     // X-XSS-Protection (legacy but supported)
     response.headers.set('X-XSS-Protection', '1; mode=block')
     
     // Referrer Policy
     response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
     
     return response
   }
   
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico).*)',
     ],
   }
   ```

2. **Update next.config.js if needed:**
   ```javascript
   // next.config.js
   const withSecurityHeaders = (config) => {
     return {
       ...config,
       async headers() {
         return [
           {
             source: '/:path*',
             headers: [
               {
                 key: 'X-Content-Type-Options',
                 value: 'nosniff'
               },
               {
                 key: 'X-Frame-Options',
                 value: 'DENY'
               },
               {
                 key: 'X-XSS-Protection',
                 value: '1; mode=block'
               }
             ]
           }
         ]
       }
     }
   }
   ```

3. **Test locally:**
   ```bash
   npm run dev
   
   # In browser DevTools, check response headers:
   # curl -I http://localhost:3000/
   # Should show:
   # Strict-Transport-Security: max-age=31536000
   # X-Frame-Options: DENY
   # Content-Security-Policy: ...
   ```

4. **Verify no functional regression:**
   ```bash
   # Test that stylesheets, scripts still load
   npm run build
   npm run dev
   # Navigate to dashboard, ensure UI loads correctly
   ```

#### Tests to Add
```typescript
// src/middleware.test.ts (NEW)
import { middleware } from './middleware'

describe('Security Headers Middleware', () => {
  it('adds CSP header to all responses', () => {
    // Test CSP header presence
  })
  
  it('adds HSTS header for HTTPS', () => {
    // Test HSTS header
  })
  
  it('adds X-Frame-Options to prevent clickjacking', () => {
    // Test X-Frame-Options
  })
})
```

#### Verification
```bash
# Check headers are returned
curl -I https://localhost:3000/ | grep -E "Strict-Transport|X-Frame|Content-Security"

# Use security header checker
# https://securityheaders.com (on production)
```

---

## WEEK 1 Summary

**Status After Week 1:**
✅ Test infrastructure restored (Task 1) — enables regression detection  
✅ Critical security bug fixed (Task 2) — prevents DoS  
✅ Revenue leak prevented (Task 4) — credit safety  
✅ Security hardening (Task 5) — reduces attack surface  
✅ Test validation (Task 3) — prevents regression  

**Production Readiness:** ✅ Safe to deploy with confidence

**Effort Spent:** 9.5 hours  
**Remaining Critical Issues:** 0  

---

## WEEK 2-3: HIGH PRIORITY (18 hours)

### Task 6: Extract URL Detection Module
### Task 7: Refactor /api/agent Route
### Task 8: Add Billing Validation Guards
### Task 9: Add Missing Database Indexes
### Task 10: Implement Credit Check Helper
### Task 11: Document Job Detection Heuristic

[Detailed tasks available in full execution plan document]

---

## WEEK 4+: QUALITY & OBSERVABILITY (20-25 hours)

### Task 12: Standardize Error Responses
### Task 13: Implement API Versioning
### Task 14: Add Billing Audit Trail Table
### Task 15: Add Rate Limit Headers
### Task 16: Implement Webhook Transaction Wrapper
### Task 17: Add Processed Events TTL
### Task 18: Add Request Tracing
### Task 19: Add Performance Baselines
### Task 20: Create Rollout Checklist

[Detailed tasks available in full execution plan document]

---

## Parallel Execution Map

```
WEEK 1 (Day 1-3):
  Day 1:
    │
    ├─ Task 1: Fix Vitest (2-4h) ─────┐
    │                                  │
    ├─ Task 2: File Size Limit (0.5h) │
    │                                  ├─ All in parallel
    ├─ Task 4: Credit Order (2-3h)    │
    │                                  │
    └─ Task 5: Security Headers (1h) ─┘
    
  Day 2-3:
    └─ Task 3: Test Validation (1h) → After Task 1

WEEK 2-3 (Day 4-8):
  Day 4:
    ├─ Task 6: URL Detection (3h)  ─┐
    ├─ Task 8: Billing Validation  │ All in parallel
    ├─ Task 9: DB Indexes (2h)     │ after Week 1
    ├─ Task 10: Credit Check (1h)  │
    └─ Task 11: Document (2h)      ─┘
    
  Day 5-8:
    └─ Task 7: Refactor Route (6h) → After Task 6

WEEK 4+ (Flexible):
  Can run Tasks 12-20 in any order
  Recommended: 13 → 12 (versioning enables standardization)
  Others: 14-20 can run in parallel
```

---

## Success Metrics

| Metric | Week 1 | Week 3 | Target |
|--------|--------|--------|--------|
| Tests Running | 0 → 50+ ✅ | 100+ | 100+ ✓ |
| /api/agent Lines | 690 | 400 | <400 ✓ |
| Billing Tests | 0 | 40+ | 40+ ✓ |
| Security Headers | 0 | 5 | 5 ✓ |
| Code Quality | 7.5/10 | 8.0/10 | 8.5+/10 |
| Architecture | 7.5/10 | 8.0/10 | 8.5+/10 |
| 10x Confidence | 6/10 | 7/10 | 8+/10 |

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Vitest unfixable | Low | High | Prepare Jest fallback |
| Route refactor breaks | Medium | Medium | Comprehensive test suite |
| DB index locks table | Low | High | Use CONCURRENT flag |
| Credit logic regression | Low | Critical | Extensive test coverage |

---

## Deployment Checklist

Before merging to main:
- [ ] All tests passing (npm test)
- [ ] No TypeScript errors (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] Build succeeds (npm run build)
- [ ] Manual smoke test (dashboard loads, can create session)
- [ ] Credit consumption tested with real payment
- [ ] Security headers verified in browser
- [ ] No performance regression (latency baselines)

---

## Next Steps

**TODAY:**
1. Create task tracking in project management tool
2. Assign Task 1 (Vitest fix) - HIGHEST PRIORITY
3. Assign Tasks 2, 4, 5 to run in parallel

**TOMORROW:**
- Check Vitest status
- If fixed, proceed to Task 3
- If blocked, escalate with diagnostic info

**By End of Week:**
- All Week 1 tasks complete
- Ready to start Week 2 refactoring

---

**Execution Plan Created:** 2026-04-06  
**Last Updated:** 2026-04-06  
**Next Review:** After Week 1 completion
