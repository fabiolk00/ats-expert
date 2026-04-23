# Quick Task 260422-wgg - Refine semantic stop conditions for highlight span boundaries

## Goal

Tighten the local stop-condition heuristics used by highlight boundary normalization so detector spans that are truncated but nearly correct can close into the intended phrase when safe, while still stopping before a new clause, broad promotional span, or noisy pipe-list grouping.

## Guardrails

- Keep the change local to `src/lib/resume/cv-highlight-artifact.ts`.
- Refine stop conditions only; do not redesign detection, segmentation, or artifact persistence.
- Preserve compactness, fail-closed behavior, and the existing editorial coverage gates.
- Protect pipe-heavy bullets from grouped or trivial highlights.
- Do not change detector contracts unless normalized range expectations shift as a secondary effect.

## Task 1 - Refine stop-condition heuristics in the artifact layer

**Files**
- `src/lib/resume/cv-highlight-artifact.ts`

**Action**
- Refine the local boundary helpers around `readShortContinuationEnd(...)`, `shouldExpandAcrossBoundary(...)`, and any small private helpers needed so continuation decisions are driven by phrase-closure semantics instead of punctuation alone.
- Revisit the current continuation thresholds (`HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS`, `HIGHLIGHT_MAX_CONTINUATION_WORDS`) only as needed to support short, nearly-complete phrase closures without broadening into clause-level spans.
- Add explicit logic for continuation-vs-new-clause decisions:
  continue across short trailing qualifiers or noun phrases when they complete the intended thought;
  stop on verb-led or conjunction-led follow-ups that read like a new clause.
- Preserve compactness by keeping expansion local, bounded, and subject to the existing editorial acceptance checks.
- Keep pipe-heavy bullet protection fail closed so flat `A | B | C` stacks still do not become grouped highlights and trivial cells stay droppable.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts`

**Done**
- Boundary refinement stays local to the artifact layer.
- Nearly-correct truncated spans can close into the intended phrase when the continuation is short and semantically attached.
- Clause breaks still stop expansion.
- Pipe-heavy bullets remain protected from noisy broad spans.

## Task 2 - Add focused regression coverage for semantic stop conditions

**Files**
- `src/lib/resume/cv-highlight-artifact.test.ts`

**Action**
- Add a narrow regression matrix covering:
  threshold edges for short continuation allowance,
  phrase-closure continuations,
  continuation-vs-new-clause splits,
  compactness preservation,
  pipe-heavy bullet protection,
  and truncated-but-nearly-correct fragments that should now resolve to the full local phrase.
- Include both positive and negative cases so the suite proves where normalization should stop, not only where it should expand.
- Keep the cases editorially realistic and close to the current bug shape rather than introducing unrelated highlight behaviors.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts`

**Done**
- Tests lock the intended stop/continue semantics.
- Regression coverage includes edge-threshold and nearly-correct truncation cases.
- Compactness and pipe protections are explicitly proven.

## Task 3 - Revalidate detector-facing expectations without changing the contract

**Files**
- `src/lib/agent/tools/detect-cv-highlights.test.ts`

**Action**
- Re-run detector-contract coverage after the artifact-layer refinement.
- Only update detector test expectations if normalized span boundaries legitimately shift after the artifact change; do not change detector code unless a test reveals an actual secondary mismatch.
- Keep the single-call detector architecture and fail-closed parsing behavior intact.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`

**Done**
- Detector behavior remains contractually unchanged.
- Any expectation updates are limited to downstream span normalization results.
- The final verification proves the refinement did not widen the scope beyond artifact normalization.

## Risks And Mitigations

- Risk: over-expanding into adjacent clauses.
  Mitigation: keep strict semantic stop checks for conjunction-led and verb-led continuations, plus bounded thresholds.

- Risk: reopening noisy flat-list highlighting.
  Mitigation: preserve existing pipe-stack fail-closed behavior and add explicit regressions for pipe-heavy bullets.

- Risk: improving one truncation case by making spans too long overall.
  Mitigation: keep compactness checks local and rely on the existing editorial coverage gates as the final backstop.

## Final Verification

- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`
- `npm run typecheck`
