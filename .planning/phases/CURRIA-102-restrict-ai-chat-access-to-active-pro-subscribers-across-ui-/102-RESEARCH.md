# Phase 102: Restrict AI Chat Access to Active Pro Subscribers Across UI and API - Research

**Researched:** 2026-04-25
**Domain:** Chat entitlement enforcement over billing metadata in a Next.js monolith
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md`. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

### Locked Decisions

- Preserve the current monolith shape; add a small reusable authorization seam rather than rewriting billing or chat flows.
- Keep the entitlement check in the server layer and reuse it from routes/pages/components as needed.
- Apply the same rule to every chat-related route touched in this phase; do not rely on hiding UI alone.
- Keep ownership checks for sessions/history in place and layer plan authorization on top.
- Reuse the existing pricing/upgrade surface (`/precos` or the existing plan dialog) for non-Pro CTA paths instead of inventing a new billing flow.

### Claude's Discretion

Not present in `102-CONTEXT.md`. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)

- No schema rewrite unless implementation proves it is truly necessary.
- No billing-provider redesign or webhook redesign.
- No new plan model if the current billing metadata is sufficient.
- No expansion of chat entitlements to other paid plans in this phase.
</user_constraints>

## Summary

The current chat stack authenticates the user, but it does not centralize a Pro-only authorization decision. `/chat` derives `activeRecurringPlan` from `loadOptionalBillingInfo()`, which is a fail-soft UI helper, while the actual chat server seams still allow any authenticated owner through `/api/agent`, `GET /api/session/[id]`, and `GET /api/session/[id]/messages`. [VERIFIED: C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/lib/asaas/optional-billing-info.ts, C:/CurrIA/src/lib/agent/request-orchestrator.ts, C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts]

The strongest current entitlement source is the `user_quotas` row, specifically `plan`, `status`, `asaas_subscription_id`, and `renews_at`. `credit_accounts` is authoritative for runtime credits, not plan entitlements, and the existing `hasActiveRecurringSubscription` view-model is intentionally broader than Phase 102 because it treats both `monthly` and `pro` as active recurring plans. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/prisma/schema.prisma, C:/CurrIA/docs/billing/IMPLEMENTATION.md]

The smallest architecture-aligned seam is a new server-only helper next to the existing quota helpers, for example `getProChatAccessDecision(appUserId)`, backed only by `user_quotas`. Use that helper from `/chat`, `/api/agent`, `GET /api/session`, `GET /api/session/[id]`, and `GET /api/session/[id]/messages`, while keeping existing auth and ownership checks intact for entitled users. Protect the UI as a convenience layer, but keep API denial authoritative. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md, C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/api/session/route.ts, C:/CurrIA/src/components/dashboard/sidebar.tsx, C:/CurrIA/src/components/dashboard/session-list.tsx, C:/CurrIA/src/components/dashboard/sessions-list.tsx, C:/CurrIA/src/app/(auth)/settings/page.tsx]

**Primary recommendation:** Add `getProChatAccessDecision(appUserId)` in the billing-domain server seam, query only `user_quotas`, deny by default, and gate `/chat` plus every chat-adjacent API surface with the same decision object. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

## Project Constraints (from CLAUDE.md)

- Preserve the existing brownfield product surface unless the user explicitly changes scope. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Prefer reliability, billing safety, observability, and verification over net-new feature breadth. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Stay within the current monolith and prefer small, test-backed changes over broad rewrites. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Keep route handlers thin, validate external input with `zod`, and prefer structured server logs through `logInfo`, `logWarn`, and `logError`. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Keep the client relatively shallow and leave sensitive decisions server-side. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Preserve `cvState` as canonical resume truth and `agentState` as operational context only; do not use this phase to reopen agent-state semantics. [VERIFIED: C:/CurrIA/CLAUDE.md]
- Use `@/*` imports, kebab-case filenames, camelCase functions, and named exports except where Next.js expects defaults. [VERIFIED: C:/CurrIA/CLAUDE.md]

## Standard Stack

Use the existing stack and add no packages in Phase 102. The problem is authorization policy placement, not library capability. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/package.json]

**Version verification:** Repo-pinned and current-registry checks captured on 2026-04-25. [VERIFIED: C:/CurrIA/package.json, npm registry]

- `next`: repo `14.2.3`; registry current `16.2.4`; registry modified `2026-04-18T23:43:24.763Z`. [VERIFIED: C:/CurrIA/package.json, npm registry]
- `@clerk/nextjs`: repo `^5.0.0`; registry current `7.2.7`; registry modified `2026-04-25T02:53:31.923Z`. [VERIFIED: C:/CurrIA/package.json, npm registry]
- `zod`: repo `^3.23.8`; registry current `4.3.6`; registry modified `2026-01-25T21:51:57.252Z`. [VERIFIED: C:/CurrIA/package.json, npm registry]
- `vitest`: repo `^1.6.0`; registry current `4.1.5`; registry modified `2026-04-23T10:30:15.171Z`. [VERIFIED: C:/CurrIA/package.json, npm registry]

### Core

| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|---------|
| Next.js App Router | Repo `14.2.3`; registry current `16.2.4` [VERIFIED: package.json, npm registry] | Server pages and route handlers for `/chat` and `/api/**`. [VERIFIED: C:/CurrIA/package.json, C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/app/api/agent/route.ts] | The repo is already pinned here and Phase 102 is brownfield hardening, not a framework upgrade. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/package.json] |
| Clerk auth boundary | Repo `^5.0.0`; registry current `7.2.7` [VERIFIED: package.json, npm registry] | Resolve the authenticated Clerk user and internal app user before entitlement checks. [VERIFIED: C:/CurrIA/src/lib/auth/app-user.ts] | Current auth resolution already lives here; entitlement should layer after auth, not replace it. [VERIFIED: C:/CurrIA/src/lib/auth/app-user.ts, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] |
| `src/lib/asaas/quota.ts` | Repo-local [VERIFIED: codebase] | Current recurring-plan, `user_quotas`, and billing-status helpers already live here. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts] | The smallest safe seam is to add a chat-specific helper here without changing checkout semantics elsewhere. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/api/checkout/route.ts] |
| `user_quotas` metadata | Prisma schema current [VERIFIED: C:/CurrIA/prisma/schema.prisma] | Store `plan`, `status`, `asaas_subscription_id`, and `renews_at` for recurring-plan decisions. [VERIFIED: C:/CurrIA/prisma/schema.prisma, C:/CurrIA/docs/billing/IMPLEMENTATION.md] | Billing docs and code both treat this table as metadata/display state; it is the correct entitlement source for this phase. [VERIFIED: C:/CurrIA/docs/billing/IMPLEMENTATION.md, C:/CurrIA/src/lib/asaas/quota.ts] |

### Supporting

| Library / Module | Version | Purpose | When to Use |
|---------|---------|---------|---------|
| `src/components/dashboard/plan-update-dialog.tsx` | Repo-local [VERIFIED: codebase] | Existing in-app upgrade surface with `/finalizar-compra` navigation and monthly-plan restrictions. [VERIFIED: C:/CurrIA/src/components/dashboard/plan-update-dialog.tsx] | Use when a blocked chat entry point should keep the user inside the authenticated shell instead of hard-redirecting to `/precos`. [VERIFIED: C:/CurrIA/src/components/dashboard/plan-update-dialog.tsx, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] |
| `src/lib/dashboard/workspace-client.ts` | Repo-local [VERIFIED: codebase] | Existing client fetch wrapper that preserves HTTP `status` and optional `code`. [VERIFIED: C:/CurrIA/src/lib/dashboard/workspace-client.ts] | Reuse if the client needs an explicit 403 entitlement UX when access is lost mid-session. [VERIFIED: C:/CurrIA/src/lib/dashboard/workspace-client.ts, C:/CurrIA/src/components/dashboard/chat-interface.tsx] |
| Vitest | Repo `^1.6.0`; registry current `4.1.5` [VERIFIED: package.json, npm registry] | Existing unit/component/route regression framework. [VERIFIED: C:/CurrIA/package.json, C:/CurrIA/vitest.config.ts] | Extend existing tests instead of adding a new test harness. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/vitest.config.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `loadOptionalBillingInfo()` for authorization [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts] | `getProChatAccessDecision(appUserId)` over `user_quotas` only [VERIFIED: recommendation derived from C:/CurrIA/src/lib/asaas/quota.ts] | `loadOptionalBillingInfo()` is intentionally fail-soft and fetches more than authorization needs, so it is wrong for deny-by-default access control. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts, C:/CurrIA/src/lib/asaas/quota.ts] |
| `getUserBillingInfo().hasActiveRecurringSubscription` [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts] | A new Pro-only evaluator [VERIFIED: recommendation derived from C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] | The current flag returns `true` for both `monthly` and `pro`, which is broader than the Phase 102 contract. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/(auth)/chat/page.tsx] |
| `PLANS` marketing copy or `credit_accounts` as entitlement source [VERIFIED: C:/CurrIA/src/lib/plans.ts, C:/CurrIA/docs/billing/IMPLEMENTATION.md] | `user_quotas.plan/status/asaas_subscription_id/renews_at` [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/prisma/schema.prisma] | Marketing copy currently advertises chat on `unit` and `monthly`, and `credit_accounts` only tracks balance; neither encodes the new Pro-only rule. [VERIFIED: C:/CurrIA/src/lib/plans.ts, C:/CurrIA/docs/billing/IMPLEMENTATION.md] |
| Rewriting `getActiveRecurringSubscription()` to be Pro-only [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/api/checkout/route.ts] | Keep checkout helper semantics unchanged and add a chat-specific helper beside it [VERIFIED: recommendation derived from codebase] | Checkout validation intentionally treats both `monthly` and `pro` as active recurring plans; changing that helper would risk billing regressions outside chat. [VERIFIED: C:/CurrIA/src/app/api/checkout/route.ts, C:/CurrIA/src/lib/asaas/quota.ts] |

**Installation:** None - no dependency additions are recommended for Phase 102. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/package.json]

## Architecture Patterns

### Recommended Project Structure

```text
src/
|-- app/(auth)/chat/page.tsx                  # Server page gate + blocked UI state
|-- app/(auth)/dashboard/sessions/page.tsx    # Optional page-level blocker for session-list entry surface
|-- app/api/agent/route.ts                    # Thin wrapper; auth + entitlement enforced in orchestrator
|-- app/api/session/route.ts                  # Session-list API if treated as chat-adjacent
|-- app/api/session/[id]/route.ts             # Session snapshot gate
|-- app/api/session/[id]/messages/route.ts    # Transcript gate
`-- lib/asaas/quota.ts                        # New Pro-chat decision helper beside existing quota helpers
```

### Pattern 1: Billing-Domain Entitlement Helper

**What:** Add one new server-only helper that reads only `user_quotas.plan`, `status`, `asaas_subscription_id`, and `renews_at`, then returns `{ allowed, reason, plan, status, renewsAt }`. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/prisma/schema.prisma]

**When to use:** Any server page, route handler, or server action that opens, resumes, lists, or mutates chat state. [VERIFIED: C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/lib/agent/request-orchestrator.ts, C:/CurrIA/src/app/api/session/route.ts, C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts]

**Example:**

```typescript
// Source pattern: src/lib/asaas/quota.ts + src/app/api/checkout/route.ts [VERIFIED: codebase]
type ProChatAccessReason =
  | "allowed"
  | "missing_billing_row"
  | "plan_not_pro"
  | "status_not_active"
  | "missing_subscription_id"
  | "renewal_expired"
  | "unknown_status"

type ProChatAccessDecision = {
  allowed: boolean
  reason: ProChatAccessReason
  plan: string | null
  status: string | null
  renewsAt: string | null
}

export async function getProChatAccessDecision(appUserId: string): Promise<ProChatAccessDecision> {
  // Query user_quotas only.
  // Deny unless plan === "pro", status === "active", subscription id is present,
  // and renews_at is either null or still in the future.
}
```

### Pattern 2: Page-First Blocker, API-First Authority

**What:** Gate `/chat` in the server page so blocked users do not mount `ResumeWorkspace`, then repeat the same decision in chat APIs so bypassing the UI still fails closed. [VERIFIED: C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/components/dashboard/resume-workspace.tsx, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

**When to use:** Direct `/chat` visits, sidebar `"Nova conversa"`, session cards, and any client refresh path that reaches `/api/agent` or `/api/session/**`. [VERIFIED: C:/CurrIA/src/components/dashboard/sidebar.tsx, C:/CurrIA/src/components/dashboard/session-list.tsx, C:/CurrIA/src/components/dashboard/sessions-list.tsx, C:/CurrIA/src/components/dashboard/chat-interface.tsx]

**Example:**

```typescript
// Source pattern: src/app/(auth)/chat/page.tsx + src/lib/auth/app-user.ts [VERIFIED: codebase]
const appUser = await getCurrentAppUser()
if (!appUser) {
  redirect("/entrar")
}

const chatAccess = await getProChatAccessDecision(appUser.id)
if (!chatAccess.allowed) {
  return <ChatUpgradeBlock reason={chatAccess.reason} />
}

return <ResumeWorkspace ... />
```

### Pattern 3: Entitlement Before Content, Ownership After Entitlement

**What:** Authenticate first, check Pro entitlement second, then keep the existing owner-scoped `getSession(params.id, appUser.id)` lookup for entitled users. [VERIFIED: C:/CurrIA/src/lib/auth/app-user.ts, C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts]

**When to use:** `GET /api/session/[id]` and `GET /api/session/[id]/messages`. [VERIFIED: C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts]

**Example:**

```typescript
// Source pattern: src/app/api/session/[id]/messages/route.ts [VERIFIED: codebase]
const appUser = await getCurrentAppUser()
if (!appUser) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

const chatAccess = await getProChatAccessDecision(appUser.id)
if (!chatAccess.allowed) {
  return NextResponse.json(
    { error: "Chat Pro required.", code: "PRO_SUBSCRIPTION_REQUIRED" },
    { status: 403 },
  )
}

const session = await getSession(params.id, appUser.id)
if (!session) {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
```

### Anti-Patterns to Avoid

- **`loadOptionalBillingInfo()` as an auth dependency:** It swallows failures and intentionally keeps the rest of the workspace available, which is the wrong contract for deny-by-default authorization. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts]
- **Using `hasActiveRecurringSubscription` as the chat gate:** That flag is true for both `monthly` and `pro`. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts]
- **Using `currentCredits` or 402 credit-exhaustion logic as a proxy for plan access:** The current chat client only special-cases credits and stale sessions; it does not represent Pro entitlement. [VERIFIED: C:/CurrIA/src/components/dashboard/chat-interface.tsx]
- **Frontend-only protection:** Current server chat seams are callable directly and must deny on the server. [VERIFIED: C:/CurrIA/src/lib/agent/request-orchestrator.ts, C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts]
- **Changing checkout recurring-plan semantics while solving chat:** `getActiveRecurringSubscription()` currently protects monthly checkout flows and should not be narrowed for this phase. [VERIFIED: C:/CurrIA/src/app/api/checkout/route.ts, C:/CurrIA/src/lib/asaas/quota.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pro chat entitlement | Repeated route-local booleans or client-state checks [VERIFIED: codebase gap] | One server-only helper over `user_quotas` [VERIFIED: recommendation derived from C:/CurrIA/src/lib/asaas/quota.ts] | Centralization is the only reliable way to keep `/chat`, `/api/agent`, and `/api/session/**` aligned. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] |
| Upgrade CTA | A new billing flow or a second paywall surface [VERIFIED: locked decision] | Existing `/precos` or `PlanUpdateDialog` [VERIFIED: C:/CurrIA/src/components/dashboard/plan-update-dialog.tsx, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] | The repo already has upgrade surfaces and checkout rules; this phase is access control, not billing redesign. [VERIFIED: C:/CurrIA/src/components/dashboard/plan-update-dialog.tsx, C:/CurrIA/src/app/api/checkout/route.ts] |
| Session ownership | New custom ownership SQL or ID parsing [VERIFIED: current route pattern] | Existing `getSession(params.id, appUser.id)` and owner-scoped session list queries [VERIFIED: C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts, C:/CurrIA/src/app/api/session/route.ts] | The owner guard already exists; the phase only needs to layer plan access on top. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] |

**Key insight:** This phase should centralize an authorization decision, not redesign billing, credits, checkout, or session persistence. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Reusing the Existing Recurring-Plan Flag

**What goes wrong:** `monthly` users get chat because `hasActiveRecurringSubscription` and `activeRecurringPlan` currently treat `monthly` and `pro` the same. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/(auth)/chat/page.tsx]

**Why it happens:** Those helpers were built for recurring-plan display and checkout restrictions, not a Pro-only product gate. [VERIFIED: C:/CurrIA/src/app/api/checkout/route.ts, C:/CurrIA/src/lib/asaas/quota.ts]

**How to avoid:** Add a separate chat-specific helper and leave existing recurring-plan helpers unchanged. [VERIFIED: recommendation derived from codebase]

**Warning signs:** A `monthly` user renders `ResumeWorkspace` or receives 200 from `/api/agent`. [VERIFIED: C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/lib/agent/request-orchestrator.ts]

### Pitfall 2: Using the Optional Billing Surface for Authorization

**What goes wrong:** Authorization silently depends on a UI helper that swallows failures and merges credit balance data that the chat gate does not need. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts, C:/CurrIA/src/lib/asaas/quota.ts]

**Why it happens:** `loadOptionalBillingInfo()` exists to keep the dashboard usable when billing display data fails, not to make hard access decisions. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts]

**How to avoid:** Query `user_quotas` directly in a required helper and reserve `loadOptionalBillingInfo()` for non-authoritative display props. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts, C:/CurrIA/src/lib/asaas/quota.ts]

**Warning signs:** `/chat` still mounts even when billing lookup fails, or plan authorization depends on `creditsRemaining`. [VERIFIED: C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/components/dashboard/chat-interface.tsx]

### Pitfall 3: Treating `expired` as a Stored App Status

**What goes wrong:** The implementation checks for a string status that the app does not currently persist, so expired subscriptions slip through or get mishandled. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/lib/asaas/event-handlers.ts]

**Why it happens:** Raw Asaas statuses like `EXPIRED` are normalized into persisted app states, and the current normalized app states are `active`, `past_due`, and `canceled`. [VERIFIED: C:/CurrIA/src/lib/asaas/event-handlers.ts, C:/CurrIA/docs/billing/IMPLEMENTATION.md]

**How to avoid:** Treat `"expired"` as either `status !== active` after normalization or as `renews_at` being in the past when `status` still reads `active`. [VERIFIED: C:/CurrIA/src/lib/asaas/event-handlers.ts, C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

**Warning signs:** Code branches on `status === "expired"` inside app-side helpers. [VERIFIED: codebase grep]

### Pitfall 4: Trusting Pricing Copy or Stale Access-Control Docs

**What goes wrong:** The planner accidentally derives entitlement from feature copy or stale docs instead of current schema and billing code. [VERIFIED: C:/CurrIA/src/lib/plans.ts, C:/CurrIA/docs/features/FEATURE_ACCESS_CONTROL.md, C:/CurrIA/docs/features/ACCESS_CONTROL_DEBUGGING.md, C:/CurrIA/prisma/schema.prisma]

**Why it happens:** `PLANS.unit.features` includes `"Chat com IA"` and `PLANS.monthly.features` includes `"Chat iterativo com IA"`, while older docs still reference `plan_tier` and `starter`, which do not match the current schema. [VERIFIED: C:/CurrIA/src/lib/plans.ts, C:/CurrIA/docs/features/FEATURE_ACCESS_CONTROL.md, C:/CurrIA/docs/features/ACCESS_CONTROL_DEBUGGING.md, C:/CurrIA/prisma/schema.prisma]

**How to avoid:** Treat `user_quotas.plan/status/asaas_subscription_id/renews_at` as authoritative and ignore older feature-access docs for this phase. [VERIFIED: C:/CurrIA/prisma/schema.prisma, C:/CurrIA/src/lib/asaas/quota.ts]

**Warning signs:** New code mentions `plan_tier`, `starter`, or `PLANS[plan].features.includes("Chat")`. [VERIFIED: codebase grep, C:/CurrIA/src/lib/plans.ts]

## Code Examples

Verified implementation-shape examples derived from current repo patterns:

### Pro Chat Decision Helper

```typescript
// Source patterns:
// - src/lib/asaas/quota.ts
// - src/app/api/checkout/route.ts
// [VERIFIED: codebase]
type ProChatAccessDecision = {
  allowed: boolean
  reason:
    | "allowed"
    | "missing_billing_row"
    | "plan_not_pro"
    | "status_not_active"
    | "missing_subscription_id"
    | "renewal_expired"
    | "unknown_status"
  plan: string | null
  status: string | null
  renewsAt: string | null
}

// Query only user_quotas and deny by default.
```

### Thin Route Guard

```typescript
// Source pattern:
// - src/app/api/session/[id]/messages/route.ts
// - src/lib/auth/app-user.ts
// [VERIFIED: codebase]
const appUser = await getCurrentAppUser()
if (!appUser) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

const access = await getProChatAccessDecision(appUser.id)
if (!access.allowed) {
  logWarn("chat.access.denied", {
    appUserId: appUser.id,
    reason: access.reason,
    requestPath: req.nextUrl.pathname,
    success: false,
  })

  return NextResponse.json(
    { error: "Acesso ao chat disponivel apenas no Pro ativo.", code: "PRO_SUBSCRIPTION_REQUIRED" },
    { status: 403 },
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Using `activeRecurringPlan` or `hasActiveRecurringSubscription` as a broad recurring-plan display flag. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/src/app/(auth)/chat/page.tsx, C:/CurrIA/src/app/(auth)/layout.tsx] | Current billing docs explicitly separate `credit_accounts` runtime balance from `user_quotas` billing metadata, and Phase 102 needs a Pro-only server entitlement helper over `user_quotas`. [VERIFIED: C:/CurrIA/docs/billing/IMPLEMENTATION.md, C:/CurrIA/src/lib/asaas/quota.ts, C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md] | Billing docs current as of `2026-04-14`; Phase 102 research captured on `2026-04-25`. [VERIFIED: C:/CurrIA/docs/billing/IMPLEMENTATION.md] | Chat authorization should not depend on credits or broad recurring flags. [VERIFIED: C:/CurrIA/docs/billing/IMPLEMENTATION.md, C:/CurrIA/src/lib/asaas/quota.ts] |
| Reasoning over raw provider statuses like `EXPIRED` or `PENDING`. [VERIFIED: C:/CurrIA/src/lib/asaas/event-handlers.ts] | Current app-side persistence normalizes statuses to `active`, `past_due`, or `canceled`. [VERIFIED: C:/CurrIA/src/lib/asaas/event-handlers.ts, C:/CurrIA/src/lib/asaas/quota.ts] | Webhook/billing hardening documented by current billing implementation. [VERIFIED: C:/CurrIA/docs/billing/IMPLEMENTATION.md] | `"expired"` must be derived, not treated as a first-class stored status. [VERIFIED: C:/CurrIA/src/lib/asaas/event-handlers.ts, C:/CurrIA/src/lib/asaas/quota.ts] |

**Deprecated/outdated for this phase:**

- `loadOptionalBillingInfo()` as an authorization source. [VERIFIED: C:/CurrIA/src/lib/asaas/optional-billing-info.ts]
- `getUserBillingInfo().hasActiveRecurringSubscription` as a Pro-only gate. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.ts]
- `PLANS.features` as chat entitlement policy. [VERIFIED: C:/CurrIA/src/lib/plans.ts]
- `docs/features/FEATURE_ACCESS_CONTROL.md` and `docs/features/ACCESS_CONTROL_DEBUGGING.md` for current schema names; both still mention `plan_tier` and `starter`, which do not match `prisma/schema.prisma`. [VERIFIED: C:/CurrIA/docs/features/FEATURE_ACCESS_CONTROL.md, C:/CurrIA/docs/features/ACCESS_CONTROL_DEBUGGING.md, C:/CurrIA/prisma/schema.prisma]

## Assumptions Log

All factual claims in this research were verified from the current repo, project docs, environment, or npm registry during this session. No user confirmation is required for factual accuracy before planning. [VERIFIED: codebase, project docs, npm registry, local environment]

## Open Questions

1. **Should `/dashboard/sessions` and the settings-page recent-session cards be disabled in-place, or is a `/chat` blocker sufficient?**
   - What we know: both surfaces route directly into `/chat`, and `SessionsList` also fetches `/api/session` today. [VERIFIED: C:/CurrIA/src/components/dashboard/session-list.tsx, C:/CurrIA/src/components/dashboard/sessions-list.tsx, C:/CurrIA/src/app/(auth)/settings/page.tsx, C:/CurrIA/src/app/api/session/route.ts]
   - What's unclear: the preferred UX for non-Pro users who can still see the authenticated dashboard shell. [VERIFIED: C:/CurrIA/src/app/(auth)/layout.tsx]
   - Recommendation: protect `/api/session` in the same phase and show disabled/upgrade messaging on both UI entry surfaces, not just a hard blocker after navigation. [VERIFIED: recommendation derived from current UI flow]

2. **Do we want a first-class client reaction to `403 PRO_SUBSCRIPTION_REQUIRED` when entitlement changes mid-session?**
   - What we know: `requestJson()` can preserve an HTTP `status` and optional `code`, but `ChatInterface` currently special-cases 401, 402, 404, and 429 only. [VERIFIED: C:/CurrIA/src/lib/dashboard/workspace-client.ts, C:/CurrIA/src/components/dashboard/chat-interface.tsx]
   - What's unclear: whether a generic error bubble is acceptable when a previously-allowed user loses entitlement without a page refresh. [VERIFIED: C:/CurrIA/src/components/dashboard/chat-interface.tsx]
   - Recommendation: emit a stable 403 code and add a small client upgrade path if time allows; if scope must stay tight, keep the server denial mandatory and treat the client improvement as secondary. [VERIFIED: recommendation derived from current client behavior]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js/Vitest execution | yes [VERIFIED: local environment] | `v24.14.0` [VERIFIED: local environment] | none [VERIFIED: local environment] |
| npm | Script execution and package verification | yes [VERIFIED: local environment] | `11.9.0` [VERIFIED: local environment] | none [VERIFIED: local environment] |

**Missing dependencies with no fallback:**

- None. [VERIFIED: local environment]

**Missing dependencies with fallback:**

- None. [VERIFIED: local environment]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` repo `^1.6.0`; config current in `vitest.config.ts`. [VERIFIED: C:/CurrIA/package.json, C:/CurrIA/vitest.config.ts] |
| Config file | `C:/CurrIA/vitest.config.ts`. [VERIFIED: C:/CurrIA/vitest.config.ts] |
| Quick run command | `npx vitest run src/lib/asaas/quota.test.ts src/lib/agent/request-orchestrator.test.ts src/app/api/session/route.test.ts src/app/api/session/[id]/route.test.ts src/app/api/session/[id]/messages/route.test.ts src/app/(auth)/chat/page.test.tsx src/components/dashboard/sidebar.test.tsx src/components/dashboard/session-list.test.tsx src/components/dashboard/sessions-list.test.tsx` [VERIFIED: package.json, existing test files] |
| Full suite command | `npm test` [VERIFIED: C:/CurrIA/package.json] |

### Phase Requirements -> Test Map

Derived from the acceptance targets in `102-CONTEXT.md`. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md]

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | `/chat` blocks non-Pro users and renders upgrade guidance instead of `ResumeWorkspace`. [VERIFIED: phase acceptance target + current page seam] | page | `npx vitest run src/app/(auth)/chat/page.test.tsx` | Yes [VERIFIED: file exists] |
| CHAT-02 | `/api/agent` returns 403 for authenticated non-Pro users and keeps 401 for unauthenticated users. [VERIFIED: phase goal + current orchestrator seam] | route/unit | `npx vitest run src/lib/agent/request-orchestrator.test.ts src/app/api/agent/route.test.ts` | Yes [VERIFIED: files exist] |
| CHAT-03 | `GET /api/session/[id]` and `GET /api/session/[id]/messages` require active Pro after auth and before returning chat content. [VERIFIED: phase goal + current route seams] | route/unit | `npx vitest run src/app/api/session/[id]/route.test.ts src/app/api/session/[id]/messages/route.test.ts` | Yes [VERIFIED: files exist] |
| CHAT-04 | The entitlement helper allows only `pro + active + subscription id + non-expired renewal`, and denies `free`, `unit`, `monthly`, `canceled`, `past_due`, missing, and unknown states. [VERIFIED: phase context + current billing model] | unit | `npx vitest run src/lib/asaas/quota.test.ts` | Yes [VERIFIED: file exists] |
| CHAT-05 | Primary chat entry points surface clear Pro-only UX instead of silently routing to chat. [VERIFIED: phase acceptance target + current sidebar/session links] | component/page | `npx vitest run src/components/dashboard/sidebar.test.tsx src/components/dashboard/session-list.test.tsx src/components/dashboard/sessions-list.test.tsx` | Yes [VERIFIED: files exist] |
| CHAT-06 | If `/api/session` remains a chat-adjacent session-list API, it also returns 403 for authenticated non-Pro users. [VERIFIED: current sessions page fetches it] | route/unit | `npx vitest run src/app/api/session/route.test.ts` | Yes [VERIFIED: file exists] |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/asaas/quota.test.ts src/lib/agent/request-orchestrator.test.ts src/app/api/session/route.test.ts src/app/api/session/[id]/route.test.ts src/app/api/session/[id]/messages/route.test.ts src/app/(auth)/chat/page.test.tsx src/components/dashboard/sidebar.test.tsx src/components/dashboard/session-list.test.tsx src/components/dashboard/sessions-list.test.tsx` [VERIFIED: package.json, existing test files]
- **Per wave merge:** `npm test` [VERIFIED: C:/CurrIA/package.json]
- **Phase gate:** Full suite green before `/gsd-verify-work`. [VERIFIED: workflow intent from current GSD configuration and CLAUDE.md]

### Wave 0 Gaps

- [ ] Extend `src/lib/asaas/quota.test.ts` with a new chat-entitlement helper matrix for `pro`, `monthly`, `unit`, `free`, `past_due`, `canceled`, missing subscription id, missing row, unknown status, future `renews_at`, past `renews_at`, and nullable `renews_at`. [VERIFIED: C:/CurrIA/src/lib/asaas/quota.test.ts, C:/CurrIA/src/lib/asaas/quota.ts]
- [ ] Extend `src/lib/agent/request-orchestrator.test.ts` and `src/app/api/agent/route.test.ts` with 403 non-Pro cases that preserve existing 401/429/400 behavior. [VERIFIED: C:/CurrIA/src/lib/agent/request-orchestrator.test.ts, C:/CurrIA/src/app/api/agent/route.test.ts]
- [ ] Extend `src/app/api/session/[id]/route.test.ts` and `src/app/api/session/[id]/messages/route.test.ts` with 403 entitlement cases in addition to current auth/ownership/error coverage. [VERIFIED: existing test files]
- [ ] Extend `src/app/api/session/route.test.ts` if `/api/session` is treated as part of the same chat access surface. [VERIFIED: C:/CurrIA/src/app/api/session/route.ts, C:/CurrIA/src/components/dashboard/sessions-list.tsx]
- [ ] Extend `src/components/dashboard/sidebar.test.tsx`, `src/components/dashboard/session-list.test.tsx`, and `src/components/dashboard/sessions-list.test.tsx` with blocked-entry UX assertions if those entry points are disabled or upgraded in-place. [VERIFIED: existing component files and tests]
- [ ] Create `src/app/(auth)/dashboard/sessions/page.test.tsx` only if the page gets its own server-side blocker instead of relying solely on component-level UX. [VERIFIED: page file exists, no colocated test file exists]
- [ ] Optionally extend `src/components/dashboard/chat-interface.test.tsx` to handle a stable 403 entitlement code if mid-session downgrade UX is implemented. [VERIFIED: C:/CurrIA/src/components/dashboard/chat-interface.tsx, C:/CurrIA/src/components/dashboard/chat-interface.test.tsx]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes [VERIFIED: current routes call `getCurrentAppUser()`] | Clerk + `getCurrentAppUser()` before entitlement evaluation. [VERIFIED: C:/CurrIA/src/lib/auth/app-user.ts] |
| V3 Session Management | yes [VERIFIED: chat APIs return and resume user-owned sessions] | Keep owner-scoped `getSession(params.id, appUser.id)` and deny stale/non-owned sessions as today. [VERIFIED: C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts] |
| V4 Access Control | yes [VERIFIED: phase goal] | Centralized server-only Pro-chat helper plus 403 on every chat-adjacent API. [VERIFIED: phase context + recommended architecture] |
| V5 Input Validation | yes [VERIFIED: repo convention + `/api/agent` current body schema] | Keep existing `zod` validation and do not move access control into untyped client code. [VERIFIED: C:/CurrIA/CLAUDE.md, C:/CurrIA/src/lib/agent/request-orchestrator.ts] |
| V6 Cryptography | no new crypto in this phase [VERIFIED: scope] | Reuse existing auth/session infrastructure; do not introduce custom crypto. [VERIFIED: scope + codebase] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Frontend-only paywall on `/chat` | Elevation of Privilege | Repeat the Pro gate in `/api/agent`, `/api/session`, `/api/session/[id]`, and `/api/session/[id]/messages`. [VERIFIED: phase context + current route inventory] |
| IDOR or history leakage through owner session endpoints | Information Disclosure | Preserve owner-scoped session lookups after auth and before returning data. [VERIFIED: C:/CurrIA/src/app/api/session/[id]/route.ts, C:/CurrIA/src/app/api/session/[id]/messages/route.ts] |
| Privilege retention after cancellation, past-due, or expired renewal date | Elevation of Privilege | Deny unless `plan === "pro"`, `status === "active"`, subscription id exists, and `renews_at` is null or future. [VERIFIED: C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md, C:/CurrIA/src/lib/asaas/quota.ts] |
| Confused-deputy authorization based on credits or plan marketing copy | Tampering | Use `user_quotas` metadata only; do not authorize from `credit_accounts` or `PLANS.features`. [VERIFIED: C:/CurrIA/src/lib/plans.ts, C:/CurrIA/docs/billing/IMPLEMENTATION.md] |

## Sources

### Primary (HIGH confidence)

- `C:/CurrIA/.planning/phases/CURRIA-102-restrict-ai-chat-access-to-active-pro-subscribers-across-ui-/102-CONTEXT.md` - locked decisions, source-of-truth rules, acceptance targets. [VERIFIED: phase context]
- `C:/CurrIA/src/lib/asaas/quota.ts` - current billing helpers, normalized status handling, recurring-plan helpers, and `getUserBillingInfo()` semantics. [VERIFIED: codebase]
- `C:/CurrIA/src/lib/asaas/optional-billing-info.ts` - fail-soft optional billing loader contract. [VERIFIED: codebase]
- `C:/CurrIA/src/lib/plans.ts` - current plan slugs, billing modes, and feature copy that must not drive entitlement. [VERIFIED: codebase]
- `C:/CurrIA/src/app/(auth)/chat/page.tsx` - current page-level billing/view-model usage before `ResumeWorkspace`. [VERIFIED: codebase]
- `C:/CurrIA/src/components/dashboard/resume-workspace.tsx` - current chat workspace mount and plan dialog wiring. [VERIFIED: codebase]
- `C:/CurrIA/src/components/dashboard/chat-interface.tsx` - current `/api/agent` and `/api/session/**` client flow plus limited HTTP special-casing. [VERIFIED: codebase]
- `C:/CurrIA/src/components/dashboard/sidebar.tsx` - current `"Nova conversa"` entry point and existing plan dialog usage. [VERIFIED: codebase]
- `C:/CurrIA/src/components/dashboard/session-list.tsx` - settings-page session cards that link back into `/chat`. [VERIFIED: codebase]
- `C:/CurrIA/src/components/dashboard/sessions-list.tsx` - `/dashboard/sessions` list surface and `/api/session` dependency. [VERIFIED: codebase]
- `C:/CurrIA/src/lib/agent/request-orchestrator.ts` - authenticated chat API seam that currently lacks Pro gating. [VERIFIED: codebase]
- `C:/CurrIA/src/app/api/session/route.ts` - session-list API currently gated only by auth. [VERIFIED: codebase]
- `C:/CurrIA/src/app/api/session/[id]/route.ts` - session snapshot API currently gated by auth + ownership only. [VERIFIED: codebase]
- `C:/CurrIA/src/app/api/session/[id]/messages/route.ts` - transcript API currently gated by auth + ownership only. [VERIFIED: codebase]
- `C:/CurrIA/prisma/schema.prisma` - current `user_quotas` schema. [VERIFIED: codebase]
- `C:/CurrIA/docs/billing/IMPLEMENTATION.md` - billing source-of-truth documentation, status semantics, and `credit_accounts` vs `user_quotas` split. [VERIFIED: project docs]
- `C:/CurrIA/src/lib/asaas/event-handlers.ts` - mapping of raw Asaas statuses into persisted billing states. [VERIFIED: codebase]
- `C:/CurrIA/CLAUDE.md` - project constraints and brownfield rules. [VERIFIED: project docs]
- `C:/CurrIA/package.json` and `C:/CurrIA/vitest.config.ts` - current repo stack and test framework. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- npm registry (`next`, `@clerk/nextjs`, `zod`, `vitest`) - current published versions and last-modified timestamps captured on 2026-04-25. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None. [VERIFIED: research session]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all recommendations stay inside the current repo stack and versions were verified locally plus against npm registry. [VERIFIED: package.json, npm registry]
- Architecture: HIGH - the recommended seam is grounded in current route/page composition and existing quota helpers. [VERIFIED: codebase]
- Pitfalls: HIGH - every major pitfall is directly observable in the current codebase, docs, or tests. [VERIFIED: codebase, project docs]

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 for repo-specific findings; re-check npm versions and any billing-doc changes if planning after that date. [VERIFIED: research date, npm registry, project docs]
