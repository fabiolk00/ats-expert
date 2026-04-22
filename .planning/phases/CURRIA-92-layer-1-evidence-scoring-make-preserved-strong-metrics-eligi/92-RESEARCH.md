# Phase 92: Layer 1 evidence scoring: make preserved strong metrics eligible for highlight - Research

**Researched:** 2026-04-21
**Domain:** Resume optimized-preview highlight scoring and same-entry editorial surfacing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- preserved strong evidence in the optimized bullet must remain eligible even when improvement delta is minimal [VERIFIED: codebase grep]
- `evidenceScore` must be explicit and numeric so tests can assert its scale and threshold [VERIFIED: codebase grep]
- technology mention alone must not open eligibility without measurable or scope-anchored evidence [VERIFIED: codebase grep]
- Layer 1 returns signals only; it must not decide which same-entry bullet wins visible surfacing [VERIFIED: codebase grep]
- Layer 2 remains responsible for candidate comparison and Layer 3 remains responsible for visible editorial surfacing [VERIFIED: codebase grep]

### Claude's Discretion
No `## Claude's Discretion` section exists in `92-CONTEXT.md`. [VERIFIED: codebase grep]

### Deferred Ideas (OUT OF SCOPE)
No `## Deferred Ideas` section exists in `92-CONTEXT.md`; use `## Out Of Scope` as the effective defer list for planning. [VERIFIED: codebase grep]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-HILITE-EVIDENCE-01 | `evaluateExperienceBulletImprovement(...)` returns a numeric `evidenceScore` derived from the optimized bullet itself, so preserved strong metrics, quantified scope, and measurable outcomes stay editorially visible even when the rewrite delta is small. [VERIFIED: codebase grep] | Reuse the optimized-only best candidate from `getBestExperienceHighlightCandidate(...)` and surface its numeric score separately from `improvementScore`. [VERIFIED: codebase grep] |
| EXP-HILITE-EVIDENCE-ELIGIBILITY-01 | Experience-bullet highlight eligibility now uses two independent paths, `evidenceScore >= EVIDENCE_THRESHOLD || improvementScore >= IMPROVEMENT_THRESHOLD`, while Layer 1 continues returning signals only and does not take same-entry ranking decisions away from Layer 2 or Layer 3. [VERIFIED: codebase grep] | Keep thresholding in Layer 1, keep `buildBulletHighlight(...)` as the per-bullet Layer 2 assembler, and keep `selectVisibleExperienceHighlightsForEntry(...)` as the Layer 3 selector. [VERIFIED: codebase grep] |
| EXP-HILITE-EVIDENCE-TEST-01 | Regression coverage proves preserved metrics become eligible again, new metrics stay eligible, weak stack-only bullets do not gain false eligibility, and same-entry editorial surfacing still favors Tier 1 metric evidence over scope/scale under cap pressure. [VERIFIED: codebase grep] | Add direct tests against exported `evaluateExperienceBulletImprovement(...)`, retain existing same-entry pipeline tests, and keep `npm run typecheck` in the phase gate. [VERIFIED: codebase grep][VERIFIED: local test run] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Preserve the existing brownfield product surface unless scope explicitly changes. [VERIFIED: CLAUDE.md]
- Prefer reliability, billing safety, observability, and verification over net-new feature breadth; for this phase that means narrow, test-backed scoring changes only. [VERIFIED: CLAUDE.md]
- Follow surrounding file style, use `@/*` imports, kebab-case filenames, camelCase functions, and named exports except where Next.js expects defaults. [VERIFIED: CLAUDE.md]
- Keep route handlers thin, validate external input with `zod`, and prefer structured server logs; Phase 92 should stay inside `src/lib/resume/**` and avoid route-surface expansion. [VERIFIED: CLAUDE.md][VERIFIED: codebase grep]
- Treat `cvState` as canonical resume truth and `agentState` as operational context only; Phase 92 should remain preview-only highlight logic and must not move resume ownership semantics. [VERIFIED: CLAUDE.md]
- Prefer small, test-backed changes over broad rewrites because this repo already has large orchestration modules and sensitive comparison flows. [VERIFIED: CLAUDE.md]

