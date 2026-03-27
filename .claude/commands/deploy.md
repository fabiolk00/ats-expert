# /project:deploy

Run the final pre-deploy validation for the current CurrIA architecture.

## Current Architecture Reality
- Runtime data access uses Supabase JS
- Identity is Clerk -> internal app user
- Runtime credits live in `credit_accounts`
- Session bundle state lives in `sessions` with `stateVersion`, `cvState`, `agentState`, and `generatedOutput`
- Asaas is the active billing/webhook provider

## Steps

1. Run `npm run typecheck` - must pass.
2. Run `npm run lint` - must pass.
3. Run `npm test` - must pass.
4. Run `npm run build` - must pass.
5. Validate environment documentation:
   - verify `.env.example` exists
   - search `src/` and `prisma/` for `process.env.`
   - confirm all referenced variables are documented
6. Review schema and SQL helpers:
   - `prisma/schema.prisma`
   - `prisma/migrations/*.sql`
   - verify session `state_version` exists
   - verify credit/message atomic helpers are present if relied on
7. Review production invariants:
   - `credit_accounts` remains authoritative
   - `generatedOutput` does not store signed URLs
   - tool-originated changes still use `ToolPatch`
   - no Clerk ID leakage into domain logic
8. Search for hardcoded secrets in application code.
9. Output:

```
## Deploy Checklist

| Check | Status |
|---|---|
| TypeScript | PASS / FAIL |
| Lint | PASS / FAIL |
| Tests | PASS / FAIL |
| Build | PASS / FAIL |
| Env vars | PASS / FAIL |
| No secrets | PASS / FAIL |
| Schema / SQL helpers | PASS / FAIL |

## Verdict
READY TO DEPLOY / BLOCKED - fix the issues above first
```

If all checks pass, remind the developer to configure env vars for Vercel, Supabase, Clerk, Asaas, and Upstash.

## Additional Release Checks
- Verify migrations for `cv_versions` and `resume_targets` are applied.
- Verify ownership checks on `/api/session/[id]/versions` and `/api/session/[id]/targets`.
- Verify no code path stores raw parsed resume text in `cv_versions` or target-derived resume records.
