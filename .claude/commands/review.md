# /project:review

Review the current git diff for code quality, security, and alignment with project rules.

## Steps

1. Run `git diff --staged` to get the staged changes
2. If nothing is staged, run `git diff HEAD` to get unstaged changes
3. Check each changed file against:
   - `.claude/rules/code-style.md`
   - `.claude/rules/api-conventions.md`
   - `.claude/rules/testing.md`
4. For any new API route, verify the auth + validation + quota check pattern is present
5. For any change to `lib/agent/`, verify the model is still `claude-haiku-4-5-20251001` in `config.ts`
6. For any change to `lib/ats/`, check if a corresponding `.test.ts` was updated
7. Output a structured review:

```
## Summary
<what changed in plain English>

## Issues
- [CRITICAL] <blocking issue — must fix before merge>
- [WARNING]  <non-blocking but should address>
- [SUGGESTION] <optional improvement>

## Verdict
APPROVE / REQUEST CHANGES
```

If there are no issues, say so clearly and give the APPROVE verdict.
