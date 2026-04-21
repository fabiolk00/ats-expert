# Phase 82 Research

## Verified Bottleneck

The bottleneck remained in span selection quality.

Evidence:
- Phase 81 already separated ranking from diff-aware eligibility.
- Visual validation showed weak cases were either:
  - obvious contextual stack spans not entering or surviving ranking
  - otherwise-correct winners rendered with incomplete trailing connectors
  - compact metric or scope winners that were a little too short to read cleanly

## Refactor Direction

- Preserve `evaluateExperienceBulletImprovement(...)` and keep the phase scoped to selector output quality.
- Improve `contextual_stack` recovery by extracting a tighter stack core from matched text.
- Trim weak trailing connectors from rendered spans.
- Allow bounded expansion for compact `metric` and `scope_scale` winners when it improves readability without drifting into narrative.

## Key Implementation Notes

- Added a weak trailing connector cleanup pass before candidate scoring.
- Added contextual stack core extraction so multi-token stacks like `dbt, SQL e Power BI` survive as clean compact candidates.
- Added bounded metric/scope completion so fragments like `mais de 40` can become a complete compact evidence phrase.
