# Testing Rules

## Framework
- Unit and integration tests: Vitest
- Component tests: React Testing Library
- No Playwright setup is committed today

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

### File generation
- reads canonical `cvState`
- persists only artifact metadata
- does not persist signed URLs

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
- `npm test`
- `npm run lint`
