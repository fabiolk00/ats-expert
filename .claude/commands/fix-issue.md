# /project:fix-issue

Fix a GitHub issue end-to-end: understand, implement, test, and summarize.

## Usage
/project:fix-issue #<issue-number> <brief description>

## Steps

1. Read the issue description provided by the user
2. Run `grep -r "TODO(#<issue-number>)" src/` to find related TODOs
3. Identify the affected files using the folder structure from `CLAUDE.md`
4. Implement the fix following all rules in `.claude/rules/`
5. Write or update the corresponding test file
6. Run `pnpm typecheck` — fix any TypeScript errors before proceeding
7. Run `pnpm test` — all tests must pass
8. Run `pnpm lint` — fix any lint errors
9. Output a summary:

```
## Fix for #<issue-number>

### Root cause
<what was wrong>

### Changes made
- `src/path/to/file.ts` — <what changed>
- `src/path/to/file.test.ts` — <what was tested>

### How to verify
<steps to manually verify the fix works>
```

Do not run `git commit` or `git push` — leave that to the developer.
