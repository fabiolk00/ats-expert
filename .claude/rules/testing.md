# Testing Rules

## Framework
- Unit and integration tests: **Vitest**
- Component tests: **React Testing Library**
- E2E: **Playwright** (critical flows only: upload → analysis → download)

## What must be tested
- All ATS scoring functions in `lib/ats/` — these are pure functions, 100% coverage required
- All agent tool handlers in `lib/agent/tools/` — mock the Anthropic SDK
- All Stripe webhook handlers — mock Stripe events
- API route happy paths and error paths

## What does NOT need tests
- UI components that are purely presentational
- shadcn/ui wrappers
- Prisma schema migrations

## Test file location
Co-located with the source file:
```
src/lib/ats/score.ts
src/lib/ats/score.test.ts
```

## Mocking rules
- Mock `@anthropic-ai/sdk` at the module level — never make real API calls in tests
- Mock Supabase Storage — never write real files in tests
- Use `vitest-mock-extended` for type-safe mocks
- Seed data lives in `tests/fixtures/` — reuse across test files

## Test naming
```ts
describe('scoreATS', () => {
  it('returns 0 for a resume with no keywords', () => { ... })
  it('penalizes two-column layouts', () => { ... })
  it('boosts score when job description keywords match', () => { ... })
})
```

## CI
All tests run on every PR via GitHub Actions. PRs cannot merge if any test fails.
