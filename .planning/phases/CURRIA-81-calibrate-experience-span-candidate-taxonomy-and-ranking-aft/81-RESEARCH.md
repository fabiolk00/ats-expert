# Phase 81 Research

## Verified Bottleneck

The main bottleneck was span selection.

Evidence:
- After Phase 79, eligible bullets still reached the experience highlight path.
- Failures clustered around which candidate span won once a bullet was already eligible.
- The selector still leaned on a narrow legacy candidate collector, which could:
  - prefer truncated numeric fragments
  - miss multi-token contextual stack spans
  - over-reward weak narrative phrasing when structural signals were present nearby

## Refactor Direction

- Keep `evaluateExperienceBulletImprovement(...)` stable unless selector changes expose real eligibility holes.
- Introduce a calibrated candidate taxonomy in the optimized-text path:
  - `metric`
  - `scope_scale`
  - `contextual_stack`
  - `anchored_leadership`
  - `anchored_outcome`
- Rank categories in this order:
  1. metric/value/count
  2. scope/scale
  3. contextual stack
  4. anchored leadership
  5. anchored outcome

## Key Implementation Notes

- The live render path now uses the calibrated selector (`collectRankedExperienceHighlightCandidates(...)`) instead of the legacy candidate collector.
- Filtering rejects weak standalone spans before ranking.
- Dedupe removes overlapping candidates so only one compact span can win per bullet.
