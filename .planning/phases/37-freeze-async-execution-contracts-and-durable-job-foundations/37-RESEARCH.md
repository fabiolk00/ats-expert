# Phase 37: Freeze async execution contracts and durable job foundations - Research

**Researched:** 2026-04-16
**Domain:** Durable async execution contracts, DB-backed job lifecycle modeling, and source-of-truth boundaries for the CurrIA agent runtime
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Job persistence model
- **D-01:** Use one generic durable `jobs` persistence model for async execution rather than separate ATS, targeting, and artifact job tables.
- **D-02:** The shared job model must carry explicit typed lifecycle fields for `type`, `status`, `stage`, `progress`, timestamps, and terminal result or error references so every heavy flow can be tracked through one contract.
- **D-03:** Keep per-job business payload details behind referenced metadata fields or JSON refs instead of fragmenting the persistence contract into workflow-specific schemas during this phase.

### Status delivery contract
- **D-04:** Make durable job status reads the canonical source of truth for queued, running, completed, failed, and reserved cancelled states.
- **D-05:** SSE remains a transport for lightweight acknowledgments and status events, but downstream phases should not treat SSE as the authoritative execution record.
- **D-06:** Phase 37 should freeze status vocabulary and shape so later UI, polling, and SSE work can all read from the same persisted job contract.

### Dispatch and runtime boundary
- **D-07:** Freeze a same-app, DB-backed dispatch contract and runner foundation first; do not introduce BullMQ or another external queue in this phase.
- **D-08:** The dispatch contract should be durable and serverless-friendly, following the repo's existing pattern of DB-backed async job state machines such as `pdf_import_jobs` and `linkedin_import_jobs`.
- **D-09:** Phase 37 should define claimable durable runtime foundations and dispatch payload shape, while leaving actual orchestrator integration and worker execution behavior to later phases.

### Cancellation and lifecycle semantics
- **D-10:** Include `cancelled` in the shared lifecycle contract now so the model does not need to break later when cancellation is added.
- **D-11:** Do not promise real user-facing cancellation controls or full cancellation mechanics in this phase; `cancelled` is reserved runtime state for forward compatibility.
- **D-12:** Lifecycle freezing in this phase must preserve current brownfield business behavior and avoid implying retry or cancellation semantics that later phases have not implemented yet.

### Source-of-truth rules
- **D-13:** `cvState` remains the canonical original resume state and `agentState` remains operational context only.
- **D-14:** Async job contracts must preserve previous valid `optimizedCvState` on failure rather than overwriting good optimized state with partial or failed outputs.
- **D-15:** Artifact-related contracts must record which exact snapshot or version generated an output so preview and generated files stay traceable to the same source snapshot.

### Claude's Discretion
- Naming of the generic jobs table or Prisma model, as long as it stays generic and durable.
- Exact field names for job input or result references, as long as they support the frozen shared contract.
- Whether stage enums live in Prisma, TypeScript-only shared types, or both, as long as the lifecycle vocabulary stays explicit and stable.

### Deferred Ideas (OUT OF SCOPE)
- User-facing cancel or retry controls for background jobs.
- Richer per-stage progress UX beyond the frozen lifecycle and status vocabulary.
- External queue or multi-service runtime redesign after the same-app DB-backed contract proves insufficient.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| JOB-01 | ATS enhancement, target-job rewriting, and artifact generation have durable persisted job records with explicit type, status, stage, progress, timestamps, and terminal result or error references. | One generic `jobs` contract, DB-backed claim/lease helpers, typed status vocabulary, generic input/result/error refs, and snapshot-traceable artifact linkage unlock this requirement directly. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Preserve `/api/agent` as the public entry point while keeping lightweight chat synchronous; this phase can freeze contracts but should not redesign the public surface. [VERIFIED: `CLAUDE.md`, `.planning/ROADMAP.md`]
- Preserve current billing, entitlement, and checkout semantics; async job foundations must not duplicate or alter the existing `credit_accounts` and `resume_generations` billing invariants. [VERIFIED: `CLAUDE.md`, `AGENTS.md`]
- Use internal app user IDs after the auth boundary, not Clerk user IDs, in new durable job rows and ownership checks. [VERIFIED: `CLAUDE.md`, `src/app/api/profile/status/[jobId]/route.ts`, `src/app/api/profile/upload/status/[jobId]/route.ts`]
- Keep route handlers thin, validate external input with `zod`, and use structured logs via `logInfo`, `logWarn`, and `logError`. [VERIFIED: `AGENTS.md`, `src/app/api/agent/route.ts`]
- Treat `cvState` as canonical resume truth and `agentState` as operational context only; durable job rows must not become the canonical resume store. [VERIFIED: `AGENTS.md`, `CLAUDE.md`, `prisma/schema.prisma`]
- Preserve dispatcher and `ToolPatch` patterns when changing agent flows; later async execution should still converge through centralized persistence helpers rather than direct session mutation. [VERIFIED: `AGENTS.md`, `src/lib/agent/tools/index.ts`, `src/lib/db/session-lifecycle.ts`]
- Prefer small, test-backed changes over broad rewrites because the repo already has large orchestration modules. [VERIFIED: `AGENTS.md`, `CLAUDE.md`]

