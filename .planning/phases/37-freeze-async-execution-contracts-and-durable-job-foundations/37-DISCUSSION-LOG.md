# Phase 37: Freeze async execution contracts and durable job foundations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 37-freeze-async-execution-contracts-and-durable-job-foundations
**Areas discussed:** Job persistence shape, Status delivery contract, Dispatch/runtime boundary, Cancellation semantics

---

## Job persistence shape

| Option | Description | Selected |
|--------|-------------|----------|
| Generic jobs model | One durable generic `jobs` model for ATS, targeting, and artifact execution | ✓ |
| Per-workflow tables | Separate ATS, targeting, and artifact job tables from the start | |
| Let the agent decide | Defer the persistence shape choice to planning | |

**User's choice:** Use recommended default (`0`) - generic durable jobs model.
**Notes:** The persisted contract should stay generic, typed, and reusable across all heavy async flows instead of fragmenting the model in Phase 37.

---

## Status delivery contract

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical status reads | Persisted job status is the source of truth; SSE only transports acknowledgments and updates | ✓ |
| SSE-first | Treat the SSE stream as the main execution record and derive status from it | |
| Let the agent decide | Defer the contract choice to planning | |

**User's choice:** Use recommended default (`0`) - canonical persisted status reads.
**Notes:** Later UI, polling, and SSE work should all consume the same durable lifecycle contract.

---

## Dispatch/runtime boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Same-app DB-backed dispatch | Freeze a serverless-friendly DB-backed dispatch and runner contract first | ✓ |
| External queue now | Introduce BullMQ or another external queue as part of Phase 37 | |
| Let the agent decide | Defer the runtime-boundary choice to planning | |

**User's choice:** Use recommended default (`0`) - same-app, DB-backed dispatch foundation.
**Notes:** Existing `pdf_import_jobs` and `linkedin_import_jobs` already provide a repo-native precedent for durable async work without external queue infrastructure.

---

## Cancellation semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Reserve cancelled only | Include `cancelled` in the lifecycle contract now without promising full cancellation behavior | ✓ |
| Full cancellation now | Define user-facing cancellation controls and runtime behavior in this phase | |
| Let the agent decide | Defer cancellation semantics to planning | |

**User's choice:** Use recommended default (`0`) - reserve `cancelled` for forward compatibility only.
**Notes:** Phase 37 should freeze the lifecycle vocabulary without forcing cancellation UX or runtime semantics before later phases are ready.

---

## the agent's Discretion

- Exact naming for the generic jobs model and its reference fields.
- Whether stage enums are represented in Prisma, shared TypeScript types, or both.

## Deferred Ideas

- User-facing cancel or retry controls for background jobs.
- Richer per-stage progress UX.
- External queue infrastructure or multi-service runtime decomposition.
