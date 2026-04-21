# Phase 83 Context

## Goal

Improve the visual completeness of `metric` and `scope_scale` experience highlight spans after the selector became structurally healthy in Phase 82.

## Initial Verification

The remaining issue was no longer category choice or eligibility.

Result:
- Strong evidence was usually winning.
- `contextual_stack` behaved reliably enough.
- Zero-highlight cases still looked intentional.
- The visible weakness was clipped `metric` and `scope_scale` winners that felt under-contextualized.

Conclusion:
- Keep diff/render architecture unchanged.
- Keep the taxonomy and ranking model unchanged.
- Focus only on tightly bounded phrase completion for metric and scope/scale winners.

## Scope

- `metric` span completeness
- `scope_scale` span completeness
- bounded expansion and cleanup rules for those categories only

## Rules

- do not increase noise
- do not create long highlight spans
- do not weaken zero-highlight behavior
- do not let leadership/outcome phrasing creep back in through over-expansion
