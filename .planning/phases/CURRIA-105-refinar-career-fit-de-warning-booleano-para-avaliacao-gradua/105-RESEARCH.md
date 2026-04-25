# Phase 105: Refinar career-fit de warning booleano para avaliacao graduada com risco low medium high e gating contextual - Research

**Researched:** 2026-04-25  
**Domain:** Brownfield agent career-fit evaluation, persistence, gating, and regression safety  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Introduce `CareerFitRiskLevel` and `CareerFitEvaluation` in `src/types/agent.ts`, then persist `careerFitEvaluation?: CareerFitEvaluation` under `Session['agentState']`. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Keep `inferRoleFamily(...)`, but replace boolean family mismatch reasoning with explicit `RoleFamilyDistance = 'same' | 'adjacent' | 'distant'`. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Treat `unknown` role families as `same` for safety so uncertain classification does not penalize the user. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Create `evaluateCareerFitRisk(session)` in `src/lib/agent/profile-review.ts` as the central graded decision seam. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Risk points must use the requested thresholds:
  - score `<45` => `+4`
  - score `45..59` => `+2`
  - missing skills `>=6` => `+3`, `4..5` => `+2`, `2..3` => `+1`
  - weak areas `>=5` => `+3`, `3..4` => `+2`, `1..2` => `+1`
  - family distance `distant` => `+4`, `adjacent` => `+1`
  - major seniority gap => `+3` [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Anti-false-negative adjustment is required:
  - if family distance is `adjacent` and match score is at least `50`, subtract `1` point. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Classification must be:
  - `riskPoints >= 8` => `high`, explicit confirmation required
  - `riskPoints 4..7` => `medium`, warning only
  - `riskPoints <= 3` => `low` [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Summary text must map to:
  - low => `alinhamento viável com gaps tratáveis`
  - medium => `alinhamento parcial com lacunas relevantes`
  - high => `desalinhamento estrutural para a vaga` [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Reasons should reuse `targetFitAssessment.reasons`, mismatch rationale, and top gaps with a bounded list. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Keep compatibility wrappers instead of deleting existing APIs immediately:
  - `requiresCareerFitWarning(...)`
  - `buildCareerFitCheckpoint(...)`
  - `buildCareerFitWarningText(...)` [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Persist the evaluation both in `runJobTargetingPipeline(...)` and in the tool dispatcher `analyze_gap` path. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Update agent-loop gating so:
  - medium and high risk show warning
  - only high risk requires explicit override before generation [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Extend `phaseMeta` with:
  - `careerFitRiskLevelAtWarning`
  - `careerFitWarningTargetJobDescription`
  - `careerFitOverrideConfirmedAt` only for high risk [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Prompt context must expose the current risk level and the medium/high behavioral rule. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- Do not remove `targetFitAssessment`, existing checkpoint plumbing, or previous warning fields in this phase. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]

### Claude's Discretion
- None provided in `105-CONTEXT.md`. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- No removal of `targetFitAssessment` in this phase. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- No redesign of the broader chat UI or warning modal surfaces beyond what the backend risk levels require. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- No new external scoring service or ML model. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
- No cleanup of older compatibility fields beyond parallel extension. [VERIFIED: .planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAREER-FIT-RISK-01 | Job-target career fit must be evaluated through a persisted low/medium/high assessment with structured supporting signals, explicit family-distance handling, and backward-compatible fallback seams instead of a single boolean mismatch gate. [VERIFIED: .planning/REQUIREMENTS.md] | Centralize evaluation in `src/lib/agent/profile-review.ts`, persist `agentState.careerFitEvaluation`, and keep wrappers delegating to the graded evaluation. [VERIFIED: 105-CONTEXT.md + src/lib/agent/profile-review.ts + src/types/agent.ts] |
| CAREER-FIT-GATE-01 | Agent generation flow must warn on medium and high career-fit risk, require explicit override only for high risk, and persist target-scoped warning metadata plus prompt guardrail context without removing existing compatibility fields immediately. [VERIFIED: .planning/REQUIREMENTS.md] | Migrate `agent-loop.ts`, `action-classification.ts`, and `src/lib/routes/session-generate/policy.ts` to read one graded decision while keeping `CareerFitCheckpoint` high-only. [VERIFIED: codebase grep + 105-CONTEXT.md] |
| CAREER-FIT-TEST-01 | Focused unit and streaming/context regressions must prove adjacent BI/data scenarios avoid hard blocking, distant high-risk scenarios still require confirmation, and prompt snapshots expose the current risk level consistently. [VERIFIED: .planning/REQUIREMENTS.md] | Extend existing `profile-review`, `streaming-loop`, `context-builder`, `action-classification`, `policy`, and route tests instead of adding a new test harness. [VERIFIED: vitest.config.ts + codebase grep] |
</phase_requirements>

## Summary

Phase 105 should be executed as a brownfield consolidation, not as a greenfield rewrite. The current worktree already contains partial Phase 105-style edits in `src/types/agent.ts` and `src/lib/agent/profile-review.ts`, but the persistence seams, async classification, export policy, prompt snapshot, session serialization, and most tests still target the older boolean-first compatibility surfaces. [VERIFIED: git status --short + src/types/agent.ts + src/lib/agent/profile-review.ts + codebase grep]

The safe path is to finish one central `evaluateCareerFitRisk(session)` seam and then make every existing reader or writer that already owns `targetFitAssessment`, `gapAnalysis`, or career-fit blocking behavior delegate to that seam. The important hidden consumers are `src/lib/agent/action-classification.ts`, `src/lib/routes/session-generate/policy.ts`, `src/lib/agent/request-orchestrator.ts`, and `src/app/api/session/[id]/route.ts`, in addition to the user-listed agent files. [VERIFIED: codebase grep + src/lib/agent/action-classification.ts + src/lib/routes/session-generate/policy.ts + src/lib/agent/request-orchestrator.ts + src/app/api/session/[id]/route.ts]

**Primary recommendation:** Reconcile the current partial WIP with the locked thresholds first, then update every read, write, and clear seam that currently owns target-fit state so medium risk warns without blocking, high risk still requires explicit confirmation, and existing `targetFitAssessment` plus checkpoint consumers remain compatible. [VERIFIED: 105-CONTEXT.md + .planning/REQUIREMENTS.md + codebase grep]

## Project Constraints (from CLAUDE.md)

- `cvState` remains canonical resume truth, and `agentState` remains operational context only. [VERIFIED: CLAUDE.md]
- Tools must not mutate `session` directly; tool-originated writes must flow through `ToolPatch` and centralized persistence. [VERIFIED: CLAUDE.md]
- Partial tool patches must not erase unrelated state. [VERIFIED: CLAUDE.md + src/lib/db/session-normalization.ts]
- Target-specific resume creation must not overwrite canonical base `cvState`. [VERIFIED: CLAUDE.md + src/lib/agent/tools/index.ts]
- `generate_file` must keep using canonical base `cvState` by default and target-derived `cvState` only when an explicit `target_id` is selected. [VERIFIED: CLAUDE.md]
- Runtime code must keep using internal app user IDs after the auth boundary rather than Clerk IDs as domain keys. [VERIFIED: CLAUDE.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | Repo pin `^5.4.5`; npm latest `6.0.3` modified `2026-04-16`. [VERIFIED: package.json + npm registry] | Type additions in `src/types/agent.ts` and additive optional fields on session state. [VERIFIED: src/types/agent.ts] | This phase is a typed brownfield refactor; it does not need a new runtime dependency. [VERIFIED: codebase grep] |
| Vitest | Repo installed `1.6.1`; npm latest `4.1.5` modified `2026-04-23`. [VERIFIED: npx vitest --version + npm registry] | Focused unit, route, and streaming regressions. [VERIFIED: vitest.config.ts + codebase grep] | Existing agent, route, and policy tests already cover the exact seams this phase changes. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | Repo pin `^3.23.8`; npm latest `4.3.6` modified `2026-01-25`. [VERIFIED: package.json + npm registry] | Keep current request validation intact if any route payload is touched. [VERIFIED: AGENTS.md + package.json] | Use only if the phase adds or changes a public request shape; current locked scope does not require a new API contract. [VERIFIED: 105-CONTEXT.md + codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keeping boolean weak-fit as the primary source. [VERIFIED: src/lib/agent/profile-review.ts + codebase grep] | `CareerFitEvaluation` as the primary decision with wrappers preserving old helper names. [VERIFIED: 105-CONTEXT.md + src/types/agent.ts] | The graded evaluation is required to support medium-risk warnings without reusing the hard block. [VERIFIED: 105-CONTEXT.md] |
| Removing `targetFitAssessment` now. [VERIFIED: 105-CONTEXT.md] | Keep `targetFitAssessment` as a compatibility field during this phase. [VERIFIED: 105-CONTEXT.md + codebase grep] | Route serialization, prompt context, tests, and UI compatibility still depend on the old field. [VERIFIED: codebase grep] |
| Adding an external scoring service or ML classifier. [VERIFIED: 105-CONTEXT.md] | Reuse repo-local heuristics in `profile-review.ts`. [VERIFIED: 105-CONTEXT.md + src/lib/agent/profile-review.ts] | External scoring is explicitly out of scope and would widen brownfield risk. [VERIFIED: 105-CONTEXT.md] |

**Installation:**

```bash
# No new packages are required for Phase 105.
```

**Version verification:** `npm view vitest version time.modified`, `npm view typescript version time.modified`, and `npm view zod version time.modified` succeeded in this workspace on 2026-04-25. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

Use the existing seams below instead of introducing a new layer or service. [VERIFIED: codebase grep]

```text
src/
|-- types/agent.ts                         # CareerFitRiskLevel, CareerFitEvaluation, phaseMeta additions
|-- lib/agent/profile-review.ts           # central evaluator + compatibility wrappers
|-- lib/agent/job-targeting-pipeline.ts   # persist evaluation after gap analysis
|-- lib/agent/tools/index.ts              # persist and clear evaluation in dispatcher paths
|-- lib/agent/request-orchestrator.ts     # clear and optionally persist evaluation on auto-gap path
|-- lib/agent/agent-loop.ts               # warn vs block behavior
|-- lib/agent/action-classification.ts    # async classification must not treat medium as blocking
|-- lib/routes/session-generate/policy.ts # target export block must stay high-only
|-- lib/agent/context/sources/build-source-context.ts
|   # prompt snapshot exposes risk level and rules
\-- app/api/session/[id]/route.ts         # manual session serialization, optional additive exposure
```

### Pattern 1: Central Graded Evaluator With Wrapper Delegation

**What:** Keep all scoring thresholds, family distance logic, summary mapping, and reason assembly inside `src/lib/agent/profile-review.ts`. [VERIFIED: 105-CONTEXT.md + src/lib/agent/profile-review.ts]  
**When to use:** For every current consumer that asks "should I warn?", "should I block?", "what text should I show?", or "what checkpoint should I emit?". [VERIFIED: codebase grep]  
**Why:** The current worktree already has a partial scorer, but several consumers still read legacy booleans or old fit summaries directly. [VERIFIED: git status --short + codebase grep]

**Example:**

```typescript
// Pattern derived from src/lib/agent/profile-review.ts and the locked Phase 105 decisions.
export function evaluateCareerFitRisk(session: Pick<Session, 'agentState' | 'cvState'>): CareerFitEvaluation | null {
  // Score once here.
}

export function requiresCareerFitWarning(session: Pick<Session, 'agentState' | 'cvState'>): boolean {
  const evaluation = session.agentState.careerFitEvaluation ?? evaluateCareerFitRisk(session)
  return evaluation?.riskLevel === 'medium' || evaluation?.riskLevel === 'high'
}

export function requiresCareerFitOverrideConfirmation(session: Pick<Session, 'agentState' | 'cvState'>): boolean {
  const evaluation = session.agentState.careerFitEvaluation ?? evaluateCareerFitRisk(session)
  return evaluation?.riskLevel === 'high'
    && hasActiveCareerFitWarning(session)
    && !hasConfirmedCareerFitOverride(session)
}
```

### Pattern 2: Persist And Clear Evaluation Wherever Target-Fit State Already Changes

**What:** Write `careerFitEvaluation` alongside `gapAnalysis` and `targetFitAssessment`, and clear it anywhere those fields are cleared because the target changed. [VERIFIED: 105-CONTEXT.md + src/lib/agent/job-targeting-pipeline.ts + src/lib/agent/tools/index.ts + src/lib/agent/request-orchestrator.ts]  
**When to use:** In `runJobTargetingPipeline(...)`, `analyze_gap`, `score_ats` with a new `job_description`, and the target-detection reset path in `request-orchestrator.ts`. [VERIFIED: codebase grep]  
**Why:** The current repo already clears old fit fields by hand when the target changes, so forgetting the new field will leave stale risk state behind. [VERIFIED: src/lib/agent/tools/index.ts + src/lib/agent/request-orchestrator.ts]

**Example:**

```typescript
// Pattern derived from src/lib/agent/tools/index.ts and src/lib/agent/request-orchestrator.ts.
agentState: {
  targetJobDescription,
  gapAnalysis,
  targetFitAssessment,
  careerFitEvaluation,
}

agentState: {
  targetJobDescription: detection.targetJobDescription,
  gapAnalysis: undefined,
  targetFitAssessment: undefined,
  careerFitEvaluation: undefined,
  targetingPlan: undefined,
}
```

### Pattern 3: Split Warning From Blocking

**What:** Treat warning display and explicit confirmation as separate decisions. [VERIFIED: 105-CONTEXT.md]  
**When to use:** In `agent-loop.ts`, `action-classification.ts`, `src/lib/routes/session-generate/policy.ts`, and checkpoint generation. [VERIFIED: codebase grep]  
**Why:** The current UI and done-chunk flow only understand `CareerFitCheckpoint` as a confirmation gate, so medium risk must stay warning-only or it will reopen the existing blocking modal path. [VERIFIED: src/components/dashboard/chat-interface.tsx + src/lib/agent/agent-persistence.ts]

**Recommended rule:** `CareerFitCheckpoint` stays high-risk only, while medium risk is surfaced as text and prompt context without returning a pending-confirmation checkpoint. [VERIFIED: 105-CONTEXT.md + src/components/dashboard/chat-interface.tsx]

### Pattern 4: Reconcile The Existing Partial WIP Before Touching Consumers

**What:** Normalize the current worktree so it matches the locked decision before wiring downstream readers. [VERIFIED: git status --short + src/lib/agent/profile-review.ts + src/types/agent.ts]  
**When to use:** At the first implementation step. [VERIFIED: current worktree state]  
**Why:** The current worktree already diverges from the locked spec in at least four places: `RoleFamilyDistance` still includes `unknown`, unknown families are not treated as `same`, the adjacent-risk subtract rule is `>=55` plus `missingSkillsCount <= 3` instead of `>=50`, and prompt/checkpoint text still reads the older `targetFitAssessment`/`gapAnalysis` surfaces. [VERIFIED: src/lib/agent/profile-review.ts + src/types/agent.ts + 105-CONTEXT.md]

### Anti-Patterns to Avoid

- **Scoring in more than one file:** Do not duplicate thresholds in `agent-loop.ts`, `policy.ts`, or route handlers; keep one evaluator and wrappers. [VERIFIED: 105-CONTEXT.md + codebase grep]
- **Turning medium risk into a checkpoint:** The current chat UI treats `CareerFitCheckpoint` as a modal-worthy confirmation blocker, so medium risk should not emit one. [VERIFIED: src/components/dashboard/chat-interface.tsx]
- **Persisting the new field but forgetting manual serializers:** `/api/session/[id]/route.ts` hand-picks `agentState` keys, so additive state is invisible unless you serialize it explicitly. [VERIFIED: src/app/api/session/[id]/route.ts]
- **Assuming the partial WIP is already correct:** The current worktree scorer does not match the locked thresholds or unknown-family fallback. [VERIFIED: src/lib/agent/profile-review.ts + 105-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persisting graded fit state. [VERIFIED: codebase grep] | A parallel table or external store for career-fit risk. [VERIFIED: 105-CONTEXT.md] | `session.agentState.careerFitEvaluation` persisted through the existing `ToolPatch` and `updateSession` seams. [VERIFIED: CLAUDE.md + src/lib/db/session-normalization.ts] | The repo already treats `agentState` as operational context, and patch merging is partial-safe. [VERIFIED: CLAUDE.md + src/lib/db/session-normalization.ts] |
| Medium-risk UX. [VERIFIED: codebase grep] | A new modal or separate frontend gate. [VERIFIED: 105-CONTEXT.md] | Existing text-warning paths plus the current high-only `CareerFitCheckpoint`. [VERIFIED: 105-CONTEXT.md + src/components/dashboard/chat-interface.tsx] | This avoids widening the UI surface while still satisfying the gating rule split. [VERIFIED: 105-CONTEXT.md] |
| Risk classification. [VERIFIED: 105-CONTEXT.md] | A second heuristic module outside `profile-review.ts`. [VERIFIED: codebase grep] | `evaluateCareerFitRisk(session)` with wrappers preserving helper names. [VERIFIED: 105-CONTEXT.md + src/lib/agent/profile-review.ts] | The current repo already concentrates warning logic in `profile-review.ts`. [VERIFIED: codebase grep] |
| Target-change cleanup. [VERIFIED: codebase grep] | Ad-hoc stale-state comparisons in every consumer. [VERIFIED: codebase grep] | Existing reset seams in `tools/index.ts` and `request-orchestrator.ts`. [VERIFIED: src/lib/agent/tools/index.ts + src/lib/agent/request-orchestrator.ts] | Those files already own target-change clearing for `gapAnalysis` and `targetFitAssessment`. [VERIFIED: codebase grep] |

**Key insight:** The hard part is not computing `riskPoints`; the hard part is keeping every existing reader and writer on one decision seam while `targetFitAssessment`, `CareerFitCheckpoint`, and target-scoped `phaseMeta` remain compatibility surfaces. [VERIFIED: 105-CONTEXT.md + codebase grep]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `sessions.agent_state` JSON already stores `targetFitAssessment`, `gapAnalysis`, and `phaseMeta`; the current worktree now defines optional `careerFitEvaluation` and `careerFitRiskLevelAtWarning`, but no write seam outside `profile-review.ts` currently persists them. [VERIFIED: src/types/agent.ts + src/lib/db/session-normalization.ts + codebase grep] | Code edit only. Keep `careerFitEvaluation` optional and make reads fall back to a derived evaluation so existing rows do not need a data migration. [VERIFIED: src/lib/agent/profile-review.ts + src/lib/db/session-normalization.ts] |
| Live service config | None found. Career-fit behavior is implemented in repo code and session JSON, not in external workflow UIs or dashboard-only configuration. [VERIFIED: codebase grep] | None. [VERIFIED: codebase grep] |
| OS-registered state | None found. This phase does not rely on task schedulers, service names, or local registrations that embed career-fit semantics. [VERIFIED: codebase grep] | None. [VERIFIED: codebase grep] |
| Secrets/env vars | No env var or secret name references `careerFit`, `targetFitAssessment`, or `gapAnalysis`. [VERIFIED: repo grep] | None. [VERIFIED: repo grep] |
| Build artifacts | Existing sessions and serialized workspaces can continue loading without `careerFitEvaluation` because `normalizeAgentState(...)` tolerates missing optional fields. [VERIFIED: src/lib/db/session-normalization.ts + src/types/dashboard.ts] | Code edit only. Do not require reinstall or artifact cleanup; keep missing-field fallback behavior. [VERIFIED: src/lib/db/session-normalization.ts] |

## Common Pitfalls

### Pitfall 1: Assuming The Current Partial WIP Matches The Locked Spec

**What goes wrong:** The planner wires downstream consumers to the current scorer and freezes the wrong semantics. [VERIFIED: src/lib/agent/profile-review.ts + 105-CONTEXT.md]  
**Why it happens:** The worktree already added `CareerFitEvaluation`, but the current scorer still allows `familyDistance: 'unknown'`, uses a broader adjacency map, and subtracts one point only when `adjacent && matchScore >= 55 && missingSkillsCount <= 3`. [VERIFIED: src/lib/agent/profile-review.ts + src/types/agent.ts + 105-CONTEXT.md]  
**How to avoid:** Make the scorer match the locked thresholds and `unknown -> same` rule before touching any consumer. [VERIFIED: 105-CONTEXT.md]  
**Warning signs:** `buildCareerFitPromptSnapshot(...)` still talks only about weak fit, or adjacent medium cases still score like hard mismatches. [VERIFIED: src/lib/agent/profile-review.ts + 105-CONTEXT.md]

### Pitfall 2: Forgetting Reset Paths When The Target Job Changes

**What goes wrong:** The session keeps showing the previous target's risk after a new vacancy is detected or scored. [ASSUMED]  
**Why it happens:** `score_ats` and `buildDetectedTargetJobAgentState(...)` already clear `gapAnalysis` and `targetFitAssessment` manually; the new field must be added anywhere that old target-fit state is cleared. [VERIFIED: src/lib/agent/tools/index.ts + src/lib/agent/request-orchestrator.ts]  
**How to avoid:** Clear `careerFitEvaluation` anywhere `targetJobDescription`, `gapAnalysis`, or `targetFitAssessment` are reset. [VERIFIED: codebase grep + current reset seams]  
**Warning signs:** A new vacancy is stored, but prompt/context or route snapshots still show the prior risk state before fresh analysis runs. [ASSUMED]

### Pitfall 3: Letting Medium Risk Reuse The High-Risk Modal Path

**What goes wrong:** Medium-risk users still get blocked and forced through the explicit override UX. [VERIFIED: 105-CONTEXT.md]  
**Why it happens:** The frontend only knows `CareerFitCheckpoint` as `pending_confirmation`, and done-chunks plus session snapshots already wire that object into the chat modal flow. [VERIFIED: src/components/dashboard/chat-interface.tsx + src/lib/agent/agent-persistence.ts + src/app/api/session/[id]/route.ts]  
**How to avoid:** Keep `CareerFitCheckpoint` high-risk only and let medium risk surface through warning text and prompt guidance instead of checkpoint state. [VERIFIED: 105-CONTEXT.md + codebase grep]  
**Warning signs:** Medium scenarios start returning `CAREER_FIT_CONFIRMATION_REQUIRED`, non-null checkpoints, or blocked `artifact_generation` classification. [VERIFIED: src/lib/routes/session-generate/policy.ts + src/lib/agent/action-classification.ts]

### Pitfall 4: Missing Hidden Consumers Outside The Listed Seam List

**What goes wrong:** Chat, async classification, and target export policy disagree on whether the user can proceed. [VERIFIED: codebase grep]  
**Why it happens:** `action-classification.ts` and `src/lib/routes/session-generate/policy.ts` both still depend on boolean helper semantics, and `request-orchestrator.ts` owns a target-change reset plus auto-gap path that was not in the user-provided seam list. [VERIFIED: src/lib/agent/action-classification.ts + src/lib/routes/session-generate/policy.ts + src/lib/agent/request-orchestrator.ts]  
**How to avoid:** Treat those files as required migration targets, not optional follow-up cleanup. [VERIFIED: codebase grep]  
**Warning signs:** Sync chat warns one way, `/api/session/[id]/generate` blocks another way, and background target detection persists only legacy fit fields. [VERIFIED: codebase grep]

### Pitfall 5: Persisting The New Field Without Exposing Or Testing It Deliberately

**What goes wrong:** The new state exists in `agentState`, but snapshots, workspace types, and tests never prove it. [VERIFIED: src/app/api/session/[id]/route.ts + src/types/dashboard.ts]  
**Why it happens:** The session route manually serializes `agentState`, and `SessionWorkspace` in `src/types/dashboard.ts` still does not include `careerFitEvaluation`. [VERIFIED: src/app/api/session/[id]/route.ts + src/types/dashboard.ts]  
**How to avoid:** Either keep the field server-only for this phase and rely on checkpoint compatibility, or expose it additively and update the dashboard types plus route tests in the same patch. [VERIFIED: codebase grep]  
**Warning signs:** `careerFitEvaluation` is written in session state, but route responses and workspace consumers never see it. [VERIFIED: current serializer shape]

## Code Examples

Verified patterns from the current repo plus the locked phase decisions:

### Central Evaluation And Compatibility Wrapper

```typescript
// Source pattern: src/lib/agent/profile-review.ts + 105-CONTEXT.md
function resolveCurrentCareerFitEvaluation(
  session: Pick<Session, 'agentState' | 'cvState'>,
): CareerFitEvaluation | null {
  return session.agentState.careerFitEvaluation ?? evaluateCareerFitRisk(session)
}

export function requiresCareerFitWarning(session: Pick<Session, 'agentState' | 'cvState'>): boolean {
  const evaluation = resolveCurrentCareerFitEvaluation(session)
  return evaluation?.riskLevel === 'medium' || evaluation?.riskLevel === 'high'
}

export function requiresCareerFitOverrideConfirmation(
  session: Pick<Session, 'agentState' | 'cvState'>,
): boolean {
  const evaluation = resolveCurrentCareerFitEvaluation(session)
  return evaluation?.riskLevel === 'high'
    && hasActiveCareerFitWarning(session)
    && !hasConfirmedCareerFitOverride(session)
}
```

### Persist Evaluation Beside Existing Fit State

```typescript
// Source pattern: src/lib/agent/job-targeting-pipeline.ts + src/lib/agent/tools/index.ts
const careerFitEvaluation = evaluateCareerFitRisk({
  cvState: session.cvState,
  agentState: {
    ...session.agentState,
    targetJobDescription,
    gapAnalysis,
    targetFitAssessment,
  },
})

await persistAgentState(session, {
  ...session.agentState,
  targetJobDescription,
  gapAnalysis,
  targetFitAssessment,
  careerFitEvaluation,
})
```

### Keep Target-Scoped Warning Metadata Additive

```typescript
// Source pattern: src/lib/agent/agent-loop.ts + src/lib/db/session-normalization.ts
const patch = {
  agentState: {
    phaseMeta: {
      careerFitWarningIssuedAt: new Date().toISOString(),
      careerFitRiskLevelAtWarning: evaluation.riskLevel,
      careerFitWarningTargetJobDescription: targetJobDescription,
    },
  },
} satisfies ToolPatch
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Boolean weak-fit guardrail centered on `requiresCareerFitWarning(...)`. [VERIFIED: src/lib/agent/profile-review.ts + codebase grep] | Structured `CareerFitEvaluation` with `riskLevel`, `riskPoints`, `signals`, and wrapper-based compatibility. [VERIFIED: 105-CONTEXT.md + src/types/agent.ts] | Phase 105 target state; current workspace is mid-transition. [VERIFIED: 105-CONTEXT.md + git status --short] | Medium risk can warn without hard blocking, while high risk still requires explicit confirmation. [VERIFIED: 105-CONTEXT.md] |
| `targetFitAssessment` as the main fit summary in prompts and routes. [VERIFIED: src/lib/agent/context/sources/build-source-context.ts + src/app/api/session/[id]/route.ts] | `careerFitEvaluation` as the primary decision, with `targetFitAssessment` retained for compatibility during the phase. [VERIFIED: 105-CONTEXT.md] | Phase 105 target state. [VERIFIED: 105-CONTEXT.md] | Existing consumers can migrate incrementally instead of all at once. [VERIFIED: 105-CONTEXT.md] |

**Deprecated/outdated:**

- Treating any career-fit warning as an automatic hard block is outdated for this phase because medium risk is explicitly warning-only. [VERIFIED: 105-CONTEXT.md]
- Treating unknown role families as a mismatch is outdated for this phase because unknown must fail safe as `same`. [VERIFIED: 105-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact adjacency pairs inside `ADJACENCY_MAP` are not fully locked by `105-CONTEXT.md`, so the safest implementation is a deliberately small, explicitly tested map rather than a broad one. [ASSUMED] | Architecture Patterns, Open Questions | Wrong adjacency pairs will misclassify medium vs high risk and may recreate false-hard or false-soft gating. |

## Open Questions

1. **Which adjacency pairs beyond the accepted adjacent-role scenario should be first-class in this repo?**
   - What we know: The current worktree already introduced a broad adjacency map, but the locked decisions only require the distance model and the `unknown -> same` fallback. [VERIFIED: src/lib/agent/profile-review.ts + 105-CONTEXT.md]
   - What's unclear: Which pairs are product-approved versus speculative heuristics. [ASSUMED]
   - Recommendation: Keep the adjacency map intentionally small and add direct tests for every approved pair. [ASSUMED]

2. **Should `request-orchestrator.ts` persist `careerFitEvaluation` immediately on the auto-gap path in this phase?**
   - What we know: High-confidence target detection can already persist `gapAnalysis` and `targetFitAssessment` in `maybeAutoGenerateGapAnalysisForDetectedTarget(...)`. [VERIFIED: src/lib/agent/request-orchestrator.ts]
   - What's unclear: Whether the planner wants that path to store the new field now or rely on wrapper-based lazy fallback for one phase. [ASSUMED]
   - Recommendation: Prefer persisting it now if the implementation also adds one focused orchestrator regression; otherwise every read helper must keep deriving fallback from legacy fields. [VERIFIED: src/lib/agent/request-orchestrator.ts + src/lib/agent/profile-review.ts]

3. **Should `/api/session/[id]/route.ts` expose `careerFitEvaluation` now?**
   - What we know: The route manually serializes `agentState` and currently returns `targetFitAssessment`, `careerFitCheckpoint`, and `gapAnalysis`, but not `careerFitEvaluation`. [VERIFIED: src/app/api/session/[id]/route.ts]
   - What's unclear: Whether planner scope wants client-side inspectability now or only server-side behavior plus compatibility surfaces. [ASSUMED]
   - Recommendation: Add it only if the planner also updates `src/types/dashboard.ts` and the session-route tests in the same patch; otherwise keep the field server-side for this phase. [VERIFIED: src/types/dashboard.ts + src/app/api/session/[id]/route.test.ts]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | TypeScript/Vitest execution for this phase. [VERIFIED: package.json] | yes [VERIFIED: local shell] | `v24.14.0`. [VERIFIED: local shell] | none |
| npm | Script execution and package metadata verification. [VERIFIED: package.json] | yes [VERIFIED: local shell] | `11.9.0`. [VERIFIED: local shell] | none |
| Vitest CLI | Focused regression commands below. [VERIFIED: vitest.config.ts] | yes [VERIFIED: local shell] | `1.6.1`. [VERIFIED: local shell] | `npm test` if direct `npx vitest` invocation is unavailable. [VERIFIED: package.json] |

**Missing dependencies with no fallback:** None. [VERIFIED: local shell]  
**Missing dependencies with fallback:** None. [VERIFIED: local shell]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `1.6.1` installed in the workspace. [VERIFIED: npx vitest --version] |
| Config file | `vitest.config.ts`. [VERIFIED: vitest.config.ts] |
| Quick run command | `npx vitest run src/lib/agent/profile-review.test.ts src/lib/agent/action-classification.test.ts src/lib/agent/streaming-loop.test.ts src/lib/agent/context-builder.test.ts src/lib/routes/session-generate/policy.test.ts src/app/api/session/[id]/generate/route.test.ts src/lib/agent/tools/index.test.ts`. [VERIFIED: codebase grep + local shell] |
| Full suite command | `npm test`. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAREER-FIT-RISK-01 | Low/medium/high scoring, reason assembly, unknown-family fallback, and additive persistence of `careerFitEvaluation`. [VERIFIED: .planning/REQUIREMENTS.md + 105-CONTEXT.md] | unit | `npx vitest run src/lib/agent/profile-review.test.ts src/lib/agent/tools/index.test.ts`. [VERIFIED: codebase grep] | yes [VERIFIED: codebase grep] |
| CAREER-FIT-GATE-01 | Medium warns without blocking; high requires explicit override in chat flow, async classification, and target export policy. [VERIFIED: .planning/REQUIREMENTS.md + 105-CONTEXT.md] | integration/route | `npx vitest run src/lib/agent/action-classification.test.ts src/lib/agent/streaming-loop.test.ts src/lib/routes/session-generate/policy.test.ts src/app/api/session/[id]/generate/route.test.ts`. [VERIFIED: codebase grep] | yes [VERIFIED: codebase grep] |
| CAREER-FIT-TEST-01 | Prompt/context and session-facing compatibility surfaces reflect the current risk coherently. [VERIFIED: .planning/REQUIREMENTS.md + 105-CONTEXT.md] | unit/route | `npx vitest run src/lib/agent/context-builder.test.ts src/app/api/session/[id]/route.test.ts`. [VERIFIED: codebase grep] | yes [VERIFIED: codebase grep] |

### Sampling Rate

- **Per task commit:** Run the smallest subset that covers the seam you changed, using the Quick run command above as the upper bound. [VERIFIED: vitest.config.ts + codebase grep]
- **Per wave merge:** Run the full Quick run command for all career-fit seams. [VERIFIED: codebase grep]
- **Phase gate:** `npm test` green before `/gsd-verify-work`. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] Extend `src/lib/agent/action-classification.test.ts` with a medium-risk scenario that still classifies `"Aceito"` as async `artifact_generation` once prerequisites are satisfied. [VERIFIED: src/lib/agent/action-classification.ts + src/lib/agent/action-classification.test.ts + 105-CONTEXT.md]
- [ ] Extend `src/lib/routes/session-generate/policy.test.ts` or `src/app/api/session/[id]/generate/route.test.ts` with a medium-risk target scenario that does not return `CAREER_FIT_CONFIRMATION_REQUIRED`. [VERIFIED: src/lib/routes/session-generate/policy.ts + src/lib/routes/session-generate/policy.test.ts + src/app/api/session/[id]/generate/route.test.ts]
- [ ] Add a focused `request-orchestrator.test.ts` case only if the implementation persists `careerFitEvaluation` in the auto-gap path. [VERIFIED: src/lib/agent/request-orchestrator.ts + src/lib/agent/request-orchestrator.test.ts]
- [ ] Add a session-route assertion only if the implementation exposes `careerFitEvaluation` through `/api/session/[id]`. [VERIFIED: src/app/api/session/[id]/route.ts + src/app/api/session/[id]/route.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes. [VERIFIED: src/app/api/session/[id]/route.ts + src/app/api/session/[id]/generate/route.ts] | Keep `getCurrentAppUser()` and existing session ownership checks unchanged. [VERIFIED: codebase grep] |
| V3 Session Management | no direct session-token or cookie changes are in scope. [VERIFIED: 105-CONTEXT.md + codebase grep] | Existing Next/Clerk session handling remains unchanged. [VERIFIED: AGENTS.md + codebase grep] |
| V4 Access Control | yes. [VERIFIED: src/lib/routes/session-generate/policy.ts + src/app/api/session/[id]/route.ts] | Keep career-fit blocking and snapshot access inside the existing authorized session context. [VERIFIED: codebase grep] |
| V5 Input Validation | yes. [VERIFIED: AGENTS.md + src/lib/agent/context/sources/build-source-context.ts] | Continue delimiting user-provided target/resume content and keep route/tool input validation on existing seams. [VERIFIED: src/lib/agent/context-builder.test.ts + src/lib/agent/tools/index.ts] |
| V6 Cryptography | no phase-specific crypto change. [VERIFIED: 105-CONTEXT.md + codebase grep] | Reuse existing platform crypto/storage behavior; do not add crypto logic here. [VERIFIED: CLAUDE.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection inside target job descriptions or parsed resume text. [VERIFIED: src/lib/agent/context/sources/build-source-context.ts + src/lib/agent/context-builder.test.ts] | Tampering | Keep user-provided sections explicitly delimited and preserve the prompt rule that those sections must never override system instructions. [VERIFIED: src/lib/agent/context-builder.test.ts] |
| Stale or mismatched target-fit state after the user changes the target vacancy. [VERIFIED: src/lib/agent/tools/index.ts + src/lib/agent/request-orchestrator.ts] | Tampering | Clear `careerFitEvaluation` anywhere `gapAnalysis` and `targetFitAssessment` are cleared, and keep warning metadata target-scoped by `targetJobDescription`. [VERIFIED: codebase grep + 105-CONTEXT.md] |
| Medium-risk sessions being treated as high-risk blockers by one consumer but not another. [VERIFIED: codebase grep] | Elevation of Privilege / Tampering | Make `action-classification.ts`, `agent-loop.ts`, `policy.ts`, and checkpoint helpers read the same evaluation seam. [VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/CURRIA-105-refinar-career-fit-de-warning-booleano-para-avaliacao-gradua/105-CONTEXT.md` - locked decisions, source-of-truth decisions, acceptance targets, and non-goals. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - requirement IDs and requirement text for CAREER-FIT-RISK-01, CAREER-FIT-GATE-01, and CAREER-FIT-TEST-01. [VERIFIED: local file]
- `AGENTS.md` - brownfield priorities, stack, conventions, and workflow expectations. [VERIFIED: local file]
- `CLAUDE.md` - session-state invariants, tool patch rules, and route/generation constraints. [VERIFIED: local file]
- `src/types/agent.ts` - current type surfaces and partial WIP already present in the worktree. [VERIFIED: local file]
- `src/lib/agent/profile-review.ts` - current evaluator, warning helpers, and partial WIP mismatches. [VERIFIED: local file]
- `src/lib/agent/job-targeting-pipeline.ts`, `src/lib/agent/tools/index.ts`, `src/lib/agent/request-orchestrator.ts` - persistence and clear seams for target-fit state. [VERIFIED: local files]
- `src/lib/agent/agent-loop.ts`, `src/lib/agent/action-classification.ts`, `src/lib/routes/session-generate/policy.ts` - current gating consumers. [VERIFIED: local files]
- `src/lib/agent/context/sources/build-source-context.ts` and `src/app/api/session/[id]/route.ts` - prompt and route serialization surfaces. [VERIFIED: local files]
- `src/lib/agent/profile-review.test.ts`, `src/lib/agent/action-classification.test.ts`, `src/lib/agent/streaming-loop.test.ts`, `src/lib/agent/context-builder.test.ts`, `src/lib/routes/session-generate/policy.test.ts`, `src/app/api/session/[id]/generate/route.test.ts`, `src/app/api/session/[id]/route.test.ts`, `src/lib/agent/tools/index.test.ts`, and `src/lib/agent/request-orchestrator.test.ts` - existing regression surfaces and current gaps. [VERIFIED: local files]
- `vitest.config.ts`, `package.json`, `node --version`, `npm --version`, `npx vitest --version`, and npm registry queries for `vitest`, `typescript`, and `zod` - test harness and environment verification. [VERIFIED: local files + local shell + npm registry]

### Secondary (MEDIUM confidence)

- None. [VERIFIED: research session]

### Tertiary (LOW confidence)

- None. [VERIFIED: research session]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommendations stay inside the existing repo stack and were verified against local config plus npm registry metadata. [VERIFIED: package.json + vitest.config.ts + npm registry]
- Architecture: HIGH - the migration seams, hidden consumers, and current partial WIP were verified directly in the codebase. [VERIFIED: codebase grep + local files]
- Pitfalls: HIGH - each pitfall maps to current repo behavior, manual serializers, or locked phase decisions. [VERIFIED: codebase grep + 105-CONTEXT.md]

**Research date:** 2026-04-25  
**Valid until:** 2026-05-02