## Summary

CurrIA already has three durable persistence precedents relevant to this phase: `linkedin_import_jobs`, `pdf_import_jobs`, and `resume_generations`. The first two are DB-backed claim-and-process state machines with optimistic claim transitions, `claimed_at` lease fencing, and stale-job recovery; the third persists artifact lineage through immutable snapshot fields and output paths. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`, `src/lib/db/resume-generations.ts`, `prisma/schema.prisma`, `prisma/migrations/20260407_add_linkedin_import_jobs.sql`, `prisma/migrations/20260414_async_pdf_import_jobs.sql`, `prisma/migrations/20260412_resume_generation_billing.sql`]

The biggest planning risk is not the database write itself; it is contract drift. Today the repo already has multiple incompatible lifecycle vocabularies: import jobs use `pending | processing | completed | failed`, ATS workflows use `rewriteStatus` plus `atsWorkflowRun.status/currentStage`, `generatedOutput.status` uses `idle | generating | ready | failed`, and `resume_generations.status` uses `pending | completed | failed`. Phase 37 needs to freeze one shared async vocabulary before Phase 38 and Phase 39 split work across `/api/agent`, workers, polling, and SSE. [VERIFIED: `src/types/agent.ts`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`, `src/lib/agent/tools/index.ts`, `.planning/ROADMAP.md`]

The durable job model should stay boring: one generic `jobs` table, durable status reads as canonical truth, same-app DB-backed dispatch, explicit lifecycle fields, and generic JSON or ref fields for workflow-specific payloads. The planner should explicitly reuse the repo's existing optimistic claim plus fenced terminal-write pattern and should not turn Phase 37 into a queue migration or dependency-upgrade phase. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `prisma/migrations/20260407_add_linkedin_import_jobs.sql`, `package.json`, `npm registry`]

