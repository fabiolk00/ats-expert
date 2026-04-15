---
title: LGPD Data Handling
audience: [developers, operators]
related:
  - ENVIRONMENT_SETUP.md
  - state-model.md
  - operations/secret-boundaries-and-e2e-auth.md
status: current
updated: 2026-04-14
---

# LGPD Data Handling

This document defines CurrIA's engineering contract for LGPD-sensitive resume, vacancy, and generated-artifact data.

It is not legal advice. It is the operational baseline the codebase and runbooks must follow.

## Data Classes

| Data class                    | Examples                                                                    | Primary seams                                       | Default retention                                                                | Deletion expectation                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Canonical profile data        | `cvState`, manual profile fields, imported PDF profile fields               | profile routes, session creation, resume generation | retained while the account or workspace remains active                           | delete from database records and derived artifacts when the user requests account or resume deletion      |
| Vacancy and targeting context | target job description, gap analysis, targeting plan, target fit assessment | `/api/agent`, job-targeting pipeline, session state | retained with the owning session or target resume                                | delete with the owning session or explicit user deletion request                                          |
| Generated resume artifacts    | persisted `cv_versions`, generated PDF metadata, storage objects            | resume generation, export, versioning               | retained while the owning version is active                                      | delete stored files and version records together                                                          |
| Ephemeral import jobs         | LinkedIn import jobs, PDF import jobs                                       | async import orchestration and polling routes       | short-lived only                                                                 | automatic cleanup via cron after the operational retention window                                         |
| Audit and billing metadata    | processed webhook events, credit transactions, structured logs              | billing webhooks, quota tracking, operator logs     | minimum period needed for idempotency, billing traceability, and incident review | age out operational records automatically where possible; keep logs free of raw resume or vacancy content |

## Handling Rules

- Treat resumes, job descriptions, and generated resume content as personal data.
- Treat raw resume text, parsed vacancy text, and storage artifact paths as server-only data.
- Do not log full resume bodies, job descriptions, or generated resume text in structured logs.
- `cvState` remains the canonical resume truth. `agentState` may reference operational context, but should not become a second uncontrolled source of personal data.
- Derived resume versions must preserve factual accuracy and remain traceable to the originating session or target context.

## Retention Contract

CurrIA currently enforces short retention automatically only for explicitly ephemeral operational records:

- processed webhook events are cleaned by the cleanup cron after 30 days
- LinkedIn import jobs are cleaned by the cleanup cron after 1 day
- PDF import jobs are cleaned by the cleanup cron after 1 day

Canonical user profile data, session state, target-job state, and persisted resume versions are intentionally durable product records. Until a dedicated self-serve deletion flow exists, they must be treated as retained until one of these happens:

1. the user deletes the owning account through a supported product flow
2. support or operations executes a verified deletion request
3. a future retention automation phase introduces an explicit TTL for a specific class

## Deletion Contract

When CurrIA fulfills a verified deletion request, operators must delete both the primary record and its obvious derivatives:

1. canonical user profile data
2. session records that embed resume or vacancy context
3. target resume and ATS-enhancement versions
4. generated storage artifacts linked to those versions
5. leftover import jobs tied to the same user when present

Processed billing events, quota ledgers, and audit trails should only be retained when required for billing integrity, abuse prevention, or accounting review. They must not embed raw resume or vacancy text.

## Implementation Seams

- `src/app/api/profile/**` handles inbound profile and import data
- `src/app/api/agent/**` and `src/lib/agent/**` handle vacancy and rewrite context
- `src/lib/db/cv-versions.ts` and resume-generation flows handle persisted resume artifacts
- `src/app/api/cron/cleanup/route.ts` enforces the current cleanup window for ephemeral operational records

## Review Checklist

Before shipping code that touches resume or vacancy flows:

- confirm no raw personal content was added to logs
- confirm new stored fields have an owning record and deletion path
- confirm new background or import tables have an explicit retention rule
- update this document when a new data class is introduced
