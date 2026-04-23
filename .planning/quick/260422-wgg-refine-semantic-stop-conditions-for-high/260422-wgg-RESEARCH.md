# Quick Task 260422-wgg - Research

**Researched:** 2026-04-22 [VERIFIED: user request]  
**Domain:** Highlight span boundary stop-condition refinement in persisted resume highlight artifacts. [VERIFIED: local code]  
**Confidence:** HIGH. [VERIFIED: local code]

## User Constraints

- Analyze the current boundary refinement logic only. [VERIFIED: user request]
- Identify why spans still stop too early after reaching the right semantic area, especially around comma continuations, short gerund/prepositional completions, and final object phrases. [VERIFIED: user request]
- Recommend the smallest low-risk changes to stop-condition logic and tests. [VERIFIED: user request]
- Preserve compactness and pipe-list containment. [VERIFIED: user request]
- Write the research output to `C:/CurrIA/.planning/quick/260422-wgg-refine-semantic-stop-conditions-for-high/260422-wgg-RESEARCH.md`. [VERIFIED: user request]

## Project Constraints (from CLAUDE.md)

- Preserve the existing brownfield product surface unless scope is explicitly changed. [VERIFIED: CLAUDE.md]
- Prefer reliability, observability, and verification over broader redesigns. [VERIFIED: CLAUDE.md]
- Follow surrounding file style, keep changes small, and prefer test-backed modifications over broad rewrites. [VERIFIED: CLAUDE.md]
- Keep route-handler and pipeline behavior unchanged unless required; this task should stay inside the artifact layer if possible. [VERIFIED: CLAUDE.md]
- Treat `cvState` as canonical truth and avoid reopening unrelated agent-flow architecture. [VERIFIED: CLAUDE.md]

## Summary

The current right-edge refinement is concentrated in [`cv-highlight-artifact.ts`](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.ts:484), specifically `readShortContinuationEnd(...)`, `shouldExpandAcrossBoundary(...)`, `expandRangeRightAcrossSeparator(...)`, and the late pipe guard `constrainRangeToPipeSegment(...)`. [VERIFIED: local code] The existing implementation already fixes mid-token cuts, one compact separator continuation, balanced wrapper continuations, and weak pipe-list suppression, and the current focused tests pass. [VERIFIED: local code] [VERIFIED: local command]

The remaining early-stop behavior comes from three narrow limits. [VERIFIED: local code] First, `readShortContinuationEnd(...)` stops at the first secondary comma after the continuation starts, so comma-chained nominal continuations truncate after the first attached chunk. [VERIFIED: local code] Second, `shouldExpandAcrossBoundary(...)` evaluates the entire post-separator tail against one `36`-character and `5`-word cap, so a valid compact head plus a short semantic tail can fail as one oversized unit. [VERIFIED: local code] Third, once a range already ends on a word boundary with no immediate bridgeable separator, there is no follow-up right-tail pass, so short `for/with/by/via/through` attachments and short gerund endings are never recovered. [VERIFIED: local code]

Live probes against `normalizeHighlightSpanBoundaries(...)` confirm the shape of the gap. [VERIFIED: local command] `Power BI dashboards, executive reporting, KPI governance.` normalizes to `Power BI dashboards, executive reporting`. [VERIFIED: local command] `Improved release reliability by automating QA.` normalizes to `release reliability`. [VERIFIED: local command] `Built dashboards for regional leaders across LATAM.` normalizes to `Built dashboards`. [VERIFIED: local command] `Reduced latency by 40%, while mentoring the team.` still correctly stops before the clause break, and `Power BI dashboards | stakeholder reporting` stays local to one pipe cell. [VERIFIED: local command]

