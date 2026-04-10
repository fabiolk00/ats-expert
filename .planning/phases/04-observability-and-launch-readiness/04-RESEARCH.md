# Phase 4 Research: Observability and Launch Readiness

**Date:** 2026-04-10
**Phase:** 04-observability-and-launch-readiness

## Goal

Make CurrIA production failures easier to diagnose, reduce silent or opaque failure states in the launch funnel, and finish the milestone with a concrete launch-readiness handoff.

## Evidence Collected

### Structured logging already exists, but several fragile edges still bypass it

- `src/lib/observability/structured-log.ts` emits newline-safe JSON payloads with `level`, `event`, and flat scalar fields.
- The most sensitive billing and agent paths already use it:
  - `src/app/api/webhook/asaas/route.ts`
  - `src/app/api/checkout/route.ts`
  - `src/lib/agent/agent-loop.ts`
- The following fragile paths still rely on raw `console.*` calls or unstructured strings:
  - `src/app/api/session/route.ts`
  - `src/app/api/session/[id]/messages/route.ts`
  - `src/app/api/file/[sessionId]/route.ts`
  - `src/app/api/webhook/clerk/route.ts`
  - `src/app/(auth)/layout.tsx`
  - `src/app/(auth)/dashboard/page.tsx`
  - `src/app/(auth)/settings/page.tsx`

This is the cleanest direct gap against `OBS-01`.

### The dashboard still has at least one silent failure path in the launch-critical artifact flow

- `src/hooks/use-session-documents.ts` currently wraps `getDownloadUrls(sessionId)` with an inline `.catch(() => ({ docxUrl: null, pdfUrl: null }))`.
- Because that swallowed error lives inside the main `try`, the hook resolves to an empty file state instead of surfacing an actionable error.
- `src/components/dashboard/session-documents-panel.tsx` already has an error slot, but it almost never activates because the hook suppresses the failure first.

This means users can hit a broken file endpoint and see “no files” instead of a retryable explanation.

### Billing metadata failures are noisy for operators and invisible to users

- `src/app/(auth)/layout.tsx`, `src/app/(auth)/dashboard/page.tsx`, and `src/app/(auth)/settings/page.tsx` each call `getUserBillingInfo(appUser.id)`.
- When those reads fail, they currently emit `console.error(...)` and fall back silently.
- Phase 2 verification already surfaced this as a recurring non-blocking log source during mocked browser runs.

Phase 4 should treat these reads as optional-but-important:

- operators need structured context when they fail
- users need a safe, non-blocking notice instead of a silent disappearance of plan and credit information

### Profile import has the right backend state model, but its client-facing failures are still generic

- `src/lib/linkedin/import-jobs.ts` persists terminal `error_message` values for failed imports.
- `src/app/api/profile/status/[jobId]/route.ts` does not currently return a safe client-facing failure message for failed jobs.
- `src/components/resume/resume-builder.tsx` handles `status === 'failed'` with a generic toast only.
- `src/app/api/profile/extract/route.ts` still returns a mix of English and generic error text.

This is directly relevant to the phase goal because profile import is a named fragile path in the roadmap success criteria.

### The current logging documentation is stale relative to the shipped logger

- `docs/logging.md` still describes a `message` + `metadata` log envelope.
- `src/lib/observability/structured-log.ts` now emits a flatter shape with `event` and top-level fields.

If Phase 4 is about diagnosability, the docs used for incident response need to match the actual log payload the code emits today.

### Launch readiness now depends more on operational handoff than on new runtime breadth

Phases 1 through 3 already delivered:

- env-contract alignment and fail-fast provider setup
- a Chromium-first browser lane for the core funnel
- live billing settlement proof with replay and duplicate-delivery evidence

That means the final launch decision should summarize:

- what is now automated
- where structured logs exist
- which failures degrade gracefully for users
- any residual caveats that remain after the observability pass

## Recommended Plan Split

### Wave 1

- `04-01`: Standardize structured logging on fragile server routes and optional billing metadata reads.

This creates the operational baseline first so any remaining failures in later work are already diagnosable.

### Wave 2

- `04-02`: Tighten user-facing error translation across billing display, profile import, and generated-artifact retrieval.

This uses the observability foundation from Wave 1 while focusing the UI on actionable, non-scary failure states.

### Wave 3

- `04-03`: Update the observability and launch-readiness docs, run the final proof set, and capture the milestone handoff.

This should be last because it needs to describe the implementation that actually shipped in Waves 1 and 2.

## Risks and Constraints

- Logging must stay secret-safe. Error serialization should preserve message, code, and status without leaking stacks or raw payloads.
- Billing metadata reads are non-blocking for the workspace, so user-facing copy should be informative without making the app feel broken when the core workspace still works.
- Profile import failure messages should stay user-safe even if upstream LinkdAPI or database errors are more specific internally.
- The final launch-readiness summary should not claim “fully done” if verification still reveals a caveat. It must capture the real go/no-go state, not aspirational status.
- Phase 4 should stay targeted. The repo already contains large sensitive modules, so broad architecture churn is the wrong tradeoff for the last hardening phase.

## Validation Architecture

### Automated proof

1. Keep `npm run typecheck` green across every wave.
2. Add targeted Vitest coverage for the newly structured route logging and billing-read diagnostics.
3. Add targeted coverage for user-facing failure translation in:
   - generated-artifact retrieval
   - profile import start and polling
   - auth layout fallback rendering
4. Run deterministic static audits over the launch-readiness docs so the handoff references the real command set from Phases 1 to 4.

### Manual or operator proof

1. Confirm the dashboard still renders when billing metadata is unavailable, but now shows a non-blocking notice.
2. Confirm a broken document fetch surfaces a retryable UI error instead of silently hiding the files panel.
3. Confirm a failed LinkedIn import returns a safe, actionable message rather than a dead-end generic toast.

### Success signal for Phase 4

Phase 4 can be considered complete only when all of the following are true:

- fragile server and webhook paths emit structured logs with request or entity context
- billing metadata failures are diagnosable for operators and understandable for users
- profile import and generated-document failures surface actionable user-safe messages
- launch readiness is summarized in committed docs that match the real code and proof commands
