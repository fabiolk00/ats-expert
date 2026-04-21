# Phase 82 Context

## Goal

Recover obvious contextual stack winners and improve compact span completeness in experience highlights after the taxonomy calibration.

## Initial Verification

The remaining weaknesses were visual selection issues, not diff-aware gating issues.

Result:
- Strong bullets were still becoming eligible.
- The remaining misses came from candidate recovery and compact span rendering.
- The most visible issues were missed `contextual_stack` clusters and highlighted spans ending with weak connector tails.

Conclusion:
- Keep diff/render architecture unchanged.
- Focus this phase on candidate recovery and bounded span cleanup.

## Scope

- `contextual_stack` candidate recovery
- compact span completeness and trimming
- slight completeness improvements for `metric` and `scope_scale`

## Rules

- do not reopen diff-aware gating unless a selector change proves a real false negative
- keep max 1 highlighted span per bullet
- keep max 2 highlighted bullets per experience entry
- allow zero highlight
