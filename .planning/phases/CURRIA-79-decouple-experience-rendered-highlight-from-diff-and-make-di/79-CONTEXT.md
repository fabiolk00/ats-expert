# Phase 79 Context

## Goal

Refactor experience highlight rendering so the optimized preview no longer chooses its rendered highlight span primarily from original-vs-optimized diff. Diff/comparison should remain useful for improvement scoring, gating, and change indicators, but the final rendered span must come from structural evidence inside the optimized bullet itself.

## Problem

The current experience highlight path is too dependent on comparison logic. That makes the UI emphasize "what changed" instead of "what is structurally salient and valuable" inside the optimized bullet. In practice this leaks diff bias into the rendered span and allows weak narrative fragments to look highlighted just because they differ from the original wording.

## Decisions

- Scope only experience highlight rendering in the optimized comparison preview.
- Keep summary, export, persistence, ATS scoring, rewrite generation, and job-targeting logic out of scope.
- Split logic into two responsibilities:
  - Improvement evaluation: diff-aware scoring, eligibility, and change metadata.
  - Rendered span selection: optimized-text-first structural span selection.
- The rendered span selector must stay domain-agnostic and must not be tuned to sample-specific resume vocabulary.
- Zero highlight is acceptable when no structurally strong span exists.
- Preserve existing hard caps: max one highlighted span per bullet and max two highlighted bullets per experience entry.
- No full-line or near-full-line highlight for this phase.
- Investigation must explicitly answer:
  1. where diff currently influences rendered span selection
  2. what can stay as score or gate logic
  3. what should move into optimized-text-first span selection
  4. what is the smallest viable refactor to achieve the split

## Deliverables

- Short architecture note for the split between score/gate and span selection.
- Explicit decision on diff role in the new model.
- Implementation plan.
- Updated tests covering diff-aware gating and optimized-text-first span selection.

## Acceptance Criteria

- Rendered experience highlight no longer depends primarily on diff.
- Change indicators can still use diff or improvement metadata.
- Highlight selection is based on structural evidence found in optimized bullet text.
- Behavior stays domain-agnostic instead of tuned to one resume sample.
- Poor narrative-only highlights disappear.
- Zero-highlight bullets are allowed.

## Verification

- `npm run typecheck`
- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
