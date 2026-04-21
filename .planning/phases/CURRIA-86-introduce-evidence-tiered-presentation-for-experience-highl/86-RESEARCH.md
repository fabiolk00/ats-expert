# Phase 86 Research

## Finding

The remaining dissatisfaction was primarily presentation-level.

- `src/lib/resume/optimized-preview-highlights.ts` still knew the winning experience category.
- `src/components/resume/resume-comparison-view.tsx` only received boolean `highlighted` segments, so every winner rendered with the same visual weight.

## Decision

Keep the selector unchanged and carry category-derived evidence tiers into the render contract.

### Tier 1

- `metric`
- `scope_scale`

### Tier 2

- `contextual_stack`
- `anchored_leadership`
- `anchored_outcome`
