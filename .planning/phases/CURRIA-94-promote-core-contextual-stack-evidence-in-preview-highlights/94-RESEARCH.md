# Phase 94: Promote core contextual stack evidence in preview highlights - Research

**Researched:** 2026-04-22 [VERIFIED: session context]
**Domain:** Optimized preview highlight evidence classification and candidate competitiveness [VERIFIED: codebase grep]
**Confidence:** HIGH [VERIFIED: codebase grep]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
Copied verbatim from `94-CONTEXT.md`. [VERIFIED: codebase grep]
- technology mention alone must not open high-priority highlight eligibility
- strong contextual stack means named technology plus execution verb plus concrete delivery context
- preserved metric dominance from Phase 92 remains intact
- Layer 2 may compare stronger signals, but no opaque combined ranking score should be introduced
- Layer 3 policy and ATS behavior remain unchanged

### Claude's Discretion
Not present in `94-CONTEXT.md`. [VERIFIED: codebase grep]

### Deferred Ideas (OUT OF SCOPE)
Copied verbatim from `94-CONTEXT.md` `## Out Of Scope`. [VERIFIED: codebase grep]
- reopening preserved-metric eligibility behavior from Phase 92
- reducing metric priority
- changing Layer 3 editorial policy
- adding role-specific domain awareness
- changing ATS gates, ATS score policy, UI, export, or rewrite pipeline behavior
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Preserve the current brownfield product surface and prefer small, test-backed changes over broad rewrites. [VERIFIED: codebase grep]
- Keep this work in repo-local preview logic under `src/lib/**`; `cvState` remains canonical truth and the client stays shallow. [VERIFIED: codebase grep]
- Use the existing Next.js, TypeScript, Vitest, and Testing Library stack; no new dependency is needed for this phase. [VERIFIED: codebase grep]

## Summary

Phase 94 should stay inside `src/lib/resume/optimized-preview-highlights.ts` plus focused highlight tests; no UI contract, ATS policy, export flow, or persistence seam needs to change. [VERIFIED: codebase grep]

The current gap is mostly Layer 2 winner selection, not a broken Phase 92 eligibility gate. [VERIFIED: codebase grep] Local runtime probes show a technology-only bullet stays ineligible with `evidenceScore = 0`, plain contextual-stack bullets score around `66-68` and qualify through improvement, and bullets that mix stack context with `global` or `mais de 12 fontes` currently get promoted only because `scope_scale` wins the bullet and the rendered span stops showing the stack phrase. [VERIFIED: shell runtime probe]

**Primary recommendation:** add one private stack-strength classifier reused by candidate scoring and diff-improvement logic, keep the public render category as `contextual_stack`, and strengthen only upstream competitiveness so core contextual stack can beat weak scope/scale fragments inside the same bullet while metrics still win. [VERIFIED: codebase grep]

## Current Evidence Categories

- `metric` is `strong` and starts at `100`; Phase 92 validation shows preserved `40%` and `15%` bullets already clear the `90` evidence threshold. [VERIFIED: codebase grep]
- `scope_scale` is `strong` and starts at `80`; generic `escopo global` or `mais de 12 fontes` phrases can currently become the rendered winner for bullets that also mention Azure Databricks or PySpark. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- `contextual_stack` is `secondary`, starts at `60`, requires at least two tech terms plus meaningful context or methodology, and representative bullets currently score `66-68`. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- `anchored_leadership` and `anchored_outcome` remain secondary fallback categories below contextual stack. [VERIFIED: codebase grep]

## Standard Stack

- Keep implementation in `src/lib/resume/optimized-preview-highlights.ts`; this is the live seam used by both `buildRelevantHighlightLine(...)` and `evaluateExperienceBulletImprovement(...)`. [VERIFIED: codebase grep]
- Keep regression coverage in `src/lib/resume/optimized-preview-highlights.test.ts`, `src/lib/resume/optimized-preview-contracts.test.ts`, and `src/components/resume/resume-comparison-view.test.tsx`. [VERIFIED: codebase grep]
- Use the existing repo toolchain: `vitest` `1.6.1`, `@testing-library/react` `16.3.2`, and `npm run typecheck`; no package installation is required. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]

## Architecture Patterns

