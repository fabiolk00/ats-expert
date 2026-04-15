---
title: JSON Persistence Contracts
audience: [developers, architects]
related: [../state-model.md, ./storage-and-rls-proof.md, ../../prisma/schema.prisma]
status: current
updated: 2026-04-15
---

# JSON Persistence Contracts

This document inventories the main JSON-backed persistence seams in CurrIA and classifies each one by ownership and contract strength.

## Contract classes

- `Canonical product contract`: durable product state that callers should treat as strongly typed and migration-worthy.
- `Operational contract`: structured runtime state that still needs validation and normalization, but is not the core product truth.
- `Opaque event payload`: intentionally flexible payload kept mainly for audit, replay, or debugging. These blobs should stay explicit exceptions, not accidental weak seams.

## Inventory

| Table.Column | Contract Class | Owner | Meaning | Current Boundary | Migration Direction |
|---|---|---|---|---|---|
| `sessions.cv_state` | Canonical product contract | session persistence | Base resume truth for a working session | `session-normalization.ts` clones and normalizes the bundle | Keep typed adapter strong; extract stable queryable fields only when product needs them |
| `sessions.agent_state` | Operational contract | agent runtime | Workflow and orchestration context for parsing, targeting, rewrite, and validation | `session-normalization.ts` normalizes defaults and nested merge behavior | Keep JSON for flexibility, but preserve explicit typed adapters |
| `sessions.generated_output` | Operational contract | generation pipeline | Durable artifact metadata for base session output | `session-normalization.ts` normalizes the artifact shape | Remain compact JSON unless artifact metadata becomes query-heavy |
| `sessions.ats_score` | Operational contract | ATS analysis pipeline | Latest structured ATS score for the base session | Session mapping treats it as structured tool output | Candidate for a dedicated typed table only if historical querying becomes important |
| `cv_versions.snapshot` | Canonical product contract | versioning | Immutable historical `CVState` snapshot | Version repositories should treat it as full `CVState` | Keep immutable JSON snapshots; do not denormalize prematurely |
| `resume_targets.derived_cv_state` | Canonical product contract | target-job pipeline | Target-specific full resume variant | `resume-targets.ts` validates with `CVStateSchema` | Keep as full snapshot contract; add extracted columns only for real query needs |
| `resume_targets.gap_analysis` | Operational contract | target-job pipeline | Structured intermediate targeting analysis | `resume-targets.ts` validates with `GapAnalysisResultSchema` | Keep JSON unless analytics/reporting needs stable relational fields |
| `resume_targets.generated_output` | Operational contract | generation pipeline | Artifact metadata for a target-specific resume | `resume-targets.ts` normalizes generated output | Keep as structured JSON |
| `user_profiles.cv_state` | Canonical product contract | profile import and profile editing | Imported or manually edited seed resume state outside sessions | `user-profiles.ts` should validate and return typed `CVState` | Tighten repository contract before considering schema extraction |
| `resume_generations.source_cv_snapshot` | Canonical product contract | billable generation pipeline | Immutable input snapshot used to render a purchased artifact | `resume-generations.ts` should validate and clone `CVState` | Keep as immutable snapshot contract |
| `resume_generations.generated_cv_state` | Canonical product contract | billable generation pipeline | Final rendered resume state stored for replay and download continuity | `resume-generations.ts` should validate and clone `CVState` | Keep as immutable snapshot contract |
| `job_applications.benefits` | Operational contract | dashboard job tracker | Flexible list of benefit labels and values | App layer treats it as structured form data | Candidate for narrowing only if filtering or analytics needs it |
| `processed_events.event_payload` | Opaque event payload | webhook and billing audit | Raw-ish provider event payload for dedupe and operator forensics | Stored intentionally as an event log seam | Keep opaque; document non-claims instead of over-typing it |

## What should be strongly typed now

- `cv_state` and full resume snapshots
- target-derived `derived_cv_state`
- structured analysis JSON such as `gap_analysis`
- artifact metadata JSON such as `generated_output`

## What stays intentionally opaque for now

- `processed_events.event_payload`

Reason:
- it is audit and idempotency support state, not product truth
- provider payload shape can drift independently of our domain model
- over-typing it would create false confidence unless the whole replay contract became first-class

## Current rules

- Stable resume truth belongs in `CVState`-shaped adapters, not raw `unknown` JSON.
- JSON that remains flexible must still have an explicit owner and a stated reason for staying flexible.
- Opaque event payloads are allowed only when the docs say they are opaque on purpose.