**Primary recommendation:** Add one generic durable `jobs` persistence contract plus one shared TypeScript contract module for `AgentActionType`, execution mode, `JobType`, `JobStatus`, stage, progress, dispatch payload refs, and terminal result/error refs, implemented with the repo's existing DB claim/lease pattern and without moving ATS, targeting, or artifact business logic yet. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `.planning/ROADMAP.md`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.3 | App Router route handlers and the current `/api/**` boundary | Phase 37 must preserve the existing App Router API surface and thin-handler pattern already used by the repo. [VERIFIED: `package.json`, `npm ls next --depth=0`, `https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers`] |
| `@supabase/supabase-js` | 2.103.0 | Runtime database and storage access for existing async job helpers | The current durable job code does not use Prisma Client at runtime; it uses Supabase PostgREST helpers for insert, claim, update, and storage operations. [VERIFIED: `package.json`, `npm ls @supabase/supabase-js --depth=0`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |
| Prisma schema + Prisma CLI | 5.22.0 CLI | Schema contract and migration workflow | The repo keeps durable table shape in `prisma/schema.prisma` and SQL migrations; Prisma Migrate generates and tracks SQL migration history, which matches the repo's current migration practice. [VERIFIED: `package.json`, `npx prisma --version`, `prisma/schema.prisma`, `https://www.prisma.io/docs/orm/prisma-migrate`] |
| Zod | 3.25.76 | Route and tool input validation | Project guidance requires Zod validation, and `/api/agent` already validates request input with `z.object(...).superRefine(...)`. [VERIFIED: `package.json`, `npm ls zod --depth=0`, `AGENTS.md`, `src/app/api/agent/route.ts`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostgreSQL `jsonb` via Supabase | Supabase-managed version unverified | Store flexible payload, result, and error refs without fragmenting the core lifecycle schema | Use for generic input/result/error metadata and snapshot references; existing `resume_generations` already persists JSON snapshots this way, and PostgreSQL documents `jsonb` indexing and containment support. [VERIFIED: `prisma/migrations/20260412_resume_generation_billing.sql`, `https://www.postgresql.org/docs/current/datatype-json.html`] |
| Vitest | 1.6.1 | Unit and integration regression coverage for contract and repository helpers | Use for all Phase 37 contract, repository, and status-route tests; the repo is already configured for Node-based unit tests. [VERIFIED: `package.json`, `npm ls vitest --depth=0`, `vitest.config.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One generic `jobs` model | Separate ATS, targeting, and artifact job tables | Contradicts locked decision D-01 and recreates today's vocabulary fragmentation across multiple persistence surfaces. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/types/agent.ts`] |
| Same-app DB-backed dispatch | BullMQ or another external queue | Contradicts locked decision D-07 and the repo's existing serverless-friendly async precedents. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `prisma/migrations/20260407_add_linkedin_import_jobs.sql`] |
| Durable status reads as canonical | SSE-only status contract | SSE in `/api/agent` is transport-oriented and ephemeral; it is not a durable execution ledger. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/app/api/agent/route.ts`] |

**Installation:**
```bash
# No new runtime packages are recommended for Phase 37.
# Reuse the current workspace stack and add only schema/migration/code changes.
npm install
```

**Version verification:** Phase 37 should stay on the workspace's current brownfield stack rather than upgrading packages mid-refactor. Registry checks done on 2026-04-16 show newer releases exist, but those are out of scope for this phase. [VERIFIED: `npm ls next prisma vitest @supabase/supabase-js zod --depth=0`, `npm registry`]

- `next`: workspace `14.2.3`; registry latest `16.2.4` published `2026-04-15T22:33:47.905Z`. [VERIFIED: `npm ls next --depth=0`, `npm registry`]
- `prisma`: workspace CLI `5.22.0`; registry latest `7.7.0` published `2026-04-07T15:56:13.017Z`. [VERIFIED: `npx prisma --version`, `npm registry`]
- `@supabase/supabase-js`: workspace `2.103.0`; registry latest `2.103.3` published `2026-04-16T13:37:44.645Z`. [VERIFIED: `npm ls @supabase/supabase-js --depth=0`, `npm registry`]
- `zod`: workspace `3.25.76`; registry latest `4.3.6` published `2026-01-22T19:14:35.382Z`. [VERIFIED: `npm ls zod --depth=0`, `npm registry`]
- `vitest`: workspace `1.6.1`; registry latest `4.1.4` published `2026-04-09T07:36:52.741Z`. [VERIFIED: `npm ls vitest --depth=0`, `npm registry`]

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── types/jobs.ts         # Shared JobType/JobStatus/stage/progress/ref contracts
├── lib/jobs/store.ts     # Create/read/claim/complete/fail/cancel helpers
├── lib/jobs/dispatch.ts  # Same-app durable dispatch payload helpers
├── lib/jobs/result-refs.ts
│                         # Typed input/result/error ref helpers
├── lib/agent/            # Later phases consume the shared contracts here
└── app/api/              # Routes stay thin and call lib/jobs/*
prisma/
├── schema.prisma         # Generic Job model
└── migrations/           # SQL migration for the durable jobs table
```

This file layout keeps route handlers thin, isolates durable job semantics from session-state types, and makes the Phase 37 contract importable by both the orchestrator and later workers. [ASSUMED]

### Pattern 1: Freeze one shared async contract before implementation splits

**What:** Define `AgentActionType`, execution mode, `JobType`, `JobStatus`, stage, progress, dispatch payload refs, result refs, and error refs in one shared contract module and make later `/api/agent`, worker, polling, and SSE surfaces import that contract instead of re-declaring status strings. [VERIFIED: `.planning/ROADMAP.md`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/types/agent.ts`]

**When to use:** Immediately in Phase 37, before Phase 38 and Phase 39 proceed independently. [VERIFIED: `.planning/ROADMAP.md`, `.planning/STATE.md`]

**Example:**
```typescript
export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type JobProgress = {
  percent?: number
  label?: string
}
```
Source intent: one shared lifecycle vocabulary for all heavy flows. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

### Pattern 2: Reuse the repo's optimistic claim plus fenced terminal-write pattern

**What:** Implement generic jobs with claimable rows, a lease token such as `claimedAt`, stale-job recovery, and terminal writes fenced on the same lease value so two requests cannot both own completion. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

**When to use:** For every durable async job that can be processed on-demand, retried after a timeout, or resumed in a serverless request context. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

**Example:**
```typescript
let query = supabase
  .from('jobs')
  .update({
    status: 'running',
    claimed_at: now,
  })
  .eq('id', jobId)
  .eq('user_id', appUserId)
  .eq('status', 'queued')
```
Pattern source: `linkedin_import_jobs` and `pdf_import_jobs`. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

### Pattern 3: Keep job rows operational, not canonical

**What:** The generic job row should store lifecycle plus typed references; canonical resume truth stays in `sessions.cv_state`, `resume_targets.derived_cv_state`, and artifact lineage stays in `resume_generations`. [VERIFIED: `CLAUDE.md`, `prisma/schema.prisma`, `src/lib/db/resume-generations.ts`]

**When to use:** For ATS enhancement, target-job rewriting, and artifact generation jobs. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

**Example:**
```typescript
type JobResultRef =
  | { kind: 'session'; sessionId: string }
  | { kind: 'resume_generation'; resumeGenerationId: string }
  | { kind: 'resume_target'; resumeTargetId: string }
```
This keeps the job ledger generic while preserving existing source-of-truth tables. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `CLAUDE.md`, `prisma/schema.prisma`]

### Pattern 4: Use DB-enforced status values, but keep workflow stage flexible

**What:** Enforce `JobStatus` in the database, but keep workflow stage as a text column plus TypeScript unions in Phase 37 so ATS, targeting, and artifact stages can share the same row shape without prematurely freezing every stage at the DB level. [ASSUMED]

**When to use:** When the planner chooses between Prisma enum, SQL `CHECK`, or plain text for the generic jobs table. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

**Example:**
```sql
status text not null check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
stage text,
progress jsonb
```
This matches the repo's current SQL-first migration style. [VERIFIED: `prisma/migrations/20260407_add_linkedin_import_jobs.sql`, `prisma/migrations/20260412_resume_generation_billing.sql`]

### Anti-Patterns to Avoid

- **Workflow-specific durable job tables:** This contradicts D-01 and recreates state-shape drift before the async split even starts. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]
- **Treating job rows as resume truth:** `cvState` remains canonical and `agentState` remains operational; jobs should point at truth, not replace it. [VERIFIED: `CLAUDE.md`, `prisma/schema.prisma`]
- **Treating SSE chunks as authoritative status:** `/api/agent` streams transport events, but the phase explicitly requires durable status reads to be canonical. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/app/api/agent/route.ts`]
- **Clearing prior optimized state on failure:** current ATS and job-targeting paths still write `optimizedCvState: undefined` on several failure paths, which later phases must correct rather than preserve as a contract. [VERIFIED: `src/lib/agent/ats-enhancement-pipeline.ts`, `src/lib/agent/job-targeting-pipeline.ts`, `.planning/REQUIREMENTS.md`]
- **Adding queue infrastructure now:** the repo's own migration comments already call out BullMQ incompatibility with the current serverless model. [VERIFIED: `prisma/migrations/20260407_add_linkedin_import_jobs.sql`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Durable async execution foundation | A new queue stack or worker framework in Phase 37 | One generic DB-backed `jobs` table plus claim/lease helpers modeled after `linkedin_import_jobs` and `pdf_import_jobs` | The repo already proves this serverless-friendly pattern and the phase explicitly forbids external queue adoption. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |
| Artifact lineage | Ad hoc output-path strings stored only in `generatedOutput` | Reuse `resume_generations`-style snapshot and output metadata, then point the generic job result at it | Existing artifact generation already records immutable snapshot context and output paths in a durable table. [VERIFIED: `src/lib/db/resume-generations.ts`, `src/lib/resume-generation/generate-billable-resume.ts`, `prisma/schema.prisma`] |
| Multi-entity canonical writes | Ad hoc direct writes across sessions, targets, and versions | Existing transactional helpers such as `applyToolPatchWithVersion` and the target/version RPC pattern | The repo already centralizes patch persistence and version creation to preserve source-of-truth semantics. [VERIFIED: `src/lib/db/session-lifecycle.ts`, `src/lib/db/resume-targets.ts`, `src/lib/agent/tools/index.ts`] |
| Payload validation | Hand-written runtime checks scattered across routes and workers | Shared Zod schemas for dispatch payload and status DTOs | Zod is already the project standard for route and tool validation. [VERIFIED: `AGENTS.md`, `src/app/api/agent/route.ts`, `src/lib/agent/tools/schemas.ts`] |
| Ownership and access control | Unscoped job lookups by `jobId` alone | `getCurrentAppUser()` plus `user_id`-scoped reads and updates | Existing job status routes already guard job reads this way and the internal app-user model is a project invariant. [VERIFIED: `CLAUDE.md`, `src/app/api/profile/status/[jobId]/route.ts`, `src/app/api/profile/upload/status/[jobId]/route.ts`] |

**Key insight:** The deceptive complexity here is not "write a jobs table"; it is preserving source-of-truth, idempotency, claim ownership, and artifact traceability across later async processors. CurrIA already has working precedents for each of those concerns; the planner should compose them instead of inventing a new runtime model. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`, `src/lib/db/resume-generations.ts`, `src/lib/db/session-lifecycle.ts`]

## Common Pitfalls

### Pitfall 1: Vocabulary drift across status surfaces

**What goes wrong:** The new job ledger lands, but `rewriteStatus`, `atsWorkflowRun`, `generatedOutput.status`, polling routes, and SSE still speak different status dialects. [VERIFIED: `src/types/agent.ts`, `src/app/api/profile/status/[jobId]/route.ts`, `src/app/api/profile/upload/status/[jobId]/route.ts`]

**Why it happens:** The repo already has multiple adjacent status contracts because async concerns were added incrementally. [VERIFIED: `src/types/agent.ts`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

**How to avoid:** Freeze one `JobStatus` vocabulary in Phase 37 and make later route/UI/SSE work adapt to it rather than inventing more local enums. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

**Warning signs:** Planner tasks start mentioning status mapping tables or route-specific status strings before the shared contract exists.

### Pitfall 2: Turning the job row into business truth

**What goes wrong:** The planner stores optimized resume state, artifact metadata, or target output directly on the generic job row and duplicates the repo's canonical state stores. [VERIFIED: `CLAUDE.md`, `prisma/schema.prisma`]

**Why it happens:** A generic jobs table feels like the natural place to stash outputs, but CurrIA already has canonical tables for session truth, target truth, and artifact truth. [VERIFIED: `prisma/schema.prisma`, `src/lib/db/resume-generations.ts`]

**How to avoid:** Keep jobs operational and point to canonical rows or immutable snapshots through refs. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/lib/db/resume-generations.ts`]

**Warning signs:** New plan tasks propose columns such as `optimized_cv_state` or `output_pdf_path` directly on the generic `jobs` table.

### Pitfall 3: Lease-free processing and stale-writer overwrites

**What goes wrong:** Two requests or workers process the same job, or a timed-out owner overwrites terminal state written by a newer owner. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

**Why it happens:** Serverless-friendly polling patterns need optimistic claim transitions and fenced terminal writes; naive updates are not enough. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

**How to avoid:** Reuse the existing `status -> processing`, `claimed_at`, stale reclaim, and fenced terminal-write pattern for the generic jobs repository. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

**Warning signs:** New helper functions update terminal status without checking the original lease token. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

### Pitfall 4: Failure paths clobbering a previously valid optimized snapshot

**What goes wrong:** Async job failure clears `optimizedCvState`, causing preview or later artifact generation to fall back incorrectly and violate `STATE-01`. [VERIFIED: `src/lib/agent/ats-enhancement-pipeline.ts`, `src/lib/agent/job-targeting-pipeline.ts`, `.planning/REQUIREMENTS.md`]

**Why it happens:** Existing inline ATS and targeting pipelines still set `optimizedCvState: undefined` in several failure branches. [VERIFIED: `src/lib/agent/ats-enhancement-pipeline.ts`, `src/lib/agent/job-targeting-pipeline.ts`]

**How to avoid:** Freeze the contract now so later phases preserve prior valid optimized state on failure and treat job rows as execution metadata only. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `.planning/REQUIREMENTS.md`]

