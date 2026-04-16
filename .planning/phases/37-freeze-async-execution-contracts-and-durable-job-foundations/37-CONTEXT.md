# Phase 37: Freeze async execution contracts and durable job foundations - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the shared async action, job, lifecycle, dispatch, and source-of-truth contracts for the upcoming refactor, then establish the durable generic job persistence foundation that later phases will use. This phase freezes contracts and persistence shape only; it does not redesign `/api/agent`, change business rules, or move the heavy ATS, targeting, and artifact pipelines yet.

</domain>

<decisions>
## Implementation Decisions

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
- **D-08:** The dispatch contract should be durable and serverless-friendly, following the repo’s existing pattern of DB-backed async job state machines such as `pdf_import_jobs` and `linkedin_import_jobs`.
- **D-09:** Phase 37 should define claimable durable runtime foundations and dispatch payload shape, while leaving actual orchestrator integration and worker execution behavior to later phases.

### Cancellation and lifecycle semantics
- **D-10:** Include `cancelled` in the shared lifecycle contract now so the model does not need to break later when cancellation is added.
- **D-11:** Do not promise real user-facing cancellation controls or full cancellation mechanics in this phase; `cancelled` is reserved runtime state for forward compatibility.
- **D-12:** Lifecycle freezing in this phase must preserve current brownfield business behavior and avoid implying retry or cancellation semantics that later phases have not implemented yet.

### Source-of-truth rules
- **D-13:** `cvState` remains the canonical original resume state and `agentState` remains operational context only.
- **D-14:** Async job contracts must preserve previous valid `optimizedCvState` on failure rather than overwriting good optimized state with partial or failed outputs.
- **D-15:** Artifact-related contracts must record which exact snapshot or version generated an output so preview and generated files stay traceable to the same source snapshot.

### the agent's Discretion
- Naming of the generic jobs table or Prisma model, as long as it stays generic and durable.
- Exact field names for job input or result references, as long as they support the frozen shared contract.
- Whether stage enums live in Prisma, TypeScript-only shared types, or both, as long as the lifecycle vocabulary stays explicit and stable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase contract
- `.planning/ROADMAP.md` - Defines the Phase 37 goal, success criteria, and the dependency boundary for Phases 38 to 40.
- `.planning/REQUIREMENTS.md` - Defines `JOB-01` and the later milestone requirements that the Phase 37 contract must unlock without drift.
- `.planning/PROJECT.md` - Locks the milestone-wide non-negotiables: preserve `/api/agent`, keep chat synchronous, preserve billing semantics, and treat `cvState` as canonical truth.
- `.planning/STATE.md` - Confirms this is the first phase of `v1.6` and that contract freeze must happen before orchestrator and worker workstreams diverge.

### Existing agent runtime and state contracts
- `src/app/api/agent/route.ts` - Current public `/api/agent` boundary, SSE adapter behavior, and the long-lived request path this milestone is trying to shrink.
- `src/lib/agent/tools/index.ts` - Current dispatcher contract, effective base resume selection, artifact generation entrypoint, and persisted patch behavior.
- `src/lib/agent/agent-loop.ts` - Existing streaming agent runtime that later phases must decouple from heavy inline execution without changing product semantics.
- `src/types/agent.ts` - Shared session, `agentState`, `generatedOutput`, `CVVersionSource`, and tool patch contracts that the async job foundation must respect.

### Persistence and async-job precedents
- `prisma/schema.prisma` - Current canonical persistence schema, including session, target, generated output, and existing DB-backed async job models.
- `src/lib/db/session-lifecycle.ts` - Patch persistence and versioning behavior that later async execution must preserve.
- `src/lib/profile/pdf-import-jobs.ts` - Existing DB-backed async job pattern for a serverless-friendly workflow that Phase 37 can reuse conceptually.
- `src/lib/linkedin/import-jobs.ts` - Existing durable claim-and-process job pattern that demonstrates how the repo already handles background work without external queue infrastructure.
- `prisma/migrations/20260414_async_pdf_import_jobs.sql` - Concrete DB migration precedent for server-backed async job state.
- `prisma/migrations/20260407_add_linkedin_import_jobs.sql` - Earlier durable async job precedent and rationale for avoiding incompatible queue infrastructure.

### Artifact and target persistence
- `src/lib/resume-generation/generate-billable-resume.ts` - Current artifact-generation boundary whose source snapshot and generated output metadata must remain traceable after async refactoring.
- `src/lib/db/resume-targets.ts` - Target-generated output persistence contract that later async artifact work must continue to honor.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/agent/tools/index.ts`: already centralizes tool dispatch, state patch persistence, and effective resume source selection.
- `src/lib/db/session-lifecycle.ts`: already owns safe persisted patch application and CV versioning semantics.
- `src/lib/profile/pdf-import-jobs.ts`: reusable example of DB-backed async status lifecycle with claim, completion, and failure transitions.
- `src/lib/linkedin/import-jobs.ts`: reusable example of durable job storage and serverless-friendly processing without external queue infrastructure.
- `src/lib/resume-generation/generate-billable-resume.ts`: existing single boundary for artifact generation that later phases can wrap in async execution instead of rewriting.

### Established Patterns
- Route handlers stay thin and push logic into `src/lib/**`.
- `cvState` is canonical truth while `agentState` is operational only.
- Tool-originated mutations flow through `ToolPatch` plus persisted patch helpers instead of arbitrary inline writes.
- Async background work already prefers DB-backed state machines over queue infrastructure that clashes with the current deployment model.

### Integration Points
- `/api/agent` in `src/app/api/agent/route.ts` is the public request boundary that will eventually dispatch against the Phase 37 contracts.
- The tool dispatcher in `src/lib/agent/tools/index.ts` is the current seam where ATS, target resume, and artifact generation semantics converge.
- Prisma schema and migrations are the right home for the durable generic jobs model that later phases will consume.
- Existing workspace and preview consumers already depend on persisted session or generated output state, so the job contract must preserve those downstream reads.

</code_context>

<specifics>
## Specific Ideas

- Keep the first async foundation intentionally boring: generic job persistence, explicit lifecycle vocabulary, and durable DB-backed dispatch before any queue or infrastructure expansion.
- Treat polling or explicit status reads as canonical, with SSE layered on top later as a convenience transport rather than the execution ledger.
- Reserve `cancelled` early so the lifecycle stays future-compatible without forcing real cancellation UX or runtime semantics into this phase.

</specifics>

<deferred>
## Deferred Ideas

- User-facing cancel or retry controls for background jobs.
- Richer per-stage progress UX beyond the frozen lifecycle and status vocabulary.
- External queue or multi-service runtime redesign after the same-app DB-backed contract proves insufficient.

</deferred>

---

*Phase: 37-freeze-async-execution-contracts-and-durable-job-foundations*
*Context gathered: 2026-04-16*
