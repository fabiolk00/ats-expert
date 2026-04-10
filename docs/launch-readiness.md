---
title: CurrIA Launch Readiness
audience: [operators, developers, founders]
related: [PRODUCTION-READINESS-CHECKLIST.md, logging.md, billing/MONITORING.md]
status: current
updated: 2026-04-10
---

# CurrIA Launch Readiness

## Launch Decision

**Launch decision:** Ready for controlled launch.

This recommendation is based on the completed launch-hardening milestone:

- **Phase 1** aligned env contracts, fail-fast guards, and staging or operator prerequisites.
- **Phase 2** added the committed Chromium Playwright lane for the core funnel and wired it into CI.
- **Phase 3** captured live billing settlement, duplicate-delivery, and display-balance evidence.
- **Phase 4** standardized the remaining fragile diagnostics and replaced silent user-facing dead ends with safer fallback messaging.

## Why This Is Launch-Ready

- Core configuration now fails early instead of drifting silently.
- The highest-value auth-to-download journey has committed browser coverage.
- Billing settlement behavior has live evidence, not just mocked tests.
- Fragile session, file, webhook, billing-display, and profile-import failures are now diagnosable through structured logs.
- Users see non-blocking and actionable copy for the main remaining degradation paths.

## Release Proof Set

### Repo-local proof

```bash
npm run typecheck
npm test
npm run test:e2e -- --project=chromium
```

### Live proof

```bash
bash scripts/verify-staging.sh
```

### Focused hardening reruns

```bash
npm test -- src/app/api/session/route.test.ts src/app/api/session/[id]/messages/route.test.ts src/app/api/file/[sessionId]/route.test.ts src/app/api/webhook/clerk/route.test.ts src/app/(auth)/layout.test.tsx
npm test -- src/components/dashboard/preview-panel.test.tsx src/components/dashboard/session-documents-panel.test.tsx src/components/dashboard/resume-workspace.test.tsx src/app/api/profile/extract/route.test.ts src/app/api/profile/status/[jobId]/route.test.ts
```

## Key Observability Events

### Agent and generation

- `agent.request.failed`
- `agent.tool.failed`
- `agent.tool.generated_output.persisted`

### Billing and checkout

- `checkout.creation_failed`
- `asaas.webhook.failed`
- `billing.info.load_failed`

### Session and artifact retrieval

- `api.session.list_failed`
- `api.session.messages_failed`
- `api.file.download_urls_failed`

### Auth bootstrap

- `clerk.webhook.config_missing`
- `clerk.webhook.signature_invalid`
- `clerk.webhook.handler_failed`

### Profile import

- `[api/profile/extract] Failed to create job`
- `[api/profile/status] Failed to get job status`
- `[import-jobs] Job failed`

## Remaining Caveats

- PDF and DOCX upload onboarding is still intentionally deferred. This is a product-gap caveat, not a launch blocker for the current funnel.
- LinkdAPI remains optional and third-party dependent, so LinkedIn import should still be monitored during the early launch window.
- The launch recommendation is **controlled launch**, not broad uncontrolled scale. Keep an operator close to the logs and billing dashboards during the first real traffic window.

## Handoff Notes

- Use [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) as the deploy gate.
- Use [logging.md](./logging.md) for event names and query patterns.
- Use [billing/MONITORING.md](./billing/MONITORING.md) for billing-specific alerts and sanity queries.
- If a launch issue appears, start with the event family above before broad log greps.

## Go or No-Go Rule

Proceed only if:

- the repo-local proof passes on the release commit
- `bash scripts/verify-staging.sh` passes for the target environment
- required migrations are confirmed
- no blocking caveat has been added after this document's `updated` timestamp

If any of those fail, the launch decision flips from **ready for controlled launch** to **blocked pending operator follow-up**.
