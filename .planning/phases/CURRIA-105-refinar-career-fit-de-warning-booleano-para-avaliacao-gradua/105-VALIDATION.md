## Validation

### Commands

- `npm test -- src/lib/agent/profile-review.test.ts src/lib/agent/streaming-loop.test.ts src/app/api/session/[id]/route.test.ts src/app/api/session/[id]/generate/route.test.ts src/lib/routes/session-generate/policy.test.ts src/lib/agent/context-builder.test.ts`
- `npm run typecheck`

### Outcome

- Focused test files: passed
- TypeScript typecheck: passed

### Coverage Confirmed

- `low`, `medium`, and `high` risk evaluation classification
- `medium` warning without override requirement
- `high` warning with explicit confirmation requirement
- Prompt/context guardrail risk-level rendering
- Durable generation policy parity for medium vs high risk
- Session route checkpoint compatibility during migration
