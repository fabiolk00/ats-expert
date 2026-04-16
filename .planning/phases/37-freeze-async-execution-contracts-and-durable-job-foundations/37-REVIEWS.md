# Phase 37 Cross-AI Reviews

**Reviewed:** 2026-04-16
**Phase:** 37 - Freeze async execution contracts and durable job foundations
**Review pass:** 2
**Review basis:** rerun after plan/validation fixes from commit `b3108b0`
**Plans reviewed:** `37-01-PLAN.md`

## Reviewer Availability

| Reviewer | Status | Notes |
|----------|--------|-------|
| `claude` | Blocked | CLI is installed, but review execution failed with: `Your organization does not have access to Claude. Please login again or contact your administrator.` |
| `codex` | Completed | Review completed in read-only mode against the updated phase docs. |
| `gemini` | Not available | CLI not installed on this machine. |
| `coderabbit` | Not available | CLI not installed on this machine. |
| `opencode` | Not available | CLI not installed on this machine. |

## Consensus Summary

Only one reviewer completed, so there is no multi-reviewer consensus to compute.

The rerun materially improved the Phase 37 plan. The reviewer explicitly judged these earlier concerns as resolved:

1. Sync-vs-async action classification is now frozen clearly enough for Phase 38.
2. User-scoped job reads and their verification are now present in the plan.
3. A canonical persisted status-read DTO is now part of the frozen contract.

Two issues still remain before execution:

1. `idempotencyKey` is still optional, which means duplicate durable-job dispatch is still contractually allowed if a later phase omits it.
2. The blocking schema verification still proves `prisma db push`, but not that the committed migration artifact itself applies cleanly or stays aligned with `schema.prisma`.

## Codex Review

## Findings
1. **High - Async-job idempotency is still optional, so duplicate dispatch remains contractually allowed**  
Why it matters: The revised plan adds an idempotency key and dedupe path, but it still models `idempotencyKey` as optional on the shared dispatch contract and on persisted jobs. That means later Phase 38/39 implementations can legally omit the key, bypass the unique partial index on `NULL`, and reintroduce duplicate ATS/targeting/artifact jobs under retries or repeated submits. For a contract-freeze phase, that is still too loose.  
Files: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-01-PLAN.md:29,32,133,150`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-VALIDATION.md:41,42,52,53,62`

2. **Medium - Verification checks `db push`, but does not prove the committed migration path actually works**  
Why it matters: Task 2 creates a SQL migration file, but Task 3 and the validation contract only require `npx prisma db push`. That can leave the live schema working locally while the committed migration artifact is unverified or drifted from `schema.prisma`, which is the kind of sequencing gap that can break later phases or fresh environments.  
Files: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-01-PLAN.md:148,150,167,170,173`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-VALIDATION.md:43,62`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-RESEARCH.md:84`

## Open Questions

1. Should Phase 37 require a non-null `idempotencyKey` for every durable job creation path, or explicitly document the only allowed exception if one exists?
2. Should the blocking schema verification exercise the committed migration artifact, instead of only proving `schema.prisma` can be pushed?

## Verdict

**Not ready for execution**

The earlier findings on sync-vs-async classification, user-scoped job reads, and the canonical status-read DTO look resolved in the revised plan. Idempotency is improved but not fully frozen because the key is still optional, and the migration verification path is still too weak for a contract-foundation phase.
