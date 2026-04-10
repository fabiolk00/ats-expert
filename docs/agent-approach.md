---
title: CurrIA Agent Approach
audience: [product-managers, developers, operations]
related:
  - CONCEPTS.md
  - FEATURES.md
  - architecture-overview.md
  - state-model.md
status: current
updated: 2026-04-06
---

# CurrIA Agent Approach

This document describes how the live CurrIA assistant is expected to reason, what context it receives, and which parts of the approach are enforced in the backend instead of relying only on the model.

## Product goals

The assistant should be:
- useful for resume optimization
- honest about the user's current fit for a target role
- responsive in the chat
- durable across refreshes and reconnects

The assistant should not:
- pretend a clearly weak-fit target is realistic just because the user asked for it
- ask again for a job description that was already pasted in the current or recent turns
- depend entirely on the LLM to notice obvious structured vacancy text

## Current runtime approach

### 1. Durable session-first chat

For new sessions, `/api/agent` now exposes the session ID immediately through:
- `X-Session-Id` response header
- `sessionCreated` as the first SSE event

This allows the frontend to persist `?session=<id>` before the model finishes.

### 2. Backend target detection

Before the model loop starts, the route inspects the current user message.

If the message looks like a pasted vacancy, the route can persist:
- `agentState.targetJobDescription`

Detection is heuristic, but intentionally conservative. It looks for a combination of:
- hiring-language signals such as responsibilities or requirements
- job-role signals such as analyst, engineer, BI, data, developer, etc.
- structured vacancy formatting
- sufficient message length

This means the targeting flow no longer depends entirely on the model deciding to call `analyze_gap` first.

### 3. Deterministic analysis bootstrap

If a high-confidence vacancy is detected and the session already has enough resume context, the first analysis turn can bootstrap:
- ATS scoring
- structured gap analysis
- a stored fit judgment

This is done server-side, so the first answer can already be grounded in:
- the target job
- the gap between resume and role
- a stored fit judgment
- without exposing bootstrap tool noise as user-visible chat content

### 4. Honest fit guidance

The assistant is explicitly instructed to judge fit honestly.

Current fit levels:
- `strong`
- `partial`
- `weak`

Expected behavior:
- `strong`: acknowledge the fit and focus on sharper alignment
- `partial`: explain the overlap and the real gaps in stack, domain, or seniority
- `weak`: say clearly that the role is not a strong fit today and avoid overselling resume edits as a full solution

The goal is to be credible and useful, not merely encouraging.

## Stored operational context

The live runtime can now carry the following targeting context in `agentState`:
- `targetJobDescription`
- `gapAnalysis`
- `targetFitAssessment`

These fields are operational context only.

They do not belong in:
- canonical `cvState`
- `generatedOutput`
- immutable `cv_versions`

## How the fit is derived today

`targetFitAssessment` is currently derived from structured `gapAnalysis`, not from free-form model prose.

Inputs considered:
- `matchScore`
- missing skill count
- weak area count

This keeps the fit judgment:
- deterministic
- testable
- reusable across the route and tool flows

## When stale targeting context must be cleared

If the active target job changes, stale targeting context must not survive.

When a new target is persisted, the system should clear old:
- `gapAnalysis`
- `targetFitAssessment`

before recalculating the new values.

## Tool loop responsibilities vs route responsibilities

The route may now do some operational targeting work before the loop:
- detect the target job
- persist target context
- bootstrap ATS and gap context deterministically when appropriate

The tool loop remains responsible for:
- conversational tool use
- validated canonical resume changes
- explicit user-facing targeting actions
- generation and rewrite flows

This split is intentional. It keeps the system less fragile when the user pastes a full vacancy and expects the assistant to notice immediately.

## Current limitations

The current approach is significantly more robust than prompt-only targeting, but it is still not perfect.

Known limitations:
- vacancy detection is heuristic, not a guaranteed classifier
- fit is derived from resume-vs-job structure, not from a deeper labor-market model
- the assistant can still phrase things imperfectly even with better context
- the first analysis turn can still fail if the source resume is too sparse or the job description is too noisy

That said, the system is now protected at two layers:
- backend state bootstrap
- model prompt and tool guidance

## Related documentation

- [CONCEPTS.md](./CONCEPTS.md)
- [FEATURES.md](./FEATURES.md)
- [architecture-overview.md](./architecture-overview.md)
- [state-model.md](./state-model.md)
- [developer-rules/API_CONVENTIONS.md](./developer-rules/API_CONVENTIONS.md)
