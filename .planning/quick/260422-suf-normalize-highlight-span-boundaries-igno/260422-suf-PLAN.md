# Quick Task 260422-suf - Normalize highlight span boundaries ignoring punctuation separators and refine broken mid-phrase highlights

## Goal

Improve persisted preview highlight spans so commas, pipes, parentheses, slashes, and similar separators no longer cause obvious mid-phrase truncation, while preserving compactness, fail-close safety, and the current single-call detector architecture.

## Implementation Decisions

- Keep the change local to `src/lib/resume/cv-highlight-artifact.ts`.
- Apply boundary normalization after raw payload parsing and range collection, but before final overlap/editorial acceptance.
- Treat low-semantic-weight separators as boundary refinement hints only; do not broaden into deterministic keyword highlighting.
- Preserve `$`, `%`, digits, and other metric symbols as meaningful.
- Use an explicit stack-bullet policy so pipe-heavy flat lists stay constrained and do not become broad grouped highlights.

## Task 1 - Add separator-aware boundary normalization in the artifact layer

**Files**
- `src/lib/resume/cv-highlight-artifact.ts`

**Action**
- Add a private helper that trims or cautiously expands ranges around ignorable separators so spans align to complete local phrases instead of dying mid-token or mid-phrase.
- Centralize the separator policy in one constant/set.
- Keep `$` meaningful and preserve existing coverage/non-overlap guardrails.
- Add explicit handling for pipe-heavy stack bullets so refinement stays local and fail closed.
  Never normalize a flat `A | B | C | D` line into one grouped highlight; keep at most one standalone meaningful segment and drop trivial pipe cells.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts`

**Done**
- Boundary refinement is part of artifact resolution.
- Mid-phrase punctuation splits are repaired locally.
- Editorial compactness and fail-close behavior remain intact.
- Flat pipe lists never become one grouped highlight, and trivial pipe cells are dropped fail closed.

## Task 2 - Add regression coverage for punctuation-heavy and currency-sensitive cases

**Files**
- `src/lib/resume/cv-highlight-artifact.test.ts`

**Action**
- Add focused tests for comma, pipe, parentheses, slash, colon/semicolon, clause-boundary, and currency-sensitive span behavior.
- Cover stack-heavy bullets so grouped highlights stay compact and flat lists do not become noisy broad spans.
- Add an explicit regression proving a flat `A | B | C | D` stack line does not normalize into one grouped highlight.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts`

**Done**
- Tests lock punctuation-heavy behavior.
- Tests prove `$` stays meaningful.
- Tests prove stack-heavy bullets remain constrained.

## Task 3 - Final verification across artifact and detector contracts

**Files**
- `src/lib/agent/tools/detect-cv-highlights.test.ts`

**Action**
- Keep detector architecture unchanged, but rerun detector-contract coverage alongside artifact tests so the quick task still proves single-call and fail-close safety after span-boundary refinement.

**Verify**
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts`

**Done**
- No pipeline redesign.
- Detection remains single-call.
- Boundary normalization responsibility stays local to artifact resolution.
- Final verification always includes detector-contract coverage, even when detector code is untouched.

## Risks And Mitigations

- Over-normalizing into large promotional spans.
  Mitigation: keep continuation local and let existing editorial coverage guardrails reject oversized ranges.

- Reviving stack-only highlight noise.
  Mitigation: use explicit pipe handling and drop weak flat-list fragments.

- Losing monetary meaning.
  Mitigation: exclude `$` from ignorable separators and add dedicated currency regressions.