## Summary

The current seam is already clean enough to support Phase 92 without architectural churn: `evaluateExperienceBulletImprovement(...)` is the Layer 1 gate, `buildBulletHighlight(...)` is the per-bullet Layer 2 assembler, and `selectVisibleExperienceHighlightsForEntry(...)` is the Layer 3 same-entry selector. `buildOptimizedPreviewHighlights(...)` wires those layers together, and `ResumeComparisonView` consumes the final result through `useMemo(...)`. [VERIFIED: codebase grep]

The safest implementation is to keep Layer 1 threshold-only and compute `evidenceScore` from the optimized bullet's best structural candidate, not from the original-vs-optimized diff. The existing candidate scale already cleanly separates strong metric evidence (`100+` base scale, `115` in a preserved-metric local probe), strong scope/scale (`80+` base scale, `102` in a local probe), and contextual stack (`60+` base scale, `66` in a local probe). That makes `evidenceScore >= 90 || improvementScore >= 5` a sensible contract: preserved Tier 1 bullets recover eligibility, while contextual-stack bullets do not become evidence-eligible just because they mention tools. [VERIFIED: codebase grep][VERIFIED: local shell probe]

There is already uncommitted local work in `optimized-preview-highlights.ts` moving in exactly this direction: it exports `evaluateExperienceBulletImprovement(...)`, introduces `EXPERIENCE_BULLET_EVIDENCE_THRESHOLD = 90`, reuses `getBestExperienceHighlightCandidate(...)`, and keeps Layer 3 sorting unchanged. That prototype passes the focused Vitest highlight suites but currently fails `npm run typecheck` because the test helper shape in `optimized-preview-highlights.test.ts` does not yet include the new required `evidenceScore` field. [VERIFIED: git diff][VERIFIED: local test run]

