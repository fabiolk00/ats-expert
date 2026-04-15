---
title: CurrIA Testing Rules
audience: [developers]
related: [README.md, CODE_STYLE.md, ERROR_HANDLING.md]
status: current
updated: 2026-04-12
---

# Testing Rules

Back to [Developer Rules](./README.md) | [All Docs](../INDEX.md)

## Framework

- Unit and integration tests: Vitest
- Component tests: React Testing Library
- Browser tests: Playwright (`npm run test:e2e -- --project=chromium`)
- Quality gates: `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` for touched files

## What must be tested when touched

### Agent tools

- success path
- invalid or failure path
- patch shape
- merge behavior for unrelated state

### Session state and dispatcher

- partial patch merge behavior
- persistence through `applyToolPatch()`
- in-memory session snapshot updates
- state-version normalization when relevant

### Billing and webhooks

- credit consumption and quota checks
- duplicate webhook delivery behavior
- failure retry behavior
- no double-credit regressions
- session creation and chat paths staying free
- idempotent resume-generation retries returning `creditsUsed: 0`
- unpaid or failed generations not exposing downloadable artifact URLs

### File generation

- reads canonical `cvState`
- persists only artifact metadata
- does not persist signed URLs
- bills only for successful AI-generated resume outcomes, not manual edits or plain export retries

### Browser funnel coverage

- guest access to protected dashboard routes redirects to `/login`
- manual profile setup saves canonical `cvState` fields and returns to `/dashboard`
- the dashboard funnel covers session creation, streamed agent completion, target outcome, preview readiness, and at least one successful artifact download
- browser assertions should prefer stable `data-testid` and `data-*` state hooks over marketing copy or timing-only expectations

## Current high-value coverage

- `src/lib/ats/score.test.ts`
- `src/lib/db/sessions.test.ts`
- `src/lib/db/cv-versions.test.ts`
- `src/lib/agent/tools/index.test.ts`
- `src/lib/agent/tools/rewrite-section.test.ts`
- `src/lib/agent/tools/generate-file.test.ts`
- `src/lib/agent/tools/gap-analysis.test.ts`
- `src/lib/agent/tools/pipeline.test.ts`
- `src/lib/resume-targets/create-target-resume.test.ts`
- `src/app/api/webhook/asaas/route.test.ts`
- `src/app/api/session/[id]/targets/route.test.ts`

## Test Layers

### Unit

- pure helpers and domain functions
- usually under `src/lib/**` with co-located `*.test.ts`

Representative suites:

- `src/lib/openai/chat.test.ts`
- `src/lib/asaas/client.test.ts`
- `src/lib/db/supabase-admin.test.ts`

### Integration

- multi-module flows below the browser layer
- pipeline orchestration, persistence, and billing interactions with mocked edges

Representative suites:

- `src/lib/agent/tools/pipeline.test.ts`
- `src/lib/db/cv-versions.test.ts`
- `src/lib/resume-generation/generate-billable-resume.test.ts`

### Route

- App Router handlers with request/response expectations
- auth, validation, and persistence contracts

Representative suites:

- `src/app/api/agent/route.sse.test.ts`
- `src/app/api/e2e/auth/route.test.ts`
- `src/app/api/profile/upload/route.test.ts`
- `src/app/api/file/[sessionId]/route.test.ts`

### Browser E2E

- full user funnel and dashboard behavior through Playwright

Representative suites:

- `tests/e2e/profile-setup.spec.ts`
- `tests/e2e/long-vacancy-generation.spec.ts`

### Stress and operator checks

- scripted validation for runtime parity, replay, and route stress

Representative commands:

- `pnpm agent:parity`
- `pnpm agent:replay-dialog`
- `pnpm agent:stress-route`
- `pnpm agent:stress-long-vacancy`

## Additional Coverage Requirements

- CV version creation on trusted canonical state changes
- Gap analysis validation success and failure
- Target-derived resume isolation from base `cvState`
- Multiple targets coexisting for one session
- Ownership checks on session history and target routes

## Mocking rules

- Mock `@anthropic-ai/sdk` at the module level.
- Mock Supabase Storage and Supabase admin clients.
- Do not make real network or storage calls in tests.
- Prefer co-located tests near the code they validate.
- Playwright specs must use the shared `tests/e2e/fixtures/api-mocks.ts` helpers instead of live Clerk, Supabase, OpenAI, Asaas, or storage providers.
- Browser auth must go through the committed `POST /api/e2e/auth` seam guarded by `E2E_AUTH_ENABLED`, `E2E_AUTH_BYPASS_SECRET`, and the runtime allowlist (`CI=true`, `NODE_ENV=test`, or `E2E_AUTH_ALLOW_LOCAL_DEV=true`).
- Keep the browser lane staging-safe: use deterministic mocked SSE payloads and same-origin test assets rather than live provider credentials.

## Naming

Use concrete behavioral names:

```ts
describe('rewriteSection', () => {
  it('updates only the targeted canonical cvState field', () => { ... })
  it('rejects malformed model output before persistence', () => { ... })
})
```

## CI expectation

Changes should pass:

- `npm run typecheck`
- `npm run audit:db-conventions`
- `npm test`
- `npm run test:e2e -- --project=chromium`
- `npm run lint`
- `pnpm format:check` for docs/config-heavy changes

For dead-code hygiene phases, also run the relevant inventory commands for the affected scope:

- `pnpm unused`
- `pnpm depcheck`
- `pnpm orphans`

These are discovery tools, not proof that a deletion is safe by itself.

## Evolving the Baseline

- The staged TypeScript-aware lint scope is documented in [QUALITY_BASELINE.md](./QUALITY_BASELINE.md).
- Expand lint or formatting scope only when the added directories stay low-noise under local verification.
- Dead-code cleanup must stay staged: imports first, then exports/files, then dependencies, with focused regression proof after each step.
- The configured `pnpm depcheck` command is the maintained dependency-hygiene entrypoint; do not substitute raw defaults without updating the inventory and repo ignores.

## E2E Auth Safety

- Local browser runs must set `E2E_AUTH_ALLOW_LOCAL_DEV=true` together with `E2E_AUTH_ENABLED=true`.
- CI browser runs rely on `CI=true` plus the explicit bypass secret.
- If the runtime guard is absent, `/api/e2e/auth` must fail closed.

## Schema Guardrails

Database-related changes must keep the automated schema guardrails green.

What they check:

- every created table is intentionally classified in `src/lib/db/schema-guardrails.ts`
- generic text primary keys keep a UUID default by the end of the migration chain
- mutable tables keep `created_at` and `updated_at` defaults by the end of the migration chain
- SQL functions that insert into managed tables include explicit `id` and timestamp columns

This guardrail runs in:

- `npm run audit:db-conventions`
- CI on every push and pull request