**Primary recommendation:** Keep normalization in the artifact layer and preserve existing editorial and pipe guardrails, but split right-edge completion into a compact separator-head pass plus one tightly bounded attached-tail pass. [VERIFIED: local code]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `src/lib/resume/cv-highlight-artifact.ts` | repo current | Canonical range normalization, validation, and segmentation for persisted highlight artifacts. [VERIFIED: local code] | Every persisted detector range already flows through `validateAndResolveHighlights(...)`, so this is the lowest-risk choke point. [VERIFIED: local code] |
| Vitest | 1.6.1 | Focused regression coverage for boundary behavior. [VERIFIED: local command] | Existing boundary and detector-contract tests already live in the repo and passed in this session. [VERIFIED: local code] [VERIFIED: local command] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/resume/cv-highlight-artifact.test.ts` | repo current | Direct unit coverage for span normalization and segmentation semantics. [VERIFIED: local code] | Add the new stop-condition regressions here first. [VERIFIED: local code] |
| `src/lib/agent/tools/detect-cv-highlights.test.ts` | repo current | Verifies fail-closed detector integration after normalization. [VERIFIED: local code] | Update only if normalization changes validated output boundaries. [VERIFIED: local code] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Artifact-layer stop-condition refinement | Detector prompt or payload changes | Higher risk because the validator is already the single normalization choke point and the user requested analysis of current boundary logic only. [VERIFIED: local code] [VERIFIED: user request] |
| A second local tail pass | Raising global char or word caps | Simpler mechanically, but more likely to swallow longer clauses and weaken compactness across the board. [VERIFIED: local code] |

**Installation:** No new packages are needed; use the existing repo module and Vitest stack. [VERIFIED: local code]

## Architecture Patterns

### Recommended Project Structure

```text
src/lib/resume/
|-- cv-highlight-artifact.ts       # Boundary normalization and editorial acceptance
`-- cv-highlight-artifact.test.ts  # Direct stop-condition regressions

src/lib/agent/tools/
`-- detect-cv-highlights.test.ts   # Detector contract regression only if outputs shift
```

[VERIFIED: local code]

### Pattern 1: Keep Repair Before Editorial Acceptance

**What:** `normalizeHighlightSpanBoundaries(...)` is already called inside `normalizeHighlightRangesForSegmentation(...)`, which feeds both segmentation and `validateAndResolveHighlights(...)` before editorial acceptance. [VERIFIED: local code]  
**When to use:** Keep all stop-condition changes in this function chain so `isSafeNonOverlappingRange(...)` and `isEditoriallyAcceptableHighlightRange(...)` remain the final guards. [VERIFIED: local code]  
**Example:**

```ts
// Source: /C:/CurrIA/src/lib/resume/cv-highlight-artifact.ts
normalizedRange = normalizeRangeToWordBoundaries(text, normalizedRange)
normalizedRange = expandRangeRightAcrossSeparator(text, normalizedRange)

