# /project:fix-issue

Fix a GitHub issue end-to-end: understand the problem, implement safely, preserve architecture, test, and summarize.

## Usage
/project:fix-issue #<issue-number> <brief description>

## Current Architecture Reality
- Clerk is the auth provider, but runtime domain logic should use internal app user IDs
- Runtime DB access uses Supabase JS
- Credits live in `credit_accounts`
- Session state is split into `cvState`, `agentState`, and `generatedOutput`
- Tool-originated state mutation goes through `ToolPatch` and `applyToolPatch()`

## Steps

1. Read the issue description from the user.
2. Run `rg "TODO\\(#<issue-number>\\)" src`.
3. Identify affected files using `CLAUDE.md` and `docs/`.
4. Implement the change following `.claude/rules/`.
5. Preserve current invariants:
   - no Clerk IDs in domain logic
   - no direct tool mutation of `session`
   - no non-canonical resume data in `cvState`
   - no signed URLs in `generatedOutput`
6. Add or update tests near the touched code.
7. Run:
   - `npm run typecheck`
   - `npm test`
   - `npm run lint`
8. If the issue changes architecture or developer workflow, update the relevant Markdown docs in the same change.
9. Output:

```
## Fix for #<issue-number>

### Root cause
<what was wrong>

### Changes made
- `src/path/to/file.ts` - <what changed>
- `src/path/to/file.test.ts` - <what was tested>

### How to verify
<steps to manually verify the fix works>
```

Do not run `git commit` or `git push`.

## Additional Current-Architecture Reminders
- Preserve `cvState` as the canonical base resume.
- Put immutable resume history in `cv_versions`, not in session JSON.
- Put target-specific derived resumes in `resume_targets`, not in base `cvState`.
- Validate structured gap analysis and target-derived `CVState` before persisting them.
