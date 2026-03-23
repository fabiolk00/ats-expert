# /project:deploy

Pre-deployment checklist — run this before every production deploy.

## Steps

1. Run `pnpm typecheck` — must exit 0
2. Run `pnpm lint` — must exit 0
3. Run `pnpm test` — all tests must pass
4. Run `pnpm build` — must complete without errors
5. Check for required environment variables:
   - Verify `.env.example` has an entry for every variable used in the codebase
   - Run `grep -r "process.env\." src/ | grep -v "\.test\." | grep -oP "process\.env\.\K\w+"` and compare with `.env.example`
6. Check for hardcoded secrets:
   - Run `grep -rn "sk_live\|sk_test\|eyJ" src/` — must return nothing
7. Check Prisma migrations:
   - Run `npx prisma migrate status` — all migrations must be applied
8. Output the deploy report:

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
| DB migrations | PASS / FAIL |

## Verdict
READY TO DEPLOY / BLOCKED — fix the issues above first
```

If all checks pass, remind the developer to set env vars on Vercel before deploying.