if (text.includes(HIGHLIGHT_STACK_SEPARATOR_CHAR)) {
  normalizedRange = constrainRangeToPipeSegment(text, normalizedRange) ?? null
}
```

[VERIFIED: local code]

### Pattern 2: Split Right-Edge Completion Into Head Then Tail

**What:** The smallest low-risk change is to preserve the current separator bridge, but stop judging the full post-separator tail as one unit; instead, accept a compact head first and then allow one optional attached tail under tighter rules. [VERIFIED: local code]  
**When to use:** Apply this only on the right edge, after current word-boundary repair and before pipe containment. [VERIFIED: local code]  
**Example sketch:**

```ts
// Recommended shape, not current code.
range = expandRangeRightAcrossSeparatorHead(text, range)
range = expandRangeRightAcrossAttachedTail(text, range)
range = constrainRangeToPipeSegment(text, range) ?? null
```

[ASSUMED]

### Anti-Patterns to Avoid

- **Do not broaden coverage guardrails:** `isEditoriallyAcceptableHighlightRange(...)` is already the compactness backstop and should remain unchanged for this task. [VERIFIED: local code]
- **Do not bridge across `|`:** pipe safety depends on late local containment and weak-segment rejection, and that protection should remain fail-closed. [VERIFIED: local code]
- **Do not move repair upstream into detector generation:** the artifact layer is already the canonical repair point and the task scope is explicitly the current boundary logic. [VERIFIED: local code] [VERIFIED: user request]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic boundary repair | A new NLP parser, POS tagger, or detector-side semantic rewrite | Small local stop-condition helpers inside `cv-highlight-artifact.ts` | The current module already owns clamping, boundary repair, editorial acceptance, and pipe containment. [VERIFIED: local code] |
| Truncated right-edge tails | Resume-wide re-highlighting or a second pipeline | One attached-tail helper after existing right-edge normalization | The task is localized to right-edge stop conditions and should not reopen pipeline architecture. [VERIFIED: user request] [VERIFIED: local code] |

**Key insight:** The missing behavior is not a new scoring or detection problem; it is a local right-edge stopping problem inside the existing artifact normalizer. [VERIFIED: local code] [VERIFIED: local command]

## Common Pitfalls

### Pitfall 1: Whole-Tail Gating After a Separator

**What goes wrong:** A phrase such as `dashboards, executive reporting for regional leaders` can fail to expand even though the head after the comma is semantically correct. [VERIFIED: local command]  
**Why it happens:** `shouldExpandAcrossBoundary(...)` judges the entire post-separator tail against a single `36`-character and `5`-word budget. [VERIFIED: local code]  
**How to avoid:** Evaluate a compact continuation head first, then separately allow one short attached tail if it stays non-clausal. [ASSUMED]  
**Warning signs:** Probes where a comma continuation returns the original fragment or only the first chunk while the full continuation is still short to read. [VERIFIED: local command]

### Pitfall 2: No Tail Completion After a Plain Word Boundary

**What goes wrong:** `by automating QA`, `for regional leaders`, `through automated regression checks`, and similar short endings are dropped once the range already ends on a normal word boundary. [VERIFIED: local command]  
**Why it happens:** There is no helper that extends across a plain-space tail when no bridgeable separator appears immediately after `range.end`. [VERIFIED: local code]  
**How to avoid:** Add one local tail pass keyed to safe attachment starters such as `for`, `with`, `by`, `via`, `through`, `across`, and short gerund starts. [ASSUMED]  
**Warning signs:** Live probes that end at `Built dashboards`, `release reliability`, or another bare head noun even when the remainder is a short attachment. [VERIFIED: local command]

### Pitfall 3: Regressing Pipe Containment While Fixing Tails

**What goes wrong:** Over-broad right expansion can accidentally swallow weak pipe cells or flatten list-like stack bullets into noisy highlights. [VERIFIED: local code]  
**Why it happens:** Pipe safety is enforced late by `constrainRangeToPipeSegment(...)` and `isWeakPipeSegment(...)`, so any new tail rule that treats `|` as attachable would bypass the intended fail-close shape. [VERIFIED: local code]  
**How to avoid:** Keep `|` excluded from any new attachment logic and run any new tail expansion before the existing pipe constraint. [ASSUMED]  
**Warning signs:** A previously local pipe-cell test starts returning a whole-list span or preserving trivial cells such as `SQL`. [VERIFIED: local code]

## Code Examples

Verified current behavior from this session:

### Comma Chain Still Stops After the First Attached Chunk

```text
Input text: Built Power BI dashboards, executive reporting, KPI governance.
Fragment:   Power BI dashboards
Current result: Power BI dashboards, executive reporting
```

[VERIFIED: local command]

### Plain Attached Tail Is Not Recovered Without a Separator

```text
Input text: Improved release reliability by automating QA.
Fragment:   release reliability
Current result: release reliability
```

[VERIFIED: local command]

### Pipe Containment Still Works and Must Be Preserved

```text
Input text: Power BI dashboards | stakeholder reporting
Fragment:   Power BI dashboards |
Current result: Power BI dashboards
```

[VERIFIED: local command]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Word-boundary-only repair with no punctuation-aware continuation handling | Punctuation-aware local refinement plus explicit pipe containment in the artifact layer | 2026-04-22 quick task `260422-suf` | Fixed mid-token and basic separator truncation without changing the detector pipeline. [VERIFIED: 260422-suf-RESEARCH.md] [VERIFIED: 260422-suf-SUMMARY.md] |

**Deprecated/outdated:** Detector-side boundary repair is no longer the main enforcement point; persisted highlight boundaries are normalized locally in the artifact layer before acceptance. [VERIFIED: local code] [VERIFIED: 260422-suf-RESEARCH.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A compact separator-head pass followed by one optional attached-tail pass is the smallest low-risk implementation shape. [ASSUMED] | Summary; Architecture Patterns | The planner might choose a slightly different helper split, but the identified failure mode remains local. [ASSUMED] |
| A2 | Safe attachment starters should include short prepositions (`for`, `with`, `by`, `via`, `through`, `across`) and short gerund starts. [ASSUMED] | Common Pitfalls | Overly narrow starters would miss desired completions; overly broad starters could over-expand. [ASSUMED] |
| A3 | Allowing at most one optional attached tail is sufficient for this quick task. [ASSUMED] | Open Questions | If real data needs deeper comma chains, an extra follow-up task would be needed. [ASSUMED] |

## Open Questions

1. **How much comma chaining should this quick task permit?** [VERIFIED: local code]  
   What we know: the current scan stops at the first secondary comma, and user feedback calls out comma continuations as still truncating. [VERIFIED: local code] [VERIFIED: user request]  
   What's unclear: whether the desired scope is exactly one extra attached comma chunk or arbitrary compact comma chains. [VERIFIED: local code]  
   Recommendation: allow at most one additional comma chunk when both chunks stay short and non-clausal; anything broader should be a separate task. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Probe commands and local tests | yes [VERIFIED: local command] | `v24.14.0` [VERIFIED: local command] | none [VERIFIED: local command] |
| npm | Running repo scripts | yes [VERIFIED: local command] | `11.9.0` [VERIFIED: local command] | none [VERIFIED: local command] |
| Vitest CLI | Focused regression suite | yes [VERIFIED: local command] | `1.6.1` [VERIFIED: local command] | `npm test` for the full suite. [VERIFIED: local code] |

**Missing dependencies with no fallback:** None found for this research scope. [VERIFIED: local command]  
**Missing dependencies with fallback:** None found for this research scope. [VERIFIED: local command]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `1.6.1`. [VERIFIED: local command] |
| Config file | None detected; the repo uses package scripts and file-local tests. [VERIFIED: local code] |
| Quick run command | `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts` [VERIFIED: local command] |
| Full suite command | `npm test` [VERIFIED: local code] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WGG-01 | Compact comma continuations should extend to a complete local phrase without crossing a true clause break. [VERIFIED: user request] | unit | `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts -t "comma"` [VERIFIED: local code] | yes [VERIFIED: local code] |
| WGG-02 | Short gerund and prepositional completions should extend when semantically attached. [VERIFIED: user request] | unit | `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts -t "gerund|prepositional"` [ASSUMED] | yes [VERIFIED: local code] |
| WGG-03 | Final object-phrase completions should stop locally and remain compact. [VERIFIED: user request] | unit | `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts -t "object phrase"` [ASSUMED] | yes [VERIFIED: local code] |
| WGG-04 | Pipe-list containment and fail-close suppression must not regress. [VERIFIED: user request] | unit | `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts -t "pipe"` [VERIFIED: local code] | yes [VERIFIED: local code] |
| WGG-05 | Detector contract should still fail closed after local range refinement. [VERIFIED: local code] | unit | `npx vitest run src/lib/agent/tools/detect-cv-highlights.test.ts` [VERIFIED: local command] | yes [VERIFIED: local code] |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts` [VERIFIED: local command]
- **Per wave merge:** `npm test` [VERIFIED: local code]
- **Phase gate:** Focused Vitest pass plus a detector-contract pass before completion. [VERIFIED: local code]

