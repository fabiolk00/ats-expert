# Phase 32 Research: Phase Verification Backfill and Audit Contract

**Date:** 2026-04-15
**Phase:** 32-phase-verification-backfill-and-audit-contract

## Goal

Backfill the missing verification layer for the shipped `v1.4` work so milestone audit can rely on committed requirement evidence instead of failing only because `VERIFICATION.md` artifacts are absent.

## Evidence Collected

### The current milestone audit fails because the required phase verification layer is missing, not because the shipped code is obviously broken

- `.planning/milestones/v1.4-MILESTONE-AUDIT.md` marks all `12` in-scope requirements as unsatisfied.
- The audit file is explicit that the main blocker is missing `VERIFICATION.md` artifacts for phases `28`, `29`, `30`, `31`, and `31.1`.
- The same audit also notes that implementation evidence already exists in summaries and committed tests.

This means Phase 32 should focus first on proof-shape and evidence traceability, not on reopening the shipped product work.

### The requirements archive already distinguishes shipped implementation from verification completeness

- `.planning/milestones/v1.4-REQUIREMENTS.md` records that every `AGENT-*`, `SEC-*`, `REL-*`, and `PERF-*` requirement was implemented, while also noting that formal phase verification was missing at archive time.
- That file is a useful evidence matrix, but it does not satisfy the audit workflow by itself because the workflow expects per-phase `VERIFICATION.md` files.

Phase 32 should therefore reuse this archive as a source of claims, but move the canonical audit proof back down to the phase level.

### The active phase directories were cleared at the start of `v1.5`, so backfill work must target archived phase history rather than the old active paths

- `.planning/phases/` is empty of the `v1.4` execution directories because `phases clear --confirm` ran during `v1.5` initialization.
- `.planning/milestones/v1.4-ROADMAP.md` and `.planning/milestones/v1.4-REQUIREMENTS.md` remain on disk, but there is currently no `.planning/milestones/v1.4-phases/` tree.
- The original phase summaries, plans, research, and validation artifacts are now available only through git history unless Phase 32 reconstructs an archive location for them.

This is the key operational constraint for the phase: the backfill cannot assume the original phase directories still exist.

### The audit workflow requires more than a prose summary

From the `gsd-audit-milestone` workflow and the generated audit:

- The milestone audit expects `VERIFICATION.md` per phase.
- It also cross-checks requirements against:
  - `REQUIREMENTS.md` traceability
  - `VERIFICATION.md`
  - `SUMMARY.md` `requirements-completed` frontmatter
- The current `v1.4` summaries do not expose `requirements-completed` frontmatter in the way the audit expects.

Phase 32 therefore needs to decide whether the summary contract itself must be backfilled or whether the verification layer can become the canonical source while documenting the remaining summary limitation explicitly.

### The shipped evidence is still reconstructible from committed artifacts and tests

The `v1.4` archive and git history already describe enough to support a disciplined backfill:

- `v1.4-ROADMAP.md` gives phase boundaries, goals, dependencies, and plan names.
- `v1.4-REQUIREMENTS.md` maps each requirement to its phase and records implementation outcomes.
- `v1.4-MILESTONE-AUDIT.md` enumerates exactly which requirements and flows were considered unsatisfied.
- The earlier phase summaries and test suites are available in git history and can be used to justify a conservative verification result.

That means Phase 32 does not need to invent new claims. It needs a consistent archive location and a conservative verification-writing method.

## Recommended Plan Split

### Wave 1

- `32-01`: Establish the canonical verification backfill contract and archive path for `v1.4` phase evidence.

This goes first because every later task depends on knowing where the reconstructed phase artifacts and verification docs should live, and what fields they must contain.

### Wave 2

- `32-02`: Reconstruct or archive the `v1.4` phase evidence set and write the missing `VERIFICATION.md` files with requirement-level evidence.

This is the bulk backfill wave. It should be conservative and traceable to committed artifacts only.

### Wave 3

- `32-03`: Re-run audit-style coverage proof, update the archived `v1.4` audit outcome, and document any residual limitations that still remain after the backfill.

This comes last because it depends on the new verification artifacts being present and on their requirement mappings being final.

## Risks and Constraints

- Phase 32 must not over-claim. Any requirement without enough committed evidence should stay partial or gap-marked in verification rather than being silently promoted to passed.
- The backfill must use a stable archive target, not resurrect `v1.4` as an active milestone.
- Any summary-frontmatter gap that remains after the backfill must be made explicit in the final audit output instead of being buried.
- The phase should prefer repo-local and archive-local proof over editing user-home GSD tooling unless a repo-local fix is genuinely impossible.

## Validation Architecture

### Automated proof

1. Use static checks to confirm the reconstructed archive contains all expected `VERIFICATION.md` files for phases `28`, `29`, `30`, `31`, and `31.1`.
2. Run repo-local grep or script checks that each verification file lists the expected requirement IDs for its phase.
3. Re-run the milestone audit against `v1.4` and confirm the result is no longer failing solely because proof files are absent.
4. Run `node "$HOME/.codex/get-shit-done/bin/gsd-tools.cjs" state validate` after the planning and archive updates.

### Manual or operator proof

1. Spot-check at least one backfilled phase from each requirement family (`AGENT`, `SEC`, `REL`, `PERF`) against its archived summary and referenced tests.
2. Review the updated milestone audit and confirm it clearly distinguishes resolved proof gaps from any residual accepted debt.

### Success signal for Phase 32

Phase 32 can be considered complete only when all of the following are true:

- the `v1.4` phase archive has a stable location for backfilled phase evidence
- every `v1.4` implementation phase has a committed `VERIFICATION.md`
- milestone audit can evaluate `v1.4` from committed verification evidence instead of failing only because the proof files are missing
- any residual limitation is explicit and conservative rather than implied away
