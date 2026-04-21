# Phase 81 Context

## Goal

Calibrate the optimized-text-first experience span selector so rendered highlights become consistently useful, compact, and domain-agnostic after the diff/render split.

## Initial Verification

The first question for this phase was whether the bottleneck lived in gating or span selection.

Result:
- Good bullets were still entering the pipeline.
- The main failure mode was candidate selection and ranking: wrong spans won, contextual stacks were sometimes missed, and bare numeric fragments could outrank more useful metric spans.

Conclusion:
- The primary bottleneck is span selection, not `evaluateExperienceBulletImprovement(...)`.
- Gating should stay mostly stable unless a selector change proves a real false-negative eligibility case.

## Scope

- `collectExperienceHighlightCandidates(...)`
- candidate filtering
- candidate category ranking
- compact span caps

## Rules

- no sample-specific token tuning
- no resume-sample hardcoding
- reason over signal classes
- keep max 1 span per bullet
- keep max 2 bullets per experience entry
- allow zero highlight
