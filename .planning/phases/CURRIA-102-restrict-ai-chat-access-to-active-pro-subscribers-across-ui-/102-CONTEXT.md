## Phase 102 Context

### Goal

Restrict the AI chat so that only authenticated users with an active Pro subscription can access it across the frontend and server-side chat surfaces.

### Why This Phase Exists

The current chat stack allows any authenticated user to open `/chat`, load session snapshots, fetch chat history, and send messages through `/api/agent`. Billing metadata already exists, but chat access is not centralized around a Pro-only entitlement check.

This phase closes that gap by introducing one reusable authorization seam and applying it consistently to the chat UI and protected API routes.

### Repository Findings

- Stack: Next.js 14 App Router, React 18, TypeScript, Clerk auth, Supabase/Postgres data access, Prisma schema, Asaas billing.
- Runtime billing source: `user_quotas` holds plan and recurring-subscription metadata; `credit_accounts` holds runtime credit balances.
- Existing billing helpers live in `src/lib/asaas/quota.ts` and `src/lib/asaas/optional-billing-info.ts`.
- Current chat entry points:
  - `src/app/(auth)/chat/page.tsx`
  - `src/components/dashboard/resume-workspace.tsx`
  - `src/components/dashboard/chat-interface.tsx`
  - `src/components/dashboard/sidebar.tsx`
- Current server chat surfaces:
  - `src/lib/agent/request-orchestrator.ts` via `/api/agent`
  - `src/app/api/session/[id]/route.ts`
  - `src/app/api/session/[id]/messages/route.ts`

### Source Of Truth Decision

- The client is not a trusted source of entitlement state.
- The authorization decision must be server-side and deny by default.
- The most reliable current source for chat entitlement is the recurring subscription metadata stored on `user_quotas`, interpreted through a centralized server helper.
- For this phase, AI chat access must require:
  - authenticated app user
  - plan `pro`
  - recurring subscription status `active`
  - valid recurring subscription id
  - non-expired renewal date when present
- Monthly, unit, free, missing, canceled, past-due, or ambiguous states must all be denied.

### Locked Decisions

- Preserve the current monolith shape; add a small reusable authorization seam rather than rewriting billing or chat flows.
- Keep the entitlement check in the server layer and reuse it from routes/pages/components as needed.
- Apply the same rule to every chat-related route touched in this phase; do not rely on hiding UI alone.
- Keep ownership checks for sessions/history in place and layer plan authorization on top.
- Reuse the existing pricing/upgrade surface (`/precos` or the existing plan dialog) for non-Pro CTA paths instead of inventing a new billing flow.

### Canonical References

- `src/lib/asaas/quota.ts`
- `src/lib/asaas/optional-billing-info.ts`
- `src/app/(auth)/chat/page.tsx`
- `src/components/dashboard/resume-workspace.tsx`
- `src/components/dashboard/chat-interface.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/lib/agent/request-orchestrator.ts`
- `src/app/api/session/[id]/route.ts`
- `src/app/api/session/[id]/messages/route.ts`
- `src/lib/plans.ts`

### Acceptance Targets

- Non-authenticated users still fail closed on protected chat routes.
- Free, unit, monthly, expired, canceled, or missing-subscription users cannot use AI chat.
- Active Pro subscribers can access chat normally.
- Server routes reject unauthorized chat access even if the frontend is bypassed.
- The chat page and primary entry points show a clear Pro-only block with upgrade guidance.
- Tests cover backend authorization, ownership protection, and frontend gating.

### Deferred / Explicit Non-Goals

- No schema rewrite unless implementation proves it is truly necessary.
- No billing-provider redesign or webhook redesign.
- No new plan model if the current billing metadata is sufficient.
- No expansion of chat entitlements to other paid plans in this phase.