### Wave 0 Gaps

- Add one regression for comma-chain continuation truncation, for example `Power BI dashboards, executive reporting, KPI governance`. [VERIFIED: local command]
- Add one regression for a no-separator prepositional tail, for example `Built dashboards for regional leaders across LATAM`. [VERIFIED: local command]
- Add one regression for a no-separator gerund tail, for example `Improved release reliability by automating QA`. [VERIFIED: local command]
- Update `detect-cv-highlights.test.ts` only if any normalized boundary expectation changes after the artifact-layer fix. [VERIFIED: local code]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [VERIFIED: local code] | Out of scope for this module. [VERIFIED: local code] |
| V3 Session Management | no [VERIFIED: local code] | Out of scope for this module. [VERIFIED: local code] |
| V4 Access Control | no [VERIFIED: local code] | Out of scope for this module. [VERIFIED: local code] |
| V5 Input Validation | yes [VERIFIED: local code] | `zod` payload parsing, `clampHighlightRange(...)`, boundary trimming, and fail-closed filtering of invalid ranges. [VERIFIED: local code] |
| V6 Cryptography | no [VERIFIED: local code] | Out of scope for this module. [VERIFIED: local code] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted model range indices or malformed range objects | Tampering | `parseRawHighlightDetection(...)`, `clampHighlightRange(...)`, and `validateAndResolveHighlights(...)` fail closed. [VERIFIED: local code] |
| Over-broad highlight spans that misrepresent resume content | Integrity / Tampering | Keep editorial coverage thresholds and clause-stop checks in place while refining only local stop conditions. [VERIFIED: local code] |