**Warning signs:** A plan task says "mark failed and clear optimized state" or treats failure as a destructive reset.

### Pitfall 5: Artifact outputs losing source snapshot traceability

**What goes wrong:** The system can report a completed artifact job, but cannot prove which snapshot or version produced the file. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]

**Why it happens:** `generatedOutput` is thin metadata, while `resume_generations` already holds richer lineage; a generic jobs table could accidentally bypass that. [VERIFIED: `src/lib/db/resume-generations.ts`, `src/types/agent.ts`]

**How to avoid:** Make artifact job results point at `resume_generations` or an equivalent immutable snapshot/result ref instead of inventing a second lineage path. [VERIFIED: `src/lib/db/resume-generations.ts`, `src/lib/resume-generation/generate-billable-resume.ts`]

**Warning signs:** New artifact job rows only record storage paths or signed URLs without a source snapshot reference.

## Code Examples

Verified patterns from the repo:

### Optimistic claim with a lease fence
```typescript
let query = supabase
  .from('linkedin_import_jobs')
  .update({
    status: 'processing' as ImportJobStatus,
    claimed_at: now,
    error_message: null,
    ...createUpdatedAtTimestamp(),
  })
  .eq('id', jobId)
  .eq('user_id', appUserId)
  .eq('status', fromStatus)

if (expectedClaimedAt !== undefined) {
  query = query.eq('claimed_at', expectedClaimedAt)
}
```
Source: `src/lib/linkedin/import-jobs.ts`. [VERIFIED: `src/lib/linkedin/import-jobs.ts`]

