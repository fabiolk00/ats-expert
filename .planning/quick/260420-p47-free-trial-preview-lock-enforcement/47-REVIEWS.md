---
phase: 47
reviewers: [codex]
reviewers_attempted: [claude, codex]
reviewers_blocked: [claude]
reviewed_at: 2026-04-20T21:20:29-03:00
plans_reviewed:
  - 260420-p47-PLAN.md
  - 260420-p47-SUMMARY.md
phase_context: .planning/quick/260420-p47-free-trial-preview-lock-enforcement
status: completed_with_single_reviewer
---

# Cross-AI Review - Phase 47

## Review Status

Phase `47` is not yet formalized in `.planning/ROADMAP.md`, so the quick-task directory below was
used as the authoritative context for the review workflow:

- `.planning/quick/260420-p47-free-trial-preview-lock-enforcement/260420-p47-PLAN.md`
- `.planning/quick/260420-p47-free-trial-preview-lock-enforcement/260420-p47-SUMMARY.md`

CLI availability during the run:

- `gemini`: missing
- `claude`: available but blocked by organization access
- `codex`: available and used per user request
- `coderabbit`: missing
- `opencode`: missing

## Claude Attempt

Command outcome:

```text
exit=1
Your organization does not have access to Claude. Please login again or contact your administrator.
```

## Codex Review

### Summary

Phase 47 moves the enforcement in the right direction: the lock contract is centralized, the main
workspace/session reads are sanitized server-side, and timeline/compare now avoid returning raw
snapshots in the obvious free-trial paths. The main weakness is that the implementation does not
fully enforce “upgrade requires regeneration” yet, because the completed-generation replay path in
`generate-billable-resume.ts` can still hand back a real signed artifact URL before any
preview-lock check runs. That leaves the phase materially incomplete despite the otherwise solid
route-level hardening.

### Strengths

- The contract is cleaner now. `PreviewAccess`, lock summary generation, client sanitization, and
  locked-PDF fallback are centralized instead of being reimplemented per route.
- The enforcement is mostly server-side, not cosmetic. `session`, `versions`, `compare`,
  `comparison`, and `file` routes all sanitize or deny access on the backend, which is the right
  answer for DevTools resistance.
- The timeline/compare sanitizers fail closed for missing target metadata.
- The manual-edit route closes an important secondary bypass by blocking edits of locked
  optimized/target resumes.

### Concerns

- `HIGH`: Completed-generation replay bypasses the preview lock and breaks “upgrade requires regeneration”.
  In `src/lib/resume-generation/generate-billable-resume.ts`, `buildExistingGenerationSuccessResult()`
  reconstructs a ready artifact from stored paths with no `previewAccess`, and the early replay
  returns happen before `resolvePreviewAccessForCompletedGeneration()` runs. A free user with a
  previously completed generation can therefore receive a real signed PDF URL instead of the locked
  preview route.
- `MEDIUM`: Historical version access is keyed off current session-level preview state, not
  version-level truth. In `src/lib/cv/preview-sanitization.ts`, `ats-enhancement` and
  `job-targeting` versions inherit `context.session.generatedOutput.previewAccess`, which means a
  later paid generation could unintentionally expose older locked derived versions.
- `MEDIUM`: Regression coverage misses the high-risk replay and async persistence cases.
  Missing proof includes:
  - free-plan replay of an existing completed generation staying locked
  - async `processArtifactGenerationJob()` persisting locked `generatedOutput.previewAccess`
  - a dedicated test for `/api/file/[sessionId]/locked-preview`
  - an end-to-end “upgrade without regeneration still cannot access real preview/artifact” scenario
- `LOW`: Locked comparison still computes scores over demo content, which does not leak data but
  can produce misleading ATS or fit numbers for a demo-only view.

### Suggestions

- Fix replay first. Any path that reuses an existing completed generation should re-resolve preview
  access for the current user plan and return a locked URL plus locked `generatedOutput` when
  `requiresRegenerationAfterUnlock` applies.
- Do not derive version visibility from `session.generatedOutput.previewAccess` alone. Persist
  preview-access metadata at the version or generation-reference level, or treat historical derived
  snapshots as unreadable unless their own access grant is explicit.
- Add focused regressions for the replay, post-upgrade-without-regeneration, async persistence,
  and `/locked-preview` scenarios.
- Consider short-circuiting comparison scoring when preview is locked, or label those numbers as
  demo-only so the UI does not imply they reflect the real generated resume.

### Risk Assessment

`HIGH`

The phase improves the obvious API leak surfaces, but the replay hole means the core enforcement
objective is not yet reliably met. As long as completed-generation reuse can return a real signed
artifact for a locked user, the system does not fully enforce the free-trial boundary or the
“upgrade requires regeneration” rule.

## Consensus Summary

Only one reviewer completed successfully in this run, so there is no multi-model consensus yet.

Highest-priority actionable issue from the completed review:

1. Fix completed-generation replay so locked free-trial users cannot retrieve a real artifact URL
   from an already-completed generation without regenerating after upgrade.
