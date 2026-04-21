# Phase 79 Research

## Current Code Path

- `src/components/resume/resume-comparison-view.tsx` calls `buildOptimizedPreviewHighlights(originalCvState, cvState)` for the optimized column.
- `buildOptimizedPreviewHighlights(...)` in `src/lib/resume/optimized-preview-highlights.ts` iterates optimized experience entries and bullets.
- Each optimized bullet goes through `buildBulletHighlight(originalEntry, optimizedBullet)`.
- `buildBulletHighlight(...)` finds the closest original bullet through `findClosestOriginalBullet(...)`, then calls `collectExperienceHighlightCandidates(closestOriginalBullet, optimizedBullet)`.
- `collectExperienceHighlightCandidates(...)` filters candidate spans by checking whether the normalized candidate already exists in the original bullet. That means diff is not just gating eligibility; it directly removes or preserves candidate spans before render selection.
- The chosen candidate then flows straight into `buildExperienceHighlightLine(...)`, which renders the selected span.

## Explicit Answers

### 1. Where diff currently influences rendered span selection

- `findClosestOriginalBullet(...)` uses lexical similarity to choose which original bullet becomes the comparison baseline.
- `collectExperienceHighlightCandidates(...)` rejects structural candidates whose normalized text appears in the original bullet.
- Because the same candidate list is later ranked and rendered, diff currently participates in selecting the final highlighted span, not only in deciding whether highlight should happen.

### 2. What can be preserved as score or gating logic

- Closest-original-bullet matching remains useful for bullet-level improvement evaluation.
- Original-vs-optimized comparison can still support:
  - whether the bullet improved meaningfully
  - whether highlight is eligible at all
  - change indicator state
  - bullet prioritization when only two bullets per entry may highlight

### 3. What should move into optimized-text-first span selection

- Candidate extraction for the rendered span.
- Structural evidence scoring across categories such as:
  - metric/value/count
  - scope marker
  - scale/volume marker
  - contextual tool or technology in execution context
  - methodology/framework marker
  - ownership or leadership marker
  - business outcome marker
- Rejection of weak isolated spans such as generic role labels, generic action verbs, abstract phrasing, and isolated tools with no context.

### 4. Smallest viable refactor

- Keep `findClosestOriginalBullet(...)` as the diff-aware baseline for improvement evaluation only.
- Introduce a separate improvement-analysis step that scores and gates each optimized bullet against its closest original match.
- Introduce a separate optimized-text span selector that sees only the optimized bullet text and structural evidence heuristics.
- Update `buildOptimizedPreviewHighlights(...)` so:
  - gating and bullet ranking use improvement analysis
  - rendered highlight line uses optimized-text span selection only
- Preserve the public `HighlightedLine` shape and render component contract to minimize UI churn.

## Architecture Note

Use a two-step experience highlight pipeline:

1. `evaluateExperienceBulletImprovement(originalBullet, optimizedBullet)`
Returns improvement score and eligibility metadata. This is the only stage allowed to look at original-vs-optimized comparison.

2. `selectExperienceHighlightSpan(optimizedBullet)`
Returns the best structural span, or `null` when no strong evidence exists. This stage must not inspect the original bullet.

`buildOptimizedPreviewHighlights(...)` then combines them:
- if improvement is not eligible, render no highlight
- if eligible but no strong optimized-text span exists, render no highlight
- if eligible and a strong span exists, render that span

## Decision On Diff Role

Diff should be score/gate only for rendered experience highlights in this phase. It should not directly choose the rendered span.

## Tests To Add Or Update

- A regression proving a bullet can highlight a strong optimized structural span even when that same structural phrase is not the newest lexical diff fragment.
- A regression proving improvement can be judged meaningful while the rendered span is absent because no strong optimized-text evidence exists.
- A regression proving isolated skill tokens and narrative-only additions stay unhighlighted even when they differ strongly from the original.
- A regression proving bullet caps still prefer the strongest eligible bullets by improvement score while each chosen bullet renders at most one optimized-text span.
