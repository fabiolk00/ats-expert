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
