---
phase: 03
slug: billing-settlement-validation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-10
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing Vitest and TypeScript checks plus committed staging replay helpers |
| **Config files** | `vitest.config.ts`, `.env.staging.example`, `scripts/verify-staging.sh` |
| **Quick run command** | `npm run typecheck` |
| **Full local suite command** | `npm test -- src/lib/asaas/event-handlers.test.ts src/app/api/webhook/asaas/route.test.ts src/lib/asaas/credit-grants.test.ts src/lib/asaas/quota.test.ts src/app/api/checkout/route.test.ts` |
| **Live proof command** | `bash scripts/verify-staging.sh` plus named `tsx` replay commands |
| **Estimated runtime** | ~240 seconds local plus operator-dependent staging time |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run the relevant targeted local suite or staging preflight command for that wave
- **Before `/gsd-verify-work`:** Phase 3 evidence files and gap status must be current in addition to local checks
- **Max feedback latency:** 300 seconds for local proof, excluding live staging replay time

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BILL-01, BILL-02, BILL-03 | T-03-01 / T-03-03 | Staging replay and snapshot helpers are committed, scenario-driven, and safe to inspect without leaking secrets | tooling smoke | `tsx scripts/replay-staging-asaas.ts --list-scenarios` | no - 03-01 | pending |
| 03-01-02 | 01 | 1 | BILL-01, BILL-02 | T-03-02 | Local billing contract stays green while the new tooling and docs land | unit | `npm test -- src/lib/asaas/event-handlers.test.ts src/app/api/webhook/asaas/route.test.ts src/lib/asaas/credit-grants.test.ts src/lib/asaas/quota.test.ts src/app/api/checkout/route.test.ts` | yes | pending |
| 03-02-01 | 02 | 2 | BILL-01, BILL-02, BILL-03 | T-03-04 / T-03-05 | Staging preflight proves the operator environment, secrets, migrations, and API reachability are ready before replay | live preflight | `bash scripts/verify-staging.sh` | yes | pending |
| 03-02-02 | 02 | 2 | BILL-01, BILL-02 | T-03-05 | Every named settlement scenario is executed and captured with request, response, and post-run state | evidence audit | `powershell -NoProfile -Command \"$names = 'one_time_settlement','inactive_subscription_snapshot','initial_recurring_activation','renewal_replace_balance','cancellation_metadata_only','duplicate_delivery','partial_success_reconcile'; $content = Get-Content '.planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md' -Raw; foreach ($name in $names) { if ($content -notmatch [regex]::Escape($name)) { exit 1 } }; exit 0\"` | no - 03-02 | pending |
| 03-02-03 | 02 | 2 | BILL-03 | T-03-06 | Evidence explicitly compares runtime balances and display totals instead of assuming they match | evidence audit | `powershell -NoProfile -Command \"$targets = 'runtime_balance','display_total','credit_accounts','user_quotas'; $files = '.planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md','.planning/phases/03-billing-settlement-validation/03-STAGING-GAPS.md'; $content = ($files | ForEach-Object { Get-Content $_ -Raw }) -join \\\"`n\\\"; foreach ($target in $targets) { if ($content -notmatch [regex]::Escape($target)) { exit 1 } }; exit 0\"` | no - 03-02 | pending |
| 03-03-01 | 03 | 3 | BILL-01, BILL-02, BILL-03 | T-03-07 / T-03-08 | Any staging-found inconsistency is covered by local billing regressions before rerun | unit | `npm test -- src/lib/asaas/event-handlers.test.ts src/app/api/webhook/asaas/route.test.ts src/lib/asaas/credit-grants.test.ts src/lib/asaas/quota.test.ts src/app/api/checkout/route.test.ts src/lib/asaas/external-reference.test.ts src/lib/asaas/checkout.test.ts` | partial | pending |
| 03-03-02 | 03 | 3 | BILL-01, BILL-02, BILL-03 | T-03-09 | Gap closure is recorded only after evidence and status markers show resolved or no open issues | evidence audit | `powershell -NoProfile -Command \"$targets = 'Resolved','Open','No open gaps','BILL-01','BILL-02','BILL-03'; $files = '.planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md','.planning/phases/03-billing-settlement-validation/03-STAGING-GAPS.md'; $content = ($files | ForEach-Object { Get-Content $_ -Raw }) -join \\\"`n\\\"; foreach ($target in $targets) { if ($content -notmatch [regex]::Escape($target)) { exit 1 } }; exit 0\"` | no - 03-03 | pending |

*Status: pending, green, red, or flaky.*

---

## Wave 0 Requirements

- [ ] `scripts/replay-staging-asaas.ts` - named staging replay helper for settlement scenarios
- [ ] `scripts/check-staging-billing-state.ts` - repo-local billing snapshot helper for staging evidence
- [ ] `.planning/phases/03-billing-settlement-validation/03-STAGING-EVIDENCE.md` - auditable run log for Phase 3
- [ ] `.planning/phases/03-billing-settlement-validation/03-STAGING-GAPS.md` - explicit open and resolved gaps register

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real Asaas sandbox event can be replayed against staging with the current operator credentials | BILL-01 | This requires live staging access plus third-party sandbox coordination | Populate `.env.staging`, run `bash scripts/verify-staging.sh`, then execute one named scenario with the committed replay helper and confirm both the webhook response and post-run snapshot are recorded. |
| Duplicate delivery or replay does not silently double-grant credits for the same settled charge | BILL-02 | The final proof depends on live staging rows after replay, not just mocked tests | Run the duplicate scenario twice against the same staging identifiers, then inspect `processed_events`, `billing_checkouts`, and `credit_accounts` via the snapshot helper and confirm the second delivery does not create a second grant. |
| Dashboard-facing totals match the runtime balance for the staged billing user after validated scenarios | BILL-03 | Final display correctness depends on live staging data and read paths | After replaying activation, renewal, and cancellation scenarios, compare `user_quotas` display totals with `credit_accounts` runtime balances for the same user and record the comparison in `03-STAGING-EVIDENCE.md`. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 300s for repo-local checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
