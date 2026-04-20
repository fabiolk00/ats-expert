---
phase: CURRIA-45-improve-billing-transparency-alerts-and-concurrency-proof
plan: "02"
subsystem: ui
tags: [billing, settings, nextjs, react, zod, vitest]
requires:
  - phase: 45-01
    provides: reservation-backed billing history DTOs and user-scoped credit activity mapping
provides:
  - authenticated `/api/billing/history` read endpoint
  - additive settings-page billing activity card
  - shared serialized billing history response contract
affects: [settings-page, billing-transparency, workspace-client]
tech-stack:
  added: []
  patterns: [thin authenticated route with zod query validation, additive client-side billing activity fetch on settings page]
key-files:
  created: [src/app/api/billing/history/route.ts, src/app/api/billing/history/route.test.ts, src/components/dashboard/billing-activity-card.tsx, src/components/dashboard/billing-activity-card.test.tsx]
  modified: [src/app/(auth)/settings/page.tsx, src/lib/dashboard/workspace-client.ts, src/types/billing.ts, src/types/dashboard.ts]
key-decisions:
  - "Kept billing history on a dedicated authenticated route instead of expanding optional billing info so existing settings and auth-layout summary loads remain stable."
  - "Rendered the new transparency surface as a client-side additive card on settings so billing-history failures do not block the existing server-rendered page."
  - "Standardized the serialized history DTO in billing types so the route and settings UI share one contract instead of duplicating ad hoc response shapes."
patterns-established:
  - "Billing transparency UI should translate internal ledger and reconciliation states into PT-BR product copy before rendering."
  - "Settings-page additions that depend on optional runtime data should fetch client-side and degrade with an explicit non-blocking notice."
requirements-completed: [BILL-UX-01]
duration: 5min
completed: 2026-04-20
---

# Phase 45 Plan 02: Billing History In Settings Summary

**Authenticated export credit history now ships through a dedicated billing route and an additive settings-page activity card with PT-BR reconciliation copy**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-20T13:28:30Z
- **Completed:** 2026-04-20T13:32:46Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a thin authenticated `GET /api/billing/history` route that validates `limit`, scopes reads to `getCurrentAppUser()`, and returns the Phase 45 billing-history DTO instead of raw table rows.
- Added `getBillingHistory()` to the existing workspace client and mounted a new `BillingActivityCard` on the existing settings page without changing `loadOptionalBillingInfo()` or the page's server-rendered summary path.
- Shipped focused route and UI tests covering unauthorized access, limit handling, localized labels, empty state behavior, and non-blocking degraded billing-history fetches.

## Task Commits

1. **Task 1: Add an authenticated read-only billing history endpoint** - `3a9a8be` (`feat`)
2. **Task 2: Add the billing activity card to the existing settings page** - `3e9b03f` (`feat`)

## Files Created/Modified

- `src/app/api/billing/history/route.ts` - thin authenticated history endpoint with clamped query validation and serialized DTO output
- `src/app/api/billing/history/route.test.ts` - ownership, limit, and DTO-shape coverage for the new route
- `src/components/dashboard/billing-activity-card.tsx` - additive client card for recent export credit activity and reconciliation messaging
- `src/components/dashboard/billing-activity-card.test.tsx` - UI coverage for localized states, empty state, and degraded fetch behavior
- `src/app/(auth)/settings/page.tsx` - integrates the billing activity card into the existing settings surface
- `src/lib/dashboard/workspace-client.ts` - typed client helper for `/api/billing/history`
- `src/types/billing.ts` - shared serialized billing-history response contract
- `src/types/dashboard.ts` - dashboard alias for the shared billing-history response shape

## Decisions Made

- Kept billing history separate from `loadOptionalBillingInfo()` so plan and balance summary data remain independent from timeline payloads.
- Used a client component for the new settings section to keep the server-rendered settings page brownfield-safe and non-blocking if history lookup fails.
- Mapped export reservation states to explicit PT-BR explanations rather than exposing raw ledger enum names or ambiguous reconciliation wording.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clamp oversized history limits instead of rejecting them**
- **Found during:** Task 1
- **Issue:** The first route implementation returned `400` for oversized `limit` values, which broke the planned small validated page-size behavior.
- **Fix:** Replaced the strict max validator with preprocessing that clamps any provided limit into the supported `1..20` range.
- **Files modified:** `src/app/api/billing/history/route.ts`
- **Verification:** `npx vitest run src/app/api/billing/history/route.test.ts`
- **Committed in:** `3a9a8be`

**2. [Rule 1 - Bug] Align reconciliation status assertions with the actual reservation contract**
- **Found during:** Task 2 verification
- **Issue:** Tests used a non-existent reconciliation status value, causing `tsc --noEmit` to fail even though the runtime behavior was correct.
- **Fix:** Updated route and component test fixtures to use the real `clean` status from the reservation model and kept the serialized DTO shared through `src/types/billing.ts`.
- **Files modified:** `src/app/api/billing/history/route.test.ts`, `src/components/dashboard/billing-activity-card.test.tsx`, `src/types/billing.ts`, `src/types/dashboard.ts`
- **Verification:** `npx vitest run src/app/api/billing/history/route.test.ts`, `npx vitest run src/components/dashboard/billing-activity-card.test.tsx`, `npm run typecheck`
- **Committed in:** `3e9b03f`

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes were required to keep the new transparency surface aligned with the planned API contract and actual billing types. No scope creep.

## Issues Encountered

- PowerShell rejected `&&` command chaining during task commit staging; re-ran the commit step with native separators.
- Bracketed route file paths required `-LiteralPath` for direct reads during investigation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The authenticated settings page now exposes recent export credit activity without adding a second billing truth or new mutation surface.
- Later billing transparency work can extend the same DTO and card pattern if purchase or renewal history is added to the ledger.

## Known Stubs

None.

## Self-Check: PASSED
