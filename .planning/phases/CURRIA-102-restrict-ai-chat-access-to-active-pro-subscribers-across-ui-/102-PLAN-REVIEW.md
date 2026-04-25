# Phase 102 Plan Review

Verdict: FAIL

## Summary

The plan has the right core shape for CurrIA's brownfield architecture: one server-side entitlement seam, deny-by-default behavior, preserved session ownership checks, and reuse of the existing upgrade surface. That part fits the project constraints well.

It still misses a live chat-history surface and overloads a single execution plan. In the current codebase, non-Pro users can still reach chat history through `GET /api/session` and `/dashboard/sessions`, while the plan explicitly narrows scope away from session-list and secondary navigation work. That means the phase would ship a partial lock instead of a consistent Pro-only chat policy.

## Strengths

- The plan preserves the monolith shape and keeps authorization server-side instead of trusting client props.
- Task ordering is sensible: entitlement seam first, server enforcement second, shell/sidebar wiring last.
- The plan correctly keeps session ownership checks in place instead of replacing them with plan checks.
- Reusing `PlanUpdateDialog` and the existing pricing flow matches the locked decision to avoid inventing a new billing path.

## Findings

### 1. Requirement Coverage: blocked by missing session-history surface coverage

Severity: blocker

The live product still exposes chat/session history through:

- `src/app/api/session/route.ts`
- `src/app/(auth)/dashboard/sessions/page.tsx`
- `src/components/dashboard/sessions-list.tsx`

`102-RESEARCH.md` explicitly calls out `GET /api/session`, the sessions/history dashboard entry point, and the sessions page UI if reached directly. The plan does not include any of those files, and Task 3 explicitly avoids expanding into session-list or other secondary navigation surfaces unless required.

That scope reduction is not safe here. If Phase 102 executes as written:

- non-Pro users can still list prior chat sessions through `GET /api/session`, or
- if the route later gets blocked outside the plan, `/dashboard/sessions` degrades into a misleading empty state because `SessionsList` does not check `response.ok` before treating the payload as "no sessions".

Action:

- Add coverage for `src/app/api/session/route.ts` and `src/app/api/session/route.test.ts`.
- Add direct blocked-state handling for `src/app/(auth)/dashboard/sessions/page.tsx` and `src/components/dashboard/sessions-list.tsx`.
- Keep the UI outcome explicit: blocked users should see upgrade guidance, not a silent empty list.

### 2. Scope Control: one plan is too large already, and the missing work makes it worse

Severity: blocker

The current plan already spans 17 modified files. That is beyond a safe single-plan scope for this workflow, and the missing `/api/session` plus sessions-page work would increase it further.

This is a poor fit for brownfield execution because the plan mixes:

- billing-read interpretation
- `/api/agent` stream enforcement
- per-session route gating
- `/chat` page gating
- auth-layout prop threading
- sidebar behavior
- multiple route/UI test suites

Action:

- Split into at least two plans.
- Recommended split:
- Plan A: `chat-entitlement.ts`, `quota.ts` additive changes, `/chat`, `/api/agent`, `/api/session/[id]`, `/api/session/[id]/messages`, focused route tests.
- Plan B: `GET /api/session`, `/dashboard/sessions`, `sessions-list.tsx`, auth-layout/sidebar wiring, blocked-state UI tests.

### 3. Test Coverage: affected route and integration tests are under-planned

Severity: warning

The plan only names `src/lib/agent/request-orchestrator.test.ts` for the `/api/agent` authorization change. The repo also has route-level and integration-style coverage that exercises the real route boundary:

- `src/app/api/agent/route.test.ts`
- `src/app/api/agent/route.sse.test.ts`
- `src/app/api/agent/route.model-selection.test.ts`
- `src/components/dashboard/chat-interface.route-stream.test.tsx`

`102-RESEARCH.md` already notes that many existing tests import `/api/agent` and will need a default-allow mock for the new entitlement helper. The plan should account for that blast radius explicitly.

Action:

- Add explicit test updates or a shared default-allow mock strategy for the new entitlement seam.
- Add `src/app/api/session/route.test.ts` and `src/components/dashboard/sessions-list.test.tsx` once session-history coverage is included.

### 4. Missing Risk: the "missing renewal date" brownfield case is still ambiguous in the plan

Severity: warning

The phase context and research say chat access should require a non-expired renewal date when present, and should still allow active Pro subscribers whose legacy rows are missing `renews_at`. Task 1's behavior text only states that active Pro with a non-expired renewal date is allowed, which leaves the missing-renewal case underspecified.

That ambiguity matters because a strict executor could implement "renewal date required" and create false denials for valid Pro users.

Action:

- Add an explicit allow case for `plan=pro`, `status=active`, valid subscription id, and `renews_at=null`.
- Add a dedicated test for that scenario in `src/lib/asaas/chat-entitlement.test.ts`.

### 5. Architecture Fit: `quota.ts` changes should be additive-only

Severity: warning

Including `src/lib/asaas/quota.ts` in the plan is reasonable only if the change is additive or a safe read-model extraction. `quota.ts` is shared billing infrastructure, and `getActiveRecurringSubscription()` is already used outside chat flows.

The plan should state explicitly that chat enforcement belongs in `src/lib/asaas/chat-entitlement.ts`, and any `quota.ts` change must not silently alter checkout or broader billing semantics.

Action:

- Clarify that `quota.ts` changes are limited to exposing the data needed by the entitlement helper or tightening clearly scoped recurring-state interpretation without changing non-chat contracts.

## Recommendation

Do not execute this plan as-is.

Revise it before execution by:

- covering `/api/session` and `/dashboard/sessions` as first-class chat-history surfaces
- splitting the work into at least two plans
- expanding the test plan to include route/integration consumers of `/api/agent`
- making the missing-`renews_at` allow case explicit

With those changes, the overall architecture direction is sound and should be re-reviewable as `PASS with warning`.