**Primary recommendation:** Reuse the existing best-candidate score as an explicit Layer 1 `evidenceScore`, gate eligibility with `evidenceScore >= 90 || improvementScore >= 5`, preserve the `!diffSignals.technologyOnly` guard on the improvement path, and do not let Layer 1 participate in same-entry ordering. [VERIFIED: git diff][VERIFIED: codebase grep][VERIFIED: local shell probe]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Repo-native highlight pipeline (`src/lib/resume/optimized-preview-highlights.ts`) | workspace local [VERIFIED: codebase grep] | Owns candidate extraction, Layer 1 scoring, Layer 2 bullet assembly, and Layer 3 same-entry surfacing today. [VERIFIED: codebase grep] | This is the narrowest brownfield seam and already contains the exact policy surfaces Phase 92 must extend. [VERIFIED: codebase grep][VERIFIED: CLAUDE.md] |
| TypeScript | installed `5.9.3`; manifest range `^5.4.5`; npm current `6.0.3` published `2026-04-16T23:38:27.905Z`. [VERIFIED: local shell probe][VERIFIED: codebase grep][VERIFIED: npm registry] | Makes `evidenceScore` and `improvementScore` explicit in exported contracts and test helpers. [VERIFIED: codebase grep] | `npm run typecheck` is already catching stale helper shapes that Vitest alone does not catch. [VERIFIED: local test run] |
| Vitest | installed `1.6.1`; manifest range `^1.6.0`; npm current `4.1.5` published `2026-04-21T11:04:03.117Z`. [VERIFIED: local shell probe][VERIFIED: codebase grep][VERIFIED: npm registry] | Provides fast unit and integration coverage for this highlight seam. [VERIFIED: codebase grep] | Existing files already cover same-entry surfacing and highlight contracts, so Phase 92 should extend them instead of adding a new harness. [VERIFIED: codebase grep] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js | installed `14.2.3`; npm current `16.2.4` published `2026-04-15T22:33:47.905Z`. [VERIFIED: local shell probe][VERIFIED: npm registry] | Hosts the compare page whose client render path invokes `buildOptimizedPreviewHighlights(...)`. [VERIFIED: codebase grep] | Relevant only because this preview seam executes in a mixed App Router render path; no framework upgrade is needed for Phase 92. [VERIFIED: codebase grep][CITED: https://nextjs.org/docs/app/getting-started/server-and-client-components] |
| React | installed `18.3.1`; npm current `19.2.5` published `2026-04-08T18:39:24.455Z`. [VERIFIED: local shell probe][VERIFIED: npm registry] | `ResumeComparisonView` uses `useMemo(...)` to derive preview highlights from the utility module. [VERIFIED: codebase grep] | Relevant only to preserve current render behavior while changing scoring semantics inside the utility module. [VERIFIED: codebase grep] |
| Zod | installed `3.25.76`; manifest range `^3.23.8`; npm current `4.3.6` published `2026-01-22T19:14:35.382Z`. [VERIFIED: local shell probe][VERIFIED: codebase grep][VERIFIED: npm registry] | Project-wide validation standard. [VERIFIED: CLAUDE.md] | Not needed for Phase 92 implementation itself because this phase stays inside pure string-scoring utilities rather than route inputs. [VERIFIED: CLAUDE.md][VERIFIED: codebase grep] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing the best candidate's existing numeric score as `evidenceScore`. [VERIFIED: codebase grep] | A new normalized `0-10` evidence mapper. [ASSUMED] | Adds another translation layer and risks drift between the score that opens eligibility and the candidate that actually renders, without solving a documented Phase 92 requirement. [VERIFIED: 92-CONTEXT.md][VERIFIED: codebase grep] |
| Returning separate `evidenceScore` and `improvementScore` from Layer 1. [VERIFIED: codebase grep] | A combined Layer 1 `rankingScore`. [VERIFIED: 92-CONTEXT.md] | Violates the locked decision that Layer 1 returns signals only and would pull Layer 2/Layer 3 ownership downward. [VERIFIED: 92-CONTEXT.md] |

**Installation:**
```bash
# No new packages are required for Phase 92.
```

**Version verification:** Registry verification on 2026-04-21 found newer package releases than the repo is currently using: Next `16.2.4`, React `19.2.5`, TypeScript `6.0.3`, Vitest `4.1.5`, and Zod `4.3.6`. Phase 92 should stay on the existing project stack and must not be bundled with a framework upgrade. [VERIFIED: npm registry][VERIFIED: local shell probe][VERIFIED: CLAUDE.md]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── lib/resume/optimized-preview-highlights.ts      # Layer 1 scoring, Layer 2 assembly, Layer 3 surfacing [VERIFIED: codebase grep]
├── lib/resume/optimized-preview-highlights.test.ts # Seam-focused behavior tests [VERIFIED: codebase grep]
├── lib/resume/optimized-preview-contracts.test.ts  # Public preview invariants [VERIFIED: codebase grep]
└── components/resume/resume-comparison-view.tsx    # Compare-view consumer via useMemo [VERIFIED: codebase grep]
```

### Pattern 1: Layer 1 Signal-Only Scoring
**What:** `evaluateExperienceBulletImprovement(...)` should return `{ eligible, evidenceScore, improvementScore }` and stop there; it should not compare bullets against sibling bullets or decide visible winners. [VERIFIED: codebase grep]
**When to use:** Any bullet-level decision about whether a single optimized bullet is allowed to enter the downstream highlight pipeline. [VERIFIED: codebase grep]
**Example:**
```typescript
// Source: src/lib/resume/optimized-preview-highlights.ts
const bestCandidate = getBestExperienceHighlightCandidate(optimized)
const evidenceScore = bestCandidate?.score ?? 0

let improvementScore = 0
if (!formattingOnlyChange) {
  const originalSimilarity = original.trim() ? calculateTextSimilarity(original, optimized) : 0
  const diffSignals = scorePhraseUnit(optimized, buildTokenCounts(original))
  improvementScore = diffSignals.score
  if (!original.trim()) improvementScore += 2
  if (originalSimilarity < 0.75) improvementScore += 2
  else if (originalSimilarity < 0.9) improvementScore += 1
}

const eligible =
  evidenceScore >= EXPERIENCE_BULLET_EVIDENCE_THRESHOLD ||
  (improvementScore >= EXPERIENCE_BULLET_IMPROVEMENT_THRESHOLD && !diffSignals.technologyOnly)
```

### Pattern 2: Layer 2 Bullet Assembly
**What:** `buildBulletHighlight(...)` should remain the layer that marries the closest original bullet, Layer 1 signals, the optimized bullet's best candidate, and the rendered `HighlightedLine`. [VERIFIED: codebase grep]
**When to use:** Any time the planner needs to add plumbing for new bullet-level metadata without reopening same-entry ranking or renderer contracts. [VERIFIED: codebase grep]
**Example:**
```typescript
// Source: src/lib/resume/optimized-preview-highlights.ts
const improvement = evaluateExperienceBulletImprovement(closestOriginalBullet, optimizedBullet)
const bestCandidate = getBestExperienceHighlightCandidate(optimizedBullet)
const canRenderHighlight = improvement.eligible && bestCandidate !== null

return {
  line: canRenderHighlight
    ? buildExperienceHighlightLine(optimizedBullet, bestCandidate)
    : createNonHighlightedLine(optimizedBullet),
  eligible: improvement.eligible,
  evidenceScore: improvement.evidenceScore,
  improvementScore: improvement.improvementScore,
  winnerScore: bestCandidate?.score ?? 0,
}
```

### Pattern 3: Layer 3 Same-Entry Editorial Surfacing
**What:** `selectVisibleExperienceHighlightsForEntry(...)` must remain the only place that ranks finalized bullet results for the limited visible slots inside one experience entry. [VERIFIED: codebase grep]
**When to use:** Any same-entry winner decision under the per-entry cap. [VERIFIED: codebase grep]
**Example:**
```typescript
// Source: src/lib/resume/optimized-preview-highlights.ts
bulletResults
  .filter((result) => result.eligible && hasRenderedExperienceHighlight(result))
  .sort((left, right) =>
    getExperienceHighlightTierPriority(left) - getExperienceHighlightTierPriority(right) ||
    getExperienceHighlightCategoryPriority(left) - getExperienceHighlightCategoryPriority(right) ||
    right.winnerScore - left.winnerScore ||
    right.improvementScore - left.improvementScore ||
    left.bulletIndex - right.bulletIndex,
  )
  .slice(0, maxVisibleHighlights)
```

### Anti-Patterns to Avoid
- **Ranking in Layer 1:** Do not let `evidenceScore` replace Layer 3 editorial ordering or Layer 2 candidate comparison. [VERIFIED: 92-CONTEXT.md][VERIFIED: codebase grep]
- **Duplicate candidate scoring:** Do not create a second optimized-bullet regex scorer just for evidence; reuse `getBestExperienceHighlightCandidate(...)` so evidence, rendering, and winner metadata stay aligned. [VERIFIED: git diff][VERIFIED: codebase grep]
- **Reviving the old diff-aware collector:** `collectExperienceHighlightCandidates(original, optimized)` is currently unused and diff-oriented; bringing it back for Phase 92 would reintroduce the bug the phase is trying to fix. [VERIFIED: codebase grep]
- **Eligibility without renderability:** Do not assume `eligible: true` means the bullet will render; Layer 2 still requires `bestCandidate !== null`, and Layer 3 still requires `hasRenderedExperienceHighlight(...)`. [VERIFIED: codebase grep][VERIFIED: local shell probe]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimized-bullet evidence strength | A new standalone evidence parser or regex set. [VERIFIED: codebase grep] | `collectRankedExperienceHighlightCandidates(...)` plus `getBestExperienceHighlightCandidate(...)`. [VERIFIED: git diff][VERIFIED: codebase grep] | The candidate score already encodes category, metric/scope bonuses, context bonuses, and overlap dedupe. Duplicating it would drift from the rendered winner. [VERIFIED: codebase grep] |
| Original-to-optimized bullet pairing | A second matching heuristic or index-based pairing shortcut. [VERIFIED: codebase grep] | `findClosestOriginalBullet(...)`. [VERIFIED: codebase grep] | The current similarity-based closest match is already the Layer 2 seam that feeds Layer 1 diff scoring. [VERIFIED: codebase grep] |
| Same-entry visible-slot policy | A new Layer 1 rank or direct `evidenceScore` sort. [VERIFIED: 92-CONTEXT.md] | `selectVisibleExperienceHighlightsForEntry(...)`. [VERIFIED: codebase grep] | Phase 87 and 88 explicitly moved same-entry editorial priority into Layer 3, where tier/category policy now lives. [VERIFIED: codebase grep] |

**Key insight:** The best Phase 92 implementation is not a new subsystem; it is one additional numeric signal threaded through an already layered pipeline. [VERIFIED: codebase grep][VERIFIED: 92-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Evidence Score Quietly Becomes a Ranking Score
**What goes wrong:** Engineers start sorting by `evidenceScore` directly and Layer 1 begins deciding same-entry winners. [VERIFIED: 92-CONTEXT.md]
**Why it happens:** `evidenceScore` is numeric and tempting to reuse everywhere. [ASSUMED]
**How to avoid:** Keep `evidenceScore` for eligibility and observability only; leave Layer 3 sort order as tier, category, `winnerScore`, `improvementScore`, then `bulletIndex`. [VERIFIED: codebase grep]
**Warning signs:** A patch changes `selectVisibleExperienceHighlightsForEntry(...)` to prefer `evidenceScore` ahead of tier/category. [VERIFIED: codebase grep]

### Pitfall 2: Technology-Only Bullets Reopen the Original False-Positive Problem
**What goes wrong:** Pure tool-list rewrites become eligible again through the improvement path. [VERIFIED: 92-CONTEXT.md]
**Why it happens:** `improvementScore` can rise on added keywords unless the `technologyOnly` guard remains in place. [VERIFIED: git diff][VERIFIED: codebase grep]
**How to avoid:** Preserve the `!diffSignals.technologyOnly` condition on the improvement branch and keep the evidence threshold above contextual-stack scores. [VERIFIED: git diff][VERIFIED: local shell probe]
**Warning signs:** A local probe like `"SQL, Python e Power BI."` returns `eligible: true`. The current prototype correctly returns `eligible: false`, `improvementScore: 6`, `evidenceScore: 0`. [VERIFIED: local shell probe]

### Pitfall 3: Type Safety Regressions Hide Behind Green Vitest Runs
**What goes wrong:** The phase appears green because behavior tests pass, but exported type contracts are already broken. [VERIFIED: local test run]
**Why it happens:** Vitest transpiles tests without enforcing the same contract checks as `tsc --noEmit`. [VERIFIED: local test run]
**How to avoid:** Keep `npm run typecheck` as a phase gate and update all test helpers when `ExperienceBulletHighlightResult` or `ExperienceBulletImprovement` changes. [VERIFIED: local test run][VERIFIED: codebase grep]
**Warning signs:** `optimized-preview-highlights.test.ts` still constructs `ExperienceBulletHighlightResult` objects without `evidenceScore`. [VERIFIED: codebase grep][VERIFIED: local test run]

### Pitfall 4: Separate Candidate Lookups Drift Out of Sync
**What goes wrong:** Layer 1 evidence and Layer 2 rendering derive from different candidate lookups and disagree about category or score. [VERIFIED: codebase grep]
**Why it happens:** The module previously repeated `collectRankedExperienceHighlightCandidates(...)[0]` in multiple places. [VERIFIED: git diff]
**How to avoid:** Use one helper, `getBestExperienceHighlightCandidate(...)`, anywhere the best optimized-bullet candidate is needed. [VERIFIED: git diff]
**Warning signs:** More than one code path reconstructs the same `[0] ?? null` best-candidate expression. [VERIFIED: git diff]

## Code Examples

Verified patterns from the current seam and the recommended Phase 92 test additions:

### Direct Layer 1 Preserved-Metric Test
```typescript
// Source: recommended extension of src/lib/resume/optimized-preview-highlights.test.ts
const result = evaluateExperienceBulletImprovement(
  "Reduzi o tempo de processamento em 40%.",
  "Reduzi o tempo de processamento em 40%.",
)

expect(result.improvementScore).toBe(0)
expect(result.evidenceScore).toBeGreaterThanOrEqual(90)
expect(result.eligible).toBe(true)
```

### Same-Entry Tier-1-Over-Tier-2 Integration Test
```typescript
// Source: existing buildOptimizedPreviewHighlights(...) test pattern in src/lib/resume/optimized-preview-highlights.test.ts
const result = buildOptimizedPreviewHighlights(original, optimized)
const bullets = result.experience[0]?.bullets ?? []

expect(bullets[0]?.highlightCategory).toBe("metric")
expect(bullets[1]?.highlightCategory).toBe("scope_scale")
expect(bullets[2]?.segments.some((segment) => segment.highlighted)).toBe(false)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Diff-dominant Layer 1 gating based mainly on rewrite delta, with metric/scope shortcuts mixed into the diff analysis. [VERIFIED: codebase grep] | Recommended and partially prototyped dual-signal gating using optimized-only `evidenceScore` plus diff-based `improvementScore`. [VERIFIED: git diff] | Local Phase 92 prototype present on 2026-04-21. [VERIFIED: git diff] | Preserved Tier 1 evidence can stay eligible without moving same-entry ordering out of Layer 3. [VERIFIED: git diff][VERIFIED: 92-CONTEXT.md] |
| Repeated inline `collectRankedExperienceHighlightCandidates(...)[0]` lookups. [VERIFIED: codebase grep] | Shared `getBestExperienceHighlightCandidate(...)` helper for evidence, rendering, and winner metadata. [VERIFIED: git diff] | Local Phase 92 prototype present on 2026-04-21. [VERIFIED: git diff] | Reduces score/render drift and keeps the optimized-bullet seam single-sourced. [VERIFIED: git diff] |

**Deprecated/outdated:**
- `collectExperienceHighlightCandidates(original, optimized)` is currently unused and should stay out of Phase 92 planning because it is diff-aware and would blur the optimized-only evidence seam. [VERIFIED: codebase grep]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Engineers may be tempted to sort by `evidenceScore` because it is numeric. [ASSUMED] | Common Pitfalls | Medium; plan review may under-weight the need for Layer 3 ownership protections. |

## Open Questions

1. **Should a completely unchanged strong metric bullet remain visibly highlighted, or only remain eligible for downstream selection?**
   - What we know: The current local prototype makes an identical preserved metric bullet eligible with `improvementScore: 0` and `evidenceScore: 115`. [VERIFIED: local shell probe]
   - What's unclear: The context locks eligibility, but it does not explicitly say whether unchanged bullets should still produce a visible highlight in the compare UX. [VERIFIED: 92-CONTEXT.md]
   - Recommendation: Lock one explicit UAT example for an unchanged strong metric bullet before implementation is considered complete. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest and TypeScript execution for the phase gate. [VERIFIED: local shell probe] | ✓ [VERIFIED: local shell probe] | `24.14.0`. [VERIFIED: local shell probe] | — |
| npm | Package scripts and registry verification. [VERIFIED: local shell probe] | ✓ [VERIFIED: local shell probe] | `11.9.0`. [VERIFIED: local shell probe] | — |
| Local Vitest CLI | Focused highlight regression suite. [VERIFIED: local shell probe] | ✓ [VERIFIED: local shell probe] | `1.6.1`. [VERIFIED: local shell probe] | `npm test` uses the same runner. [VERIFIED: codebase grep] |
| Local TypeScript CLI | `npm run typecheck` phase gate. [VERIFIED: local shell probe] | ✓ [VERIFIED: local shell probe] | `5.9.3`. [VERIFIED: local shell probe] | `npm run typecheck` already resolves the local binary. [VERIFIED: codebase grep] |

**Missing dependencies with no fallback:**
- None. [VERIFIED: local shell probe]

**Missing dependencies with fallback:**
- None. [VERIFIED: local shell probe]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `1.6.1` installed locally with config in `vitest.config.ts`. [VERIFIED: local shell probe][VERIFIED: codebase grep] |
| Config file | `vitest.config.ts`. [VERIFIED: codebase grep] |
| Quick run command | `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts src/lib/resume/optimized-preview-contracts.test.ts`. [VERIFIED: codebase grep] |
| Full suite command | `npm test` plus `npm run typecheck`. [VERIFIED: codebase grep][VERIFIED: local test run] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXP-HILITE-EVIDENCE-01 | Preserved strong metric and scope bullets retain eligibility via optimized-only evidence strength even when diff is minimal. [VERIFIED: 92-CONTEXT.md] | unit | `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts`. [VERIFIED: codebase grep] | ✅ extend existing file. [VERIFIED: codebase grep] |
| EXP-HILITE-EVIDENCE-ELIGIBILITY-01 | Dual-path eligibility works and technology-only bullets do not gain eligibility through the evidence path or the improvement path. [VERIFIED: 92-CONTEXT.md] | unit | `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts`. [VERIFIED: codebase grep] | ✅ extend existing file. [VERIFIED: codebase grep] |
| EXP-HILITE-EVIDENCE-TEST-01 | Same-entry surfacing still favors Tier 1 metric/scope bullets over Tier 2 under cap pressure, and type contracts stay green. [VERIFIED: 92-CONTEXT.md] | integration + typecheck | `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts src/lib/resume/optimized-preview-contracts.test.ts` and `npm run typecheck`. [VERIFIED: codebase grep][VERIFIED: local test run] | ✅ existing files; helper update required. [VERIFIED: codebase grep][VERIFIED: local test run] |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/resume/optimized-preview-highlights.test.ts src/lib/resume/optimized-preview-contracts.test.ts`. [VERIFIED: codebase grep]
- **Per wave merge:** `npm test` and `npm run typecheck`. [VERIFIED: codebase grep][VERIFIED: local test run]
- **Phase gate:** Focused highlight suites green plus `npm run typecheck` green before `/gsd-verify-work`. [VERIFIED: local test run]

### Wave 0 Gaps
- [ ] `src/lib/resume/optimized-preview-highlights.test.ts` needs direct tests for exported `evaluateExperienceBulletImprovement(...)` covering preserved metric, preserved scope/scale, contextual stack, technology-only diff, and weak narrative diff cases. [VERIFIED: codebase grep][VERIFIED: local shell probe]
- [ ] `buildExperienceBulletHighlightResult(...)` in `src/lib/resume/optimized-preview-highlights.test.ts` must add the required `evidenceScore` field so `npm run typecheck` stops failing. [VERIFIED: codebase grep][VERIFIED: local test run]
- [ ] No framework-install gap exists; the current Vitest config and files are already present. [VERIFIED: codebase grep]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no. [VERIFIED: codebase grep] | No auth seam changes are in scope; this phase stays inside a pure preview utility. [VERIFIED: codebase grep] |
| V3 Session Management | no. [VERIFIED: codebase grep] | No session state ownership or lifecycle logic changes are planned. [VERIFIED: CLAUDE.md][VERIFIED: codebase grep] |
| V4 Access Control | no. [VERIFIED: codebase grep] | No route, user, or permission gates are touched by this phase. [VERIFIED: codebase grep] |
| V5 Input Validation | yes. [VERIFIED: codebase grep] | Keep using normalized text, predeclared regex patterns, and explicit word/length caps when deriving candidates from optimized bullets. [VERIFIED: codebase grep] |
| V6 Cryptography | no. [VERIFIED: codebase grep] | No crypto primitives or secret handling changes are in scope. [VERIFIED: codebase grep] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted resume text or LLM output pushes tool-list keywords high enough to win eligibility. [VERIFIED: 92-CONTEXT.md] | Tampering | Preserve the optimized-only candidate threshold and the `!diffSignals.technologyOnly` improvement-path guard. [VERIFIED: git diff][VERIFIED: local shell probe] |
| Overly broad regex expansion returns large or noisy spans that degrade preview integrity. [VERIFIED: codebase grep] | Tampering | Keep the existing word-count and character-count caps in candidate construction and span completion. [VERIFIED: codebase grep] |
| Debug observability leaks raw bullet text. [VERIFIED: codebase grep] | Information Disclosure | Keep debug traces compact and metadata-only; the current trace logs scores, categories, and indexes, not bullet text. [VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)
- `src/lib/resume/optimized-preview-highlights.ts` - current Layer 1, Layer 2, and Layer 3 seams plus the local Phase 92 prototype diff. [VERIFIED: codebase grep][VERIFIED: git diff]
- `src/lib/resume/optimized-preview-highlights.test.ts` - current seam tests, missing direct Layer 1 cases, and the stale helper shape causing the typecheck failure. [VERIFIED: codebase grep][VERIFIED: local test run]
- `src/lib/resume/optimized-preview-contracts.test.ts` - contract-level invariants for bullet caps and contextual-stack highlight rules. [VERIFIED: codebase grep]
- `src/components/resume/resume-comparison-view.tsx` - live compare-view consumer of `buildOptimizedPreviewHighlights(...)`. [VERIFIED: codebase grep]
- `.planning/phases/CURRIA-92-layer-1-evidence-scoring-make-preserved-strong-metrics-eligi/92-CONTEXT.md` - locked decisions, scope, and acceptance criteria for this phase. [VERIFIED: codebase grep]
- `.planning/REQUIREMENTS.md` - authoritative requirement IDs and descriptions for Phase 92. [VERIFIED: codebase grep]
- `CLAUDE.md` - project-specific engineering constraints and brownfield expectations. [VERIFIED: codebase grep]
- Local shell probes run on 2026-04-21 - evidence-score calibration cases, focused Vitest run, and `npm run typecheck` failure details. [VERIFIED: local shell probe][VERIFIED: local test run]
- npm registry via `npm view` - current package versions and publish dates for Next, React, TypeScript, Vitest, and Zod. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- https://nextjs.org/docs/app/getting-started/server-and-client-components - mixed server/client rendering behavior for App Router Client Components. [CITED: https://nextjs.org/docs/app/getting-started/server-and-client-components]

### Tertiary (LOW confidence)
- None. All material phase claims were verified in the repo, local shell probes, or official docs. [VERIFIED: codebase grep]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries are needed and versions were verified locally plus against npm. [VERIFIED: local shell probe][VERIFIED: npm registry]
- Architecture: HIGH - the relevant seams are explicit in one module and already documented by prior surfacing phases. [VERIFIED: codebase grep]
- Pitfalls: HIGH - the main risks were confirmed by the current local prototype, focused tests, and the current typecheck failure. [VERIFIED: git diff][VERIFIED: local test run]

**Research date:** 2026-04-21
**Valid until:** 2026-04-28 because this seam already has uncommitted local changes in flight. [VERIFIED: git diff]