- The live split is already explicit: Layer 2 candidate extraction and scoring picks the bullet winner, Layer 1 decides bullet eligibility, and Layer 3 only surfaces already-finalized bullets per entry. [VERIFIED: codebase grep]
- The narrowest seam is a private classifier like `technologyOnly | contextualStack | coreContextualStack` reused by `buildExperienceCandidate(...)` and `scorePhraseUnit(...)`; the unused `collectExperienceHighlightCandidates(...)` helper does not need to be reopened for Phase 94. [VERIFIED: codebase grep]
- Keep the public contract stable: `buildBulletHighlight(...)` forwards the winning category to `highlightCategory`, and current contract/UI tests assert `contextual_stack` renders with secondary styling. [VERIFIED: codebase grep]

### Recommended Pattern

1. Treat `technologyOnly` as the current noise class: tech terms without execution plus delivery context stay ineligible. [VERIFIED: codebase grep]
2. Treat `contextualStack` as the current public secondary class: useful when no Tier 1 evidence exists, but still not strong evidence by itself. [VERIFIED: codebase grep]
3. Treat `coreContextualStack` as a private competitiveness modifier, not a new public category: Phase 94's locked definition of named technology plus execution verb plus concrete delivery context should raise only the contextual-stack candidate's winner score inside the bullet. [VERIFIED: codebase grep]
4. Preserve Phase 92 threshold calibration unless later runtime proof contradicts it; the current failure mode is that stack context loses the winner race, not that preserved metrics lost eligibility again. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]

## Don't Hand-Roll

- Do not build a new cross-layer ranking framework; the repo already has explicit Layer 1, Layer 2, and Layer 3 seams. [VERIFIED: codebase grep]
- Do not add a public `core_contextual_stack` enum or retune `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY`; that would widen the render contract and effectively reopen Layer 3 policy. [VERIFIED: codebase grep]
- Do not lower `EXPERIENCE_BULLET_EVIDENCE_THRESHOLD` to make stack bullets win; Phase 92 calibrated that threshold for preserved metrics, and current probes show the main gap is bullet-winner competitiveness. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- Do not add job-domain-aware stack logic; `94-CONTEXT.md` marks that out of scope. [VERIFIED: codebase grep]

## Common Pitfalls

- Solving a Layer 2 winner problem by changing Layer 3 ordering will break the locked policy that `metric` and `scope_scale` win by tier/category order under entry-cap pressure. [VERIFIED: codebase grep]
- Exporting a new public category will cascade into contract and UI tests that currently assert `contextual_stack` plus secondary styling. [VERIFIED: codebase grep]
- Reopening Phase 92 threshold or ATS behavior risks undoing the preserved-metric fix validated in `92-VALIDATION.md`. [VERIFIED: codebase grep]
- Reusing the unused `collectExperienceHighlightCandidates(...)` path would widen scope without affecting the live preview flow. [VERIFIED: codebase grep]

## Code Examples

Recommended private seam, keeping the public contract stable:

```ts
type StackEvidenceClass = 'technologyOnly' | 'contextualStack' | 'coreContextualStack'

const stackEvidence = classifyStackEvidence(candidate.text, optimizedBullet)

if (stackEvidence === 'technologyOnly') return null

if (candidate.category === 'contextual_stack' && stackEvidence === 'coreContextualStack') {
  score += CORE_CONTEXTUAL_STACK_BONUS
}
```

This pattern stays private to `optimized-preview-highlights.ts` so `highlightCategory` can remain `contextual_stack` in the renderer and tests. [VERIFIED: codebase grep]

## Recommended Tests

- Stack-context strength: add direct `evaluateExperienceBulletImprovement(...)` and `buildRelevantHighlightLine(...)` cases proving Azure Databricks plus PySpark plus execution plus delivery context beats stack-only noise, while plain `SQL e Python` stays ineligible. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- Metric coexistence: add a bullet that contains core contextual stack plus `32%` and assert the winner stays `metric`, with preserved-metric behavior unchanged. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- `scope_scale` competition: make this a single-bullet winner test, not a Layer 3 selector inversion test; prove a bullet containing both weak `scope_scale` text and core contextual stack now highlights the stack phrase instead of only `escopo global` or `mais de 12 fontes`. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- Preview regressions: keep pipeline/UI tests proving caps stay at one span per bullet and two bullets per entry, `contextual_stack` still renders as secondary, preserved metrics still surface, and superficial stack bullets remain suppressed. [VERIFIED: codebase grep]

## Non-Goals

- No Layer 3 policy change. [VERIFIED: codebase grep]
- No ATS gate or ATS score change. [VERIFIED: codebase grep]
- No domain-aware job logic. [VERIFIED: codebase grep]
- No UI, export, persistence, or rewrite-pipeline change. [VERIFIED: codebase grep]

## State of the Art

