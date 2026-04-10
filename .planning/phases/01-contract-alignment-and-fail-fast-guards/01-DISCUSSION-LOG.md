# Phase 1: Contract Alignment and Fail-Fast Guards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 01-Contract Alignment and Fail-Fast Guards
**Areas discussed:** Env contract cutover, Fail-fast scope, Validation bar, Refactor shape

---

## Env contract cutover

| Option | Description | Selected |
|--------|-------------|----------|
| Keep runtime names | Keep the current runtime names as the standard and align CI/docs to them | |
| Rename runtime code | Rename runtime code to match the old CI names | |
| Dual-name support | Support both names for now, but declare one canonical and deprecate the other | |

**User's choice:** the agent's discretion
**Notes:** Best-practice decision taken for this repo: keep current runtime names as canonical, use a hard cutover with no aliasing, and cover launch-critical providers only.

---

## Fail-fast scope

| Option | Description | Selected |
|--------|-------------|----------|
| Strict everywhere non-test | Local dev, preview, staging, and prod all fail early for required launch-critical config | |
| Strict only in staging/prod | Local dev can keep warnings or degraded behavior | |
| Selective strictness | Fail fast for auth, billing, database, and OpenAI; keep softer behavior for secondary integrations | |

**User's choice:** the agent's discretion
**Notes:** Best-practice decision taken for this repo: fail fast in every non-test environment for required launch-critical config, while modeling optional integrations explicitly instead of silently degrading.

---

## Validation bar

| Option | Description | Selected |
|--------|-------------|----------|
| Strong proof set | Aligned env contracts, fail-fast validation in code, updated docs/templates, and runnable verification in local/CI | ✓ |
| Code and docs only | Fix runtime/CI/docs drift now, but leave runnable verification to Phase 2 or later | |
| Minimal unblock | Fix only the concrete broken paths and document the rest | |

**User's choice:** Option 1
**Notes:** Interpreted `1` as the first option. Phase 1 must end with proof, not just cleanup.

---

## Refactor shape

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted hardening | Keep changes local to the current modules unless duplication is obviously harmful | ✓ |
| Shared config layer now | Introduce a centralized env/config validation module and migrate critical paths in this phase | |
| Hybrid | Centralize only the most critical validation primitives, but avoid broad migration in Phase 1 | |

**User's choice:** Option 1
**Notes:** Interpreted `1` as the first option. The phase should stay focused on contract cleanup and proof rather than expand into a broader config architecture refactor.

## the agent's Discretion

- Env contract cutover details
- Fail-fast scope defaults

## Deferred Ideas

- Full repository-wide env-contract standardization beyond launch-critical providers
- Shared config-validation layer as a future standalone improvement if targeted hardening exposes enough duplication
