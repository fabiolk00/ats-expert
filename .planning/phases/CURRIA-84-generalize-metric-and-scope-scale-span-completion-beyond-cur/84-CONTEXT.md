# Phase 84 Context

## Goal

Generalize `metric` and `scope_scale` highlight completion so it works across different resume segments and wording styles instead of depending on the previous batch's phrase shapes.

## Initial Verification

Cross-domain validation showed the selector was structurally healthy, but completion still degraded on some new phrasing shapes.

Result:
- Category choice remained correct.
- `contextual_stack` stayed healthy.
- Zero-highlight behavior stayed intentional.
- Remaining failures clustered around phrase-shape completion in metric and scope/scale spans.

Conclusion:
- Keep ranking and diff/render architecture unchanged.
- Replace narrow completion shapes with reusable local phrase-structure rules.

## Scope

- `metric` span completion generalization
- `scope_scale` span completion generalization
- cross-domain regressions and validation note

## Rules

- do not reopen ranking
- do not reopen diff/render split
- do not weaken zero-highlight behavior
- keep spans compact and non-narrative
