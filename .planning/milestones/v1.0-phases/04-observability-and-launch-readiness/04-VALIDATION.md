---
phase: 04
slug: observability-and-launch-readiness
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-10
---

# Phase 04 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing Vitest, React Testing Library, Playwright, and TypeScript checks |
| **Config files** | `vitest.config.ts`, `playwright.config.ts`, `.planning/ROADMAP.md`, `docs/PRODUCTION-READINESS-CHECKLIST.md` |
| **Quick run command** | `npm run typecheck` |
| **Primary targeted suite** | `npm test -- src/app/api/session/route.test.ts src/app/api/session/[id]/messages/route.test.ts src/app/api/file/[sessionId]/route.test.ts src/app/api/webhook/clerk/route.test.ts src/app/(auth)/layout.test.tsx src/app/api/profile/extract/route.test.ts src/app/api/profile/status/[jobId]/route.test.ts src/components/dashboard/preview-panel.test.tsx src/components/dashboard/session-documents-panel.test.tsx` |
| **Static doc audit** | `node .codex/get-shit-done/bin/gsd-tools.cjs state validate` plus repo-local grep checks |
| **Estimated runtime** | ~150 seconds for typecheck plus targeted Vitest, excluding optional Playwright smoke reruns |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run the targeted suite for the touched routes, pages, or components
- **Before phase verification:** Re-run the final targeted suite and the launch-readiness doc audits
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | OBS-01 | T-04-01 / T-04-02 | Fragile routes and optional billing reads emit structured logs with request, surface, and entity context | unit | `npm test -- src/app/api/session/route.test.ts src/app/api/session/[id]/messages/route.test.ts src/app/api/file/[sessionId]/route.test.ts src/app/api/webhook/clerk/route.test.ts src/app/(auth)/layout.test.tsx` | partial | pending |
| 04-01-02 | 01 | 1 | OBS-01 | T-04-03 | Structured log docs and helper usage agree on the current JSON envelope | static audit | `powershell -NoProfile -Command \"$targets = 'event','level','timestamp','billing.info.load_failed','api.session.list_failed'; $files = 'src/lib/observability/structured-log.ts','docs/logging.md'; $content = ($files | ForEach-Object { Get-Content $_ -Raw }) -join \\\"`n\\\"; foreach ($target in $targets) { if ($content -notmatch [regex]::Escape($target)) { exit 1 } }; exit 0\"` | yes | pending |
| 04-02-01 | 02 | 2 | OBS-02 | T-04-04 / T-04-05 | Generated-artifact failures and billing-read degradation show actionable user-safe copy instead of silent empty state | unit | `npm test -- src/app/(auth)/layout.test.tsx src/components/dashboard/preview-panel.test.tsx src/components/dashboard/session-documents-panel.test.tsx src/components/dashboard/resume-workspace.test.tsx` | partial | pending |
| 04-02-02 | 02 | 2 | OBS-02 | T-04-06 | Profile import start and polling return safe, localised, actionable errors | unit | `npm test -- src/app/api/profile/extract/route.test.ts src/app/api/profile/status/[jobId]/route.test.ts` | yes | pending |
| 04-03-01 | 03 | 3 | OBS-01, OBS-02 | T-04-07 | Final launch docs reference the real Phase 1-4 proof commands, log events, and remaining caveats | static audit | `powershell -NoProfile -Command \"$targets = 'npm run typecheck','npm run test:e2e -- --project=chromium','bash scripts/verify-staging.sh','billing.info.load_failed','launch decision'; $files = 'docs/PRODUCTION-READINESS-CHECKLIST.md','docs/logging.md','docs/launch-readiness.md'; $content = ($files | ForEach-Object { Get-Content $_ -Raw }) -join \\\"`n\\\"; foreach ($target in $targets) { if ($content -notmatch [regex]::Escape($target)) { exit 1 } }; exit 0\"` | no - 04-03 | pending |
| 04-03-02 | 03 | 3 | OBS-01, OBS-02 | T-04-08 | Final phase proof records the completed command set and any residual caveats without hand-waving | local proof | `node .codex/get-shit-done/bin/gsd-tools.cjs state validate` | yes | pending |

*Status: pending, green, red, or flaky.*

---

## Wave 0 Requirements

- [ ] `src/app/api/session/route.test.ts` - coverage for list-route logging and failure handling
- [ ] `src/app/api/session/[id]/messages/route.test.ts` - coverage for session message-route logging and failure handling
- [ ] `src/components/dashboard/session-documents-panel.test.tsx` - coverage for actionable document-fetch failure UI
- [ ] `docs/launch-readiness.md` - final launch decision and handoff notes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard remains usable when billing metadata reads fail | OBS-02 | The final confidence check is easier to assess visually than via unit assertions alone | Temporarily force `getUserBillingInfo` to fail in a local run, load `/dashboard`, and confirm the shell still renders with a non-blocking notice about billing information being unavailable. |
| Generated files show a retryable user message when signed-URL retrieval fails | OBS-02 | The exact UX wording and placement are best confirmed in the browser | Break `/api/file/[sessionId]` locally or via route mocking, open the documents panel or preview, and confirm the user sees retry guidance instead of an empty files state. |
| A failed LinkedIn import gives a safe, actionable message | OBS-02 | The value is the end-user copy and flow, not just the HTTP status | Trigger a failed `/api/profile/status/[jobId]` path and confirm the toast or inline message tells the user to verify the public link and retry later rather than exposing backend internals. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 300s for repo-local checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