### Fenced terminal write to avoid stale-owner overwrite
```typescript
const { data, error } = await supabase
  .from('linkedin_import_jobs')
  .update(update)
  .eq('id', jobId)
  .eq('claimed_at', ownerClaimedAt)
  .select('*')
  .single()
```
Source: `src/lib/linkedin/import-jobs.ts`. [VERIFIED: `src/lib/linkedin/import-jobs.ts`]

### Transactional patch persistence plus version capture
```typescript
const { data, error } = await supabase.rpc('apply_session_patch_with_version', {
  p_session_id: session.id,
  p_user_id: session.userId,
  p_phase: mergedSession.phase,
  p_cv_state: mergedSession.cvState,
  p_agent_state: mergedSession.agentState,
  p_generated_output: mergedSession.generatedOutput,
  p_ats_score: mergedSession.atsScore ?? null,
  p_version_source: versionSource ?? null,
})
```
Source: `src/lib/db/session-lifecycle.ts`. [VERIFIED: `src/lib/db/session-lifecycle.ts`]

### Immutable artifact snapshot persistence
```typescript
.insert({
  id: createDatabaseId(),
  user_id: input.userId,
  session_id: input.sessionId ?? null,
  resume_target_id: input.resumeTargetId ?? null,
  type: input.type,
  status: 'pending',
  idempotency_key: input.idempotencyKey ?? null,
  source_cv_snapshot: structuredClone(input.sourceCvSnapshot),
  version_number: (count ?? 0) + 1,
})
```
Source: `src/lib/db/resume-generations.ts`. [VERIFIED: `src/lib/db/resume-generations.ts`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heavy ATS, targeting, and artifact work runs inline on the long-lived `/api/agent` request | Keep `/api/agent` as the public entry point, but move heavy work behind durable async jobs after the contract freeze | Planned in milestone `v1.6` on 2026-04-16. [VERIFIED: `.planning/ROADMAP.md`, `.planning/STATE.md`] | The orchestrator and worker workstreams can diverge without changing user-facing entrypoints. [VERIFIED: `.planning/ROADMAP.md`] |
| Workflow-specific import job tables define their own narrow lifecycle fields | Phase 37 freezes one generic `jobs` persistence model plus shared lifecycle vocabulary | Phase 37 context gathered on 2026-04-16. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`] | UI, polling, SSE, and worker code can read one durable contract instead of mapping local enums. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`] |
| SSE or route-local status responses can act as the practical status surface | Durable job reads are the canonical source of truth, with SSE relegated to transport | Phase 37 decision D-04 to D-06 on 2026-04-16. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`] | Later observability and status UX can be built on one persisted ledger. [VERIFIED: `.planning/REQUIREMENTS.md`] |

**Deprecated/outdated:**

- Treating BullMQ or another external queue as the default next step for this milestone is outdated for CurrIA's current deployment model and explicitly out of scope for Phase 37. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `prisma/migrations/20260407_add_linkedin_import_jobs.sql`]
- Reusing `rewriteStatus`, `atsWorkflowRun.status`, or `generatedOutput.status` as the generic durable job contract is outdated because those fields are domain-specific and mutually inconsistent. [VERIFIED: `src/types/agent.ts`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A dedicated `src/types/jobs.ts` and `src/lib/jobs/*` module layout is the cleanest place to freeze the shared contract instead of expanding `src/types/agent.ts` further. | Architecture Patterns | Low: mostly affects file organization and import churn. |
| A2 | The generic `jobs` row should keep `status` DB-enforced but keep `stage` as text plus TypeScript unions in Phase 37. | Architecture Patterns | Medium: if the team wants DB-enforced stage enums now, migration shape changes. |
| A3 | Generic input/result/error refs should be modeled as typed ref objects rather than workflow-specific nullable columns beyond basic ownership links. | Architecture Patterns | Medium: if later phases need direct relational joins immediately, the initial schema may need extension. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should the generic jobs table hold direct foreign keys to downstream result tables, or only generic result refs?**
   - What we know: artifact lineage already lives in `resume_generations`, while ATS and targeting results currently converge through session or target state. [VERIFIED: `src/lib/db/resume-generations.ts`, `src/lib/agent/tools/index.ts`]
   - What's unclear: whether Phase 37 should pre-wire nullable direct relations such as `resume_generation_id`, or keep the first cut fully generic. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]
   - Recommendation: require a generic `resultRef` contract in Phase 37 and only add direct nullable FKs if the plan proves a specific read path needs them immediately.

2. **Where should the frozen stage vocabulary live?**
   - What we know: the context leaves this to Claude's discretion, and the repo already uses TypeScript unions for `AtsWorkflowStage`. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/types/agent.ts`]
   - What's unclear: whether the planner wants stage values enforced in SQL or only in shared TS contracts during the first foundation phase. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`]
   - Recommendation: lock `JobStatus` at the DB layer now, but keep `stage` flexible in Phase 37 and tighten it only after actual worker flows settle in Phase 39.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js, Vitest, Prisma CLI, local scripts | ✓ | `v24.14.0` | — |
| npm | Package metadata checks and repo scripts | ✓ | `11.9.0` | — |
| Prisma CLI | Schema and migration authoring | ✓ | `5.22.0` | Raw SQL migration files can still be authored if CLI workflows are temporarily blocked. [VERIFIED: `npx prisma --version`, `prisma/migrations/*`] |
| Supabase/Postgres connectivity | Applying the new migration and live integration validation | Unverified in this research session | — | Planner can still author schema, migration SQL, and unit tests locally; execution will need environment access before live DB proof. [VERIFIED: no live DB probe was run in this session] |
| Prisma Client | Runtime data access for Phase 37 | ✗ | — | Not required; the repo's existing async job code uses Supabase runtime access instead. [VERIFIED: `npm ls @prisma/client --depth=0` returned an empty tree, `rg "@prisma/client|PrismaClient" src prisma scripts` found no runtime usage, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |

**Missing dependencies with no fallback:**
- None confirmed during research; the only unverified dependency is live Supabase/Postgres connectivity. [VERIFIED: environment probe results from this session]

**Missing dependencies with fallback:**
- `@prisma/client` is absent, but that does not block Phase 37 because runtime persistence already goes through Supabase/PostgREST helpers. [VERIFIED: `rg "@prisma/client|PrismaClient" src prisma scripts`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `1.6.1` with Node default environment and `jsdom` for `*.test.tsx`. [VERIFIED: `npm ls vitest --depth=0`, `vitest.config.ts`] |
| Config file | `vitest.config.ts`. [VERIFIED: `vitest.config.ts`] |
| Quick run command | `npx vitest run src/lib/linkedin/import-jobs.test.ts src/lib/db/resume-generations.test.ts src/lib/db/sessions.test.ts src/app/api/profile/status/[jobId]/route.test.ts src/app/api/profile/upload/status/[jobId]/route.test.ts`. [VERIFIED: `vitest.config.ts`, `rg --files -g "*test.ts" -g "*test.tsx" src tests`] |
| Full suite command | `npm test`. [VERIFIED: `package.json`] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JOB-01 | Generic durable job records expose explicit type, status, stage, progress, timestamps, and terminal refs; claim and terminal transitions are ownership-safe. [VERIFIED: `.planning/REQUIREMENTS.md`] | unit + integration | `npx vitest run src/lib/jobs/jobs.test.ts src/lib/jobs/contracts.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/jobs/jobs.test.ts src/lib/jobs/contracts.test.ts src/lib/linkedin/import-jobs.test.ts src/lib/db/resume-generations.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/jobs/jobs.test.ts` — covers create/read/claim/reclaim/complete/fail/cancelled transitions for the new generic jobs repository.
- [ ] `src/lib/jobs/contracts.test.ts` — locks the shared `JobType`, `JobStatus`, stage, progress, and ref DTO shapes.
- [ ] `src/lib/db/jobs.test.ts` or equivalent — verifies row mapping for JSON refs, timestamps, and nullable foreign/reference fields.
- [ ] `src/app/api/jobs/[jobId]/route.test.ts` if Phase 37 ships a new canonical status surface; otherwise defer this to Phase 40 explicitly.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk-authenticated requests resolve to an internal app user before job reads or writes. [VERIFIED: `CLAUDE.md`, `src/app/api/profile/status/[jobId]/route.ts`, `src/app/api/profile/upload/status/[jobId]/route.ts`] |
| V3 Session Management | no | This phase does not introduce new session-management mechanics; it should inherit the existing auth/session boundary unchanged. [VERIFIED: `.planning/ROADMAP.md`, `CLAUDE.md`] |
| V4 Access Control | yes | Scope every job create/read/update by internal `user_id`, and keep status routes ownership-checked. [VERIFIED: `CLAUDE.md`, `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |
| V5 Input Validation | yes | Validate dispatch payloads and public status-query params with Zod or equivalent typed schemas before persistence. [VERIFIED: `AGENTS.md`, `src/app/api/agent/route.ts`] |
| V6 Cryptography | no | No new cryptography should be introduced for Phase 37; reuse existing platform secrets and storage flows. [VERIFIED: `CLAUDE.md`, `AGENTS.md`] |

### Known Threat Patterns for CurrIA's async job foundation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-user job status access by guessed `jobId` | Information Disclosure / Elevation of Privilege | Require authenticated app user resolution and scope all job queries by `user_id`. [VERIFIED: `src/app/api/profile/status/[jobId]/route.ts`, `src/app/api/profile/upload/status/[jobId]/route.ts`] |
| Duplicate job execution from concurrent claims | Tampering / Denial of Service | Use optimistic `UPDATE ... WHERE status = <expected>` claims plus `claimed_at` lease fencing. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |
| Timed-out owner overwriting a newer terminal state | Tampering | Fence terminal writes on the original claim token such as `claimed_at`. [VERIFIED: `src/lib/linkedin/import-jobs.ts`, `src/lib/profile/pdf-import-jobs.ts`] |
| Malformed dispatch payload or result ref breaks downstream processors | Tampering | Use shared typed schemas and reject malformed payloads before persistence or dispatch. [VERIFIED: `src/app/api/agent/route.ts`, `src/lib/agent/tools/schemas.ts`] |
| Ephemeral SSE event treated as the durable ledger | Repudiation / Integrity | Keep durable job rows as canonical and limit SSE to acknowledgments and progress transport. [VERIFIED: `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md`, `src/app/api/agent/route.ts`] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/37-freeze-async-execution-contracts-and-durable-job-foundations/37-CONTEXT.md` - locked job-model, status, dispatch, and source-of-truth decisions.
- `.planning/REQUIREMENTS.md` - `JOB-01`, adjacent async-runtime requirements, and out-of-scope boundaries.
- `.planning/ROADMAP.md` - phase goal, success criteria, and dependency boundary for Phases 38 to 40.
- `.planning/STATE.md` - confirms Phase 37 is the first v1.6 milestone step and must freeze contracts before later work splits.
- `CLAUDE.md` - project invariants for auth, billing, canonical state, and `/api/agent`.
- `AGENTS.md` - stack, conventions, and workflow guidance.
- `prisma/schema.prisma` - current durable models, status columns, and source-of-truth tables.
- `prisma/migrations/20260407_add_linkedin_import_jobs.sql` - DB-backed job precedent and explicit BullMQ rejection.
- `prisma/migrations/20260414_async_pdf_import_jobs.sql` - PDF job precedent and indexing shape.
- `prisma/migrations/20260412_resume_generation_billing.sql` - artifact lineage and JSONB snapshot precedent.
- `src/lib/linkedin/import-jobs.ts` - optimistic claim, stale reclaim, and fenced terminal write pattern.
- `src/lib/profile/pdf-import-jobs.ts` - second DB-backed async job pattern plus terminal warning support.
- `src/lib/db/resume-generations.ts` - immutable snapshot persistence and idempotent artifact-generation state.
- `src/lib/resume-generation/generate-billable-resume.ts` - artifact lineage boundary and generated-output behavior.
- `src/lib/db/session-lifecycle.ts` - transactional patch/version persistence.
- `src/lib/agent/tools/index.ts` - dispatcher seam, `ToolPatch` persistence, and effective source selection.
- `src/types/agent.ts` - current lifecycle/status fragmentation and artifact/session types.
- Next.js Route Handlers docs: https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers
- Prisma Migrate docs: https://www.prisma.io/docs/orm/prisma-migrate
- PostgreSQL JSON types docs: https://www.postgresql.org/docs/current/datatype-json.html
- npm registry metadata queried on 2026-04-16 for `next`, `prisma`, `@supabase/supabase-js`, `zod`, and `vitest`.

### Secondary (MEDIUM confidence)

- None. All non-assumed claims in this research were verified against project files, official docs, or official package metadata.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against `package.json`, installed workspace versions, official docs, and registry metadata.
- Architecture: MEDIUM - the need for one generic durable contract is locked and well-supported, but the exact Phase 37 table shape and file layout still involve design choices.
- Pitfalls: HIGH - they are directly evidenced by current code fragmentation, migration precedents, and locked source-of-truth requirements.

**Research date:** 2026-04-16
**Valid until:** 2026-04-23
