# Quick Task 260422-suf - Research

## Goal

Normalize persisted highlight span boundaries so punctuation-heavy resumes stop showing broken mid-phrase underlines, without redesigning the detector pipeline or weakening existing editorial guardrails.

## Findings

1. The safest insertion point is `validateAndResolveHighlights(...)` in [src/lib/resume/cv-highlight-artifact.ts](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.ts:312).
   The detector already funnels all model payloads through this validator, and the renderer consumes persisted ranges without semantic repair.

2. The refinement should stay local to the artifact layer.
   A small boundary-normalization helper plus a centralized separator policy is enough; no schema or artifact-shape change is needed.

3. Boundary refinement must happen before final editorial acceptance.
   Expanded or trimmed ranges still need to pass `isSafeNonOverlappingRange(...)` and `isEditoriallyAcceptableHighlightRange(...)` so coverage guardrails remain authoritative.

4. `$` must stay meaningful.
   Currency and metric symbols should never be treated as ignorable punctuation during trimming or continuation checks.

5. Pipe-separated stack bullets need an explicit fail-closed policy.
   Refinement should not auto-bridge broad `|` lists. A single segment can survive if it has standalone contextual meaning; flat stack lists should not turn into noisy grouped highlights.

## Recommended Approach

- Add a private span-boundary helper in `cv-highlight-artifact.ts`.
- Centralize ignorable separator characters for boundary refinement only.
- Normalize token boundaries first, then cautiously refine across local punctuation boundaries when the continuation stays compact and semantically attached.
- Keep pipe-separated stack bullets constrained: never swallow whole lists, and drop trivial standalone pipe cells when they are editorially weak.
- Concentrate regressions in `cv-highlight-artifact.test.ts`.

## Risks

- Over-expanding into whole clauses.
  Mitigation: cap local continuation, stop at strong clause boundaries, and re-run editorial guardrails on the refined span.

- Reintroducing noisy stack-only highlights.
  Mitigation: keep `|` handling explicit and fail closed for flat stack lists.

- Breaking currency spans.
  Mitigation: exclude `$` from ignorable separators and add dedicated currency tests.
