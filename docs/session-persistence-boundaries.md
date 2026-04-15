---
title: Session Persistence Boundaries
audience: [developers]
related: [architecture-overview.md, developer-rules/QUALITY_BASELINE.md]
status: current
updated: 2026-04-14
---

# Session Persistence Boundaries

CurrIA keeps `src/lib/db/sessions.ts` as the stable public facade for callers, but the persistence responsibilities behind it are now split into narrower internal modules.

## Current module split

- `src/lib/db/session-normalization.ts`
  - canonical session row mapping
  - `cvState`, `agentState`, and `generatedOutput` normalization
  - `ToolPatch` merge behavior
  - state-version normalization

- `src/lib/db/session-lifecycle.ts`
  - fetch session and session list
  - create session and seed from profile
  - update session
  - apply tool patches and transactional version patches
  - lifecycle-focused orchestration only

- `src/lib/db/session-messages.ts`
  - append messages
  - read messages
  - increment `message_count` with optimistic retry behavior

- `src/lib/db/session-quota.ts`
  - quota adapter from session flows into billing quota logic

- `src/lib/db/sessions.ts`
  - compatibility facade for existing callers
  - stable exports while the internal seams stay decomposed

## Why this split

The old `sessions.ts` mixed:

- lifecycle and create
- patch merge logic
- message persistence
- quota checks
- transactional fallback behavior

That made it harder to reason about and harder to test in isolation.

The current split keeps public behavior stable while reducing the number of unrelated concerns per file.

## Extraction order

1. extract normalization and merge helpers because they are pure and low-risk
2. extract message persistence because it has a clear table boundary
3. extract quota behind a tiny adapter seam
4. move lifecycle and patch orchestration last, once the helpers are stable

This order reduces caller churn and keeps the highest-risk transactional behavior near the existing public facade until the supporting seams are already proven.
