---
phase: 32
slug: phase-verification-backfill-and-audit-contract
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-15
---

# Phase 32 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Static planning and archive verification using PowerShell, `rg`, git-history inspection, and GSD state validation |
| **Config files** | `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/milestones/v1.4-ROADMAP.md`, `.planning/milestones/v1.4-REQUIREMENTS.md`, `.planning/milestones/v1.4-MILESTONE-AUDIT.md` |
| **Quick run command** | `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate` |
| **Primary targeted suite** | `powershell -NoProfile -Command "$files = Get-ChildItem .planning/milestones/v1.4-phases -Recurse -Filter *-VERIFICATION.md; if ($files.Count -lt 5) { exit 1 }; $content = $files | Get-Content -Raw; if ($content -notmatch 'AGENT-01' -or $content -notmatch 'SEC-01' -or $content -notmatch 'REL-01' -or $content -notmatch 'PERF-01') { exit 1 }"` |
| **Static doc audit** | `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate` plus targeted grep checks for verification and audit status |
| **Estimated runtime** | ~60 seconds for static planning checks and archive validation |

---

## Sampling Rate

- **After every task commit:** Run `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate`
- **After every plan wave:** Run the targeted PowerShell or grep checks for the affected archive and verification files
- **Before phase verification:** Re-run the full archive-verification check plus the refreshed milestone audit proof
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | VER-01 | T-32-01 / T-32-02 | The repo defines one canonical archive path and one conservative verification schema for shipped phases | static | `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate` | yes | pending |
| 32-02-01 | 02 | 2 | VER-01, VER-02 | T-32-01 / T-32-02 / T-32-03 | Each `v1.4` phase has a committed `VERIFICATION.md` whose claims are tied to archived summaries, tests, and requirement IDs | static | `powershell -NoProfile -Command "$files = Get-ChildItem .planning/milestones/v1.4-phases -Recurse -Filter *-VERIFICATION.md; if ($files.Count -ne 5) { exit 1 }; $content = $files | Get-Content -Raw; if ($content -notmatch 'AGENT-01' -or $content -notmatch 'SEC-03' -or $content -notmatch 'REL-03' -or $content -notmatch 'PERF-03') { exit 1 }"` | no - 32-02 | pending |
| 32-03-01 | 03 | 3 | VER-02 | T-32-02 | The archived milestone audit evaluates `v1.4` from committed verification evidence and documents any residual limits explicitly | static | `powershell -NoProfile -Command "$audit = Get-Content '.planning/milestones/v1.4-MILESTONE-AUDIT.md' -Raw; if ($audit -notmatch 'VERIFICATION.md' -or $audit -notmatch 'requirements') { exit 1 }"` | no - 32-03 | pending |
| 32-03-02 | 03 | 3 | VER-01, VER-02 | T-32-01 / T-32-02 | Final state and archive consistency remain valid after the verification backfill | static | `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate` | no - 32-03 | pending |

*Status: pending, green, red, or flaky.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Backfilled verification claims do not overstate what shipped | VER-01, VER-02 | Requires judgment against archived summaries, tests, and audit language | Manually compare at least one verification file from each requirement family against its cited summary and tests, and confirm any uncertain area remains partial or explicitly gap-marked. |
| Updated `v1.4` audit communicates remaining limitations clearly | VER-02 | Requires human review of wording and archive clarity | Read the refreshed audit and confirm it no longer fails solely on missing proof files while still calling out any remaining accepted debt. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 300s for repo-local checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-15
