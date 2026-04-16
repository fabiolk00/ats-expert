---
phase: 37
slug: freeze-async-execution-contracts-and-durable-job-foundations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.6.1 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run typecheck && npx vitest run src/lib/jobs/contracts.test.ts src/lib/jobs/repository.test.ts src/lib/jobs/source-of-truth.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck && npx vitest run src/lib/jobs/contracts.test.ts src/lib/jobs/repository.test.ts src/lib/jobs/source-of-truth.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | JOB-01 | T-37-01 / T-37-03 | Shared job contracts expose explicit type, status, stage, progress, and typed terminal refs without turning job rows into canonical resume truth. | unit | `npx vitest run src/lib/jobs/contracts.test.ts src/lib/jobs/source-of-truth.test.ts` | ❌ W0 | ⬜ pending |
| 37-01-02 | 01 | 1 | JOB-01 | T-37-02 | Durable job repository claims, reclaims, and terminal writes are ownership-fenced and retry-safe. | unit | `npx vitest run src/lib/jobs/repository.test.ts` | ❌ W0 | ⬜ pending |
| 37-01-03 | 01 | 1 | JOB-01 | T-37-02 | Live database schema is updated after schema edits so verification does not stop at type-only false positives. | smoke | `npx prisma db push` | ✅ | ⬜ pending |
| 37-01-04 | 01 | 1 | JOB-01 | T-37-01 / T-37-02 / T-37-03 | Contract, repository, and source-selection regressions stay covered together before the phase is considered complete. | integration | `npm run typecheck && npx vitest run src/lib/jobs/contracts.test.ts src/lib/jobs/repository.test.ts src/lib/jobs/source-of-truth.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/jobs/contracts.test.ts` — covers shared `AgentActionType`, `ExecutionMode`, `JobType`, `JobStatus`, and typed input/result/error refs.
- [ ] `src/lib/jobs/repository.test.ts` — covers create/read/claim/reclaim/complete/fail/cancel transitions and `claimed_at` fencing.
- [ ] `src/lib/jobs/source-of-truth.test.ts` — covers `optimizedCvState ?? cvState` source selection and artifact snapshot/result ref construction.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confirm the pushed database now contains the generic `jobs` table expected by the app environment. | JOB-01 | Requires the real configured `DATABASE_URL` / Supabase-backed database target used during execution. | Run `npx prisma db push`, then inspect the target database or Prisma introspection output to confirm the `jobs` table and its lifecycle columns exist. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
