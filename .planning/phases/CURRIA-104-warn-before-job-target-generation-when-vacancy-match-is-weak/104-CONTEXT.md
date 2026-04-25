## Phase 104 Context

### Goal

Warn the user with an explicit confirmation modal before generating a job-targeted resume when the current profile is a weak match for the vacancy, while preserving the existing server-side realism guard as the source of safety.

### Why This Phase Exists

CurrIA already detects weak vacancy fit in the job-targeting flow and blocks generation with a textual warning in the chat transcript. That protects the flow, but the UX is indirect: the user only sees a long assistant message and must reply again to confirm the override.

This phase upgrades that moment into a clearer frontend confirmation modal with explicit "Cancelar" and "Continuar mesmo assim" actions, without removing the backend fallback that prevents bypass.

### Repository Findings

- The weak-fit decision already exists in the agent layer:
  - `src/lib/agent/profile-review.ts`
  - `src/lib/agent/agent-loop.ts`
  - `src/lib/agent/agent-intents.ts`
- The current job-targeting generation CTA lives in:
  - `src/components/dashboard/chat-interface.tsx`
- Session snapshot data for the chat UI comes from:
  - `src/app/api/session/[id]/route.ts`
  - `src/types/dashboard.ts`
- The chat UI currently shows the `Aceito` CTA based on phase/readiness only, without explicit vacancy-fit confirmation state.
- The backend currently stores warning/override state in `agentState.phaseMeta`:
  - `careerFitWarningIssuedAt`
  - `careerFitWarningTargetJobDescription`
  - `careerFitOverrideConfirmedAt`
  - `careerFitOverrideTargetJobDescription`

### Source Of Truth Decision

- The weak-match warning decision must continue to be server-derived from the existing career-fit helpers.
- The frontend modal is a UX layer only; it must not become the only protection.
- If the client bypasses the modal and sends generation approval directly, the current backend realism-warning guard must still block or require confirmation.

### Locked Decisions

- Preserve the current chat-driven job-targeting flow and reuse the existing weak-fit logic instead of inventing a new scoring model.
- Prefer a small UI enhancement plus minimal route/typing exposure over broader agent-loop rewrites.
- Keep the backend realism-warning semantics as the fallback safety net.
- The modal should appear only when the user is about to generate a job-targeted resume and the stored fit state indicates a weak or override-required scenario.
- "Continuar mesmo assim" should let the user proceed from the modal with a single explicit confirmation action.

### Canonical References

- `src/components/dashboard/chat-interface.tsx`
- `src/components/dashboard/chat-interface.test.tsx`
- `src/components/dashboard/chat-interface.route-stream.test.tsx`
- `src/lib/agent/profile-review.ts`
- `src/lib/agent/agent-loop.ts`
- `src/lib/agent/agent-intents.ts`
- `src/lib/agent/streaming-loop.test.ts`
- `src/app/api/session/[id]/route.ts`
- `src/app/api/session/[id]/route.test.ts`
- `src/types/dashboard.ts`
- `src/types/agent.ts`

### Acceptance Targets

- When the user is about to generate a job-targeted resume for a weak-fit vacancy, the chat UI opens a confirmation modal instead of sending generation immediately.
- The modal explains the weak match and offers `Cancelar` and `Continuar mesmo assim`.
- Confirming from the modal lets the user proceed without an extra confusing manual chat round-trip.
- Backend fallback still prevents bypass if the modal is skipped.
- Tests cover the modal behavior, the exposed snapshot state, and the protected generation flow.

### Deferred / Explicit Non-Goals

- No new scoring model or vacancy-fit heuristic.
- No redesign of the broader chat interface or resume workspace.
- No migration or persistence redesign.
- No removal of the existing backend realism-warning guard.
