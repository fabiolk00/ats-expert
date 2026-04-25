# Phase 105 Context

### Goal

Refine the current career-fit guardrail from a rigid boolean weak-fit decision into a graduated low/medium/high risk evaluation that preserves honest targeting guidance while avoiding unnecessary hard blocks for adjacent role moves.

### Why This Phase Exists

Phase 104 improved the weak-fit UX with an explicit confirmation modal, but it intentionally preserved the existing server-side boolean warning semantics. That boolean seam now produces false-hardness in adjacent transitions such as BI/data profiles targeting analytics-oriented roles that share meaningful overlap even when the fit is not perfect.

This phase upgrades the backend decision model first. The warning flow should remain protective, but medium-risk scenarios must warn without forcing the same explicit override used for structurally high-risk mismatches.

### Repository Findings

- The current weak-fit decision is still boolean-first in:
  - `src/lib/agent/profile-review.ts`
  - `src/lib/agent/agent-loop.ts`
- The current targeting pipeline persists:
  - `agentState.gapAnalysis`
  - `agentState.targetFitAssessment`
- Tool-driven gap analysis also derives target-fit state in:
  - `src/lib/agent/tools/index.ts`
- Prompt/context guardrails currently consume target-fit and gap-analysis snapshots in:
  - `src/lib/agent/context/sources/build-source-context.ts`
  - `src/lib/agent/context-builder.test.ts`
- Existing regression coverage already exercises warning/override generation seams in:
  - `src/lib/agent/profile-review.test.ts`
  - `src/lib/agent/streaming-loop.test.ts`

### Source Of Truth Decision

- `cvState` remains the canonical resume truth.
- `agentState.targetFitAssessment` stays in place for compatibility during this phase.
- The new structured decision becomes `agentState.careerFitEvaluation`, which is the primary source for warning tone and gating behavior.
- `phaseMeta` remains the canonical per-target warning/override memory, extended with risk-level metadata instead of replacing the existing fields outright.

### Locked Decisions

- Introduce `CareerFitRiskLevel` and `CareerFitEvaluation` in `src/types/agent.ts`, then persist `careerFitEvaluation?: CareerFitEvaluation` under `Session['agentState']`.
- Keep `inferRoleFamily(...)`, but replace boolean family mismatch reasoning with explicit `RoleFamilyDistance = 'same' | 'adjacent' | 'distant'`.
- Treat `unknown` role families as `same` for safety so uncertain classification does not penalize the user.
- Create `evaluateCareerFitRisk(session)` in `src/lib/agent/profile-review.ts` as the central graded decision seam.
- Risk points must use the requested thresholds:
  - score `<45` => `+4`
  - score `45..59` => `+2`
  - missing skills `>=6` => `+3`, `4..5` => `+2`, `2..3` => `+1`
  - weak areas `>=5` => `+3`, `3..4` => `+2`, `1..2` => `+1`
  - family distance `distant` => `+4`, `adjacent` => `+1`
  - major seniority gap => `+3`
- Anti-false-negative adjustment is required:
  - if family distance is `adjacent` and match score is at least `50`, subtract `1` point.
- Classification must be:
  - `riskPoints >= 8` => `high`, explicit confirmation required
  - `riskPoints 4..7` => `medium`, warning only
  - `riskPoints <= 3` => `low`
- Summary text must map to:
  - low => `alinhamento viável com gaps tratáveis`
  - medium => `alinhamento parcial com lacunas relevantes`
  - high => `desalinhamento estrutural para a vaga`
- Reasons should reuse `targetFitAssessment.reasons`, mismatch rationale, and top gaps with a bounded list.
- Keep compatibility wrappers instead of deleting existing APIs immediately:
  - `requiresCareerFitWarning(...)`
  - `buildCareerFitCheckpoint(...)`
  - `buildCareerFitWarningText(...)`
- Persist the evaluation both in `runJobTargetingPipeline(...)` and in the tool dispatcher `analyze_gap` path.
- Update agent-loop gating so:
  - medium and high risk show warning
  - only high risk requires explicit override before generation
- Extend `phaseMeta` with:
  - `careerFitRiskLevelAtWarning`
  - `careerFitWarningTargetJobDescription`
  - `careerFitOverrideConfirmedAt` only for high risk
- Prompt context must expose the current risk level and the medium/high behavioral rule.
- Do not remove `targetFitAssessment`, existing checkpoint plumbing, or previous warning fields in this phase.

### Canonical References

- `src/types/agent.ts`
- `src/lib/agent/profile-review.ts`
- `src/lib/agent/profile-review.test.ts`
- `src/lib/agent/agent-loop.ts`
- `src/lib/agent/streaming-loop.test.ts`
- `src/lib/agent/job-targeting-pipeline.ts`
- `src/lib/agent/tools/index.ts`
- `src/lib/agent/context/sources/build-source-context.ts`
- `src/lib/agent/context-builder.test.ts`

### Acceptance Targets

- Career fit is no longer modeled primarily as a boolean mismatch.
- Adjacent BI/data targeting scenarios can land as medium risk instead of an automatic hard warning path.
- High-risk distant mismatches still require explicit confirmation before generation.
- Prompt and checkpoint surfaces reflect low/medium/high risk coherently.
- Focused tests pass for low, medium, and high risk plus generation gating behavior.

### Deferred / Explicit Non-Goals

- No removal of `targetFitAssessment` in this phase.
- No redesign of the broader chat UI or warning modal surfaces beyond what the backend risk levels require.
- No new external scoring service or ML model.
- No cleanup of older compatibility fields beyond parallel extension.
