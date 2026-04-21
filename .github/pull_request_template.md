## Summary

- describe the user-facing change
- describe the technical change

## Checks

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run audit:db-conventions`

## Database / Migration Checklist

- [ ] No database change in this PR
- [ ] Or, if there is a database change:
- [ ] New tables were classified in `TABLE_CONVENTIONS` inside `src/lib/db/schema-guardrails.ts`
- [ ] Generic surrogate tables use `id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text`
- [ ] Mutable tables use `created_at` and `updated_at` with `DEFAULT NOW()`
- [ ] App-owned direct writes use `createDatabaseId()`, `createInsertTimestamps()`, or `createUpdatedAtTimestamp()`
- [ ] SQL functions that insert managed rows set explicit `id` and timestamps in the column list
- [ ] Docs were updated when the convention or rollout procedure changed

## Critical Route Architecture

- [ ] If this PR touches critical route surfaces, I reviewed `docs/architecture/review-plan.md`
- [ ] I did not add product policy inline inside a critical route body
- [ ] I did not emit signed URLs outside approved decision or response chokepoints
- [ ] I did not reinterpret historical preview access in `response.ts`
- [ ] I added or updated seam tests for the changed decision or response branches
- [ ] If this PR touches critical route surfaces, `npm run audit:route-architecture` passed
- [ ] If this PR touches critical route surfaces, `npm run test:architecture-proof-pack` passed
