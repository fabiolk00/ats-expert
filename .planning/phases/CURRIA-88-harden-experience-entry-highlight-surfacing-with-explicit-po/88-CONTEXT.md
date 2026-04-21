# Phase 88 Context

## Title

Harden experience-entry highlight surfacing with explicit policy constant, edge-case tests, and debug observability

## Goal

Harden the new Layer 3 experience-entry surfacing policy so it is more explicit, more test-protected, easier to debug, and less fragile to future maintenance changes without reopening the stabilized selector architecture.

## Problem

Phase 87 solved the right product problem by making same-entry visible highlight allocation explicit. The remaining gap is durability:

- the editorial category ordering is still too embedded in implementation details
- some edge cases are not protected directly enough at the pure surfacing seam
- future debugging of “why did this bullet lose the slot?” is still too manual

This phase is a hardening pass on Layer 3 only. It must not redefine the policy or reopen Layers 1 and 2.

## In Scope

- externalize editorial category priority into an explicit exported policy constant
- make cap ownership explicit in the surfacing API or document the coupling clearly if the preferred option is blocked
- add direct Layer 3 edge-case tests
- add lightweight debug-only observability for surfacing decisions
- keep the change local to the experience-entry surfacing seam and its immediate tests/docs

## Out of Scope

- bullet-level candidate extraction
- span completion
- selector ranking inside bullets
- evidence tier semantics or CSS
- ATS readiness gates
- rewrite logic
- summary behavior
- PDF/export behavior
- domain-specific parsing or token tuning

## Locked Decisions

- Preserve the three-layer architecture from Phase 87:
  - Layer 1: bullet improvement gate
  - Layer 2: bullet winner span
  - Layer 3: experience-entry surfacing policy
- Do not silently redefine the editorial policy; make it more explicit and durable.
- Extract the editorial category order into an exported named constant equivalent to `EXPERIENCE_HIGHLIGHT_CATEGORY_PRIORITY`.
- Add a comment/docstring that explicitly warns this ordering controls visible editorial behavior under cap pressure and should not be changed casually.
- Prefer explicit cap ownership in the surfacing API:
  - pass the entry cap as an explicit parameter or policy field unless there is a concrete blocking reason not to
  - if blocked, document the blocking reason and warn at the coupled cap source
- Add direct tests for:
  1. an entry with no eligible visible highlights
  2. deterministic tie-break with same category and same score
  3. cap enforcement after editorial selection
- Add lightweight debug-only observability that can answer:
  - which bullets were eligible
  - which category/tier each bullet had
  - which scores were used
  - which bullets were selected vs suppressed
- Keep debug output compact and safe; do not dump unnecessary raw user text if a summarized payload is sufficient.
- Keep the implementation local. Do not build a large policy framework for this phase.

## Deliverables

- a short hardening note explaining where the priority map lives, how cap ownership is handled, what debug observability was added, and whether the preferred cap option was used
- code changes limited to policy explicitness, cap clarity, edge-case tests, and surfacing observability
- green targeted unit/integration verification plus typecheck
- a short statement confirming this was a hardening pass only

## Canonical References

- `src/lib/resume/optimized-preview-highlights.ts` - current Layer 3 surfacing selector and cap usage
- `src/lib/resume/optimized-preview-highlights.test.ts` - current surfacing unit coverage
- `src/lib/resume/optimized-preview-contracts.test.ts` - contract-level preview invariants
- `.planning/phases/CURRIA-87-formalize-experience-entry-highlight-surfacing-policy-as-an-/87-CONTEXT.md` - original Layer 3 scope and architecture boundaries
- `.planning/phases/CURRIA-87-formalize-experience-entry-highlight-surfacing-policy-as-an-/87-VALIDATION.md` - previous architecture note and before/after behavior
- `.planning/phases/CURRIA-87-formalize-experience-entry-highlight-surfacing-policy-as-an-/87-VERIFICATION.md` - verified Phase 87 acceptance outcomes

## Acceptance Criteria

- The editorial category priority is defined as an exported named constant with an explicit warning comment.
- Direct Layer 3 tests prove:
  - no eligible highlight => zero surfaced highlights
  - deterministic same-category/same-score tie-break
  - cap enforcement after editorial ordering
- Cap ownership is explicit in the surfacing API, preferably as an explicit parameter.
- A lightweight debug-only surfacing trace exists for development/debugging and does not affect normal behavior.
- No selector, completion, render-tier, ATS, summary, or export logic is reopened unintentionally.

## Verification

- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts"`
- `npx vitest run "src/lib/resume/optimized-preview-highlights.test.ts" "src/lib/resume/optimized-preview-contracts.test.ts" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run typecheck`