- Phase 79 separated diff scoring from rendered highlight selection, and Phase 92 added independent evidence eligibility without changing Layer 2 or Layer 3 ownership. [VERIFIED: codebase grep]
- Phase 94 should continue that pattern by strengthening the existing candidate taxonomy instead of adding a new selector or opaque ranking layer. [VERIFIED: codebase grep]

## Assumptions Log

All claims in this research were verified in this session; no user confirmation is required before planning. [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]

## Open Questions

1. Should Phase 94 also clean up the unused `collectExperienceHighlightCandidates(...)` helper? [VERIFIED: codebase grep]
   What we know: it is not called by the live preview flow today. [VERIFIED: codebase grep]
   Recommendation: keep it out of scope unless planner wants opportunistic cleanup, because the narrow implementation path only needs the live Layer 1 plus Layer 2 seam. [VERIFIED: codebase grep]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vitest and TypeScript commands | yes | 24.14.0 | none |
| npm | `npx vitest` and `npm run typecheck` | yes | 11.9.0 | none |
| Vitest | Focused highlight regression runs | yes | 1.6.1 | `npm test` |

Availability and versions were verified with local shell probes in this workspace. [VERIFIED: shell runtime probe]

**Missing dependencies with no fallback:** None. [VERIFIED: shell runtime probe]

## Validation Architecture

- Framework: Vitest with `@vitejs/plugin-react`; `.tsx` tests use `jsdom`, `vitest.setup.ts` is loaded, and the `@` alias resolves to `./src`. [VERIFIED: codebase grep]
- Quick run command: `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`. [VERIFIED: codebase grep]
- Full suite command: `npm test` plus `npm run typecheck`. [VERIFIED: codebase grep]
- Wave 0 gaps: add the four focused cases listed in `## Recommended Tests`; the framework itself already exists. [VERIFIED: codebase grep]

## Security Domain

- Applicable ASVS: only V5 Input Validation materially applies here because the phase parses user-controlled resume text with regex and token logic inside `optimized-preview-highlights.ts`; auth, session, access-control, and crypto paths are not being modified. [VERIFIED: codebase grep]
- Threat pattern: pathological or overly broad regex matching on resume text. Standard mitigation: keep bounded regexes plus word-count and character-count filters, and add focused regressions for stack-only noise and mixed stack-plus-scope bullets. [VERIFIED: codebase grep]
- Threat pattern: accidental HTML-like rendering logic in the preview. Standard mitigation: keep highlight output as plain text segments and do not introduce HTML parsing or `dangerouslySetInnerHTML`. [VERIFIED: codebase grep]

## Sources

### Primary (HIGH confidence)

- `C:/CurrIA/src/lib/resume/optimized-preview-highlights.ts` - candidate scoring, eligibility, render contract, and Layer 3 selector. [VERIFIED: codebase grep]
- `C:/CurrIA/src/lib/resume/optimized-preview-highlights.test.ts` - preserved metric, contextual stack, and preview regression coverage. [VERIFIED: codebase grep]
- `C:/CurrIA/src/lib/resume/optimized-preview-contracts.test.ts` - highlight cap and contract assertions. [VERIFIED: codebase grep]
- `C:/CurrIA/src/components/resume/resume-comparison-view.test.tsx` - UI tier/category styling contract. [VERIFIED: codebase grep]
- `C:/CurrIA/.planning/phases/CURRIA-94-promote-core-contextual-stack-evidence-in-preview-highlights/94-CONTEXT.md` - phase scope, locked decisions, and non-goals. [VERIFIED: codebase grep]
- `C:/CurrIA/.planning/phases/CURRIA-92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi/92-VALIDATION.md` - Phase 92 evidence-threshold calibration and non-goals. [VERIFIED: codebase grep]
- `C:/CurrIA/CLAUDE.md`, `C:/CurrIA/package.json`, and `C:/CurrIA/vitest.config.ts` - project constraints and local test stack. [VERIFIED: codebase grep]
- Local runtime probes executed with `npx tsx`, `node --version`, `npm --version`, `npx vitest --version`, and `npx tsc --version`. [VERIFIED: shell runtime probe]

### Secondary (MEDIUM confidence)

- None.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:** [VERIFIED: codebase grep] [VERIFIED: shell runtime probe]
- Standard stack: HIGH - existing repo stack only; no new package choice is involved.
- Architecture: HIGH - exact code seams plus runtime winner probes confirm the current failure mode.
- Pitfalls: HIGH - backed by current selector ordering, Phase 92 validation, and existing regression tests.

**Research date:** 2026-04-22 [VERIFIED: session context]
**Valid until:** 2026-05-22 [ASSUMED]