## Sources

### Primary (HIGH confidence)

- [`CLAUDE.md`](/C:/CurrIA/CLAUDE.md) - project constraints and engineering invariants used in this research. [VERIFIED: CLAUDE.md]
- [`src/lib/resume/cv-highlight-artifact.ts`](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.ts) - current boundary refinement, validation, and segmentation logic. [VERIFIED: local code]
- [`src/lib/resume/cv-highlight-artifact.test.ts`](/C:/CurrIA/src/lib/resume/cv-highlight-artifact.test.ts) - current direct regression coverage for punctuation, wrappers, and pipe containment. [VERIFIED: local code]
- [`src/lib/agent/tools/detect-cv-highlights.test.ts`](/C:/CurrIA/src/lib/agent/tools/detect-cv-highlights.test.ts) - detector contract expectations that must remain fail-closed. [VERIFIED: local code]
- `npx tsx -e "..."` local probe run on 2026-04-22 against `normalizeHighlightSpanBoundaries(...)`. [VERIFIED: local command]
- `npx vitest run src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/detect-cv-highlights.test.ts` run on 2026-04-22. [VERIFIED: local command]

### Secondary (MEDIUM confidence)

- [`260422-suf-RESEARCH.md`](/C:/CurrIA/.planning/quick/260422-suf-normalize-highlight-span-boundaries-igno/260422-suf-RESEARCH.md) - prior quick-task reasoning for the current artifact-layer insertion point. [VERIFIED: 260422-suf-RESEARCH.md]
- [`260422-suf-SUMMARY.md`](/C:/CurrIA/.planning/quick/260422-suf-normalize-highlight-span-boundaries-igno/260422-suf-SUMMARY.md) - prior quick-task summary of what the current normalization already fixed. [VERIFIED: 260422-suf-SUMMARY.md]

### Tertiary (LOW confidence)

- None. [VERIFIED: local code]

## Metadata

**Confidence breakdown:** [VERIFIED: local code]  
- Standard stack: HIGH - no new libraries are needed and the relevant module/test surface is explicit in the repo. [VERIFIED: local code]  
- Architecture: HIGH - the stop-condition gap is isolated to the existing artifact normalizer and confirmed by live probes. [VERIFIED: local code] [VERIFIED: local command]  
- Pitfalls: HIGH - each recommended pitfall is backed by either direct code inspection, live probe output, or both. [VERIFIED: local code] [VERIFIED: local command]

**Research date:** 2026-04-22. [VERIFIED: user request]  
**Valid until:** Until `src/lib/resume/cv-highlight-artifact.ts` changes materially, or 2026-05-22 as a freshness checkpoint. [ASSUMED]
