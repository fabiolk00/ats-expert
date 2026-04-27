# Phase 110: Hardening low-fit warning gate and safer bridge emphasis for job targeting - Research

**Researched:** 2026-04-27  
**Domain:** `job_targeting` hardening with evidence-derived emphasis, generic core-requirement coverage, and recoverable low-fit gating. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting-pipeline.ts`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`]  
**Confidence:** MEDIUM. [VERIFIED: current code seams are explicit in `src/lib/agent/job-targeting-pipeline.ts`, but the new gate thresholds and coverage heuristic are still implementation decisions.]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Locked product decisions

- The solution must stay domain-agnostic. Examples like Java or Sistemas/BI/RH exist only as fixtures and acceptance proof. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Explicit evidence should be highlighted more aggressively when it is genuinely present in the resume. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Bridge-only evidence may help wording, but must never become direct skill or role claims. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Strong off-target conditions must no longer auto-generate final artifacts. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Off-target gating is recoverable, not terminal: the user may still confirm `Gerar mesmo assim (1 crédito)` or open pricing when credits are unavailable. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Peripheral similarities must not be enough to claim the target role directly. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- User-facing copy must stay human, PT-BR, and free from internal/debug vocabulary. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]

#### Locked architecture decisions

- Reuse the existing `job_targeting` pipeline; do not create a second targeting flow. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Reuse the Phase 108 `TargetingPlan` as the canonical contract for evidence-driven decisions. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Reuse the Phase 109 recoverable modal and override path for the low-fit block. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- The new low-fit decision must happen before final version persistence, `generate_file`, and credit reservation. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Observability must explain why the low-fit gate triggered and why warnings were promoted. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]

### Claude's Discretion

- Exact helper/module names for the new low-fit and emphasis builders. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Whether the emphasis layer lives as a new `TargetingPlan` sub-object or an equivalent compact structure. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- The exact core-requirement coverage heuristic, as long as it stays generic and derives from the vacancy text rather than hardcoded role stacks. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]

### Deferred Ideas (OUT OF SCOPE)

- Any changes to ATS enhancement behavior. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Any broader redesign of compare/highlight-only flows. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- Domain-specific role-family hardcoding. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
- New billing state machines outside the existing override path. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md`]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| `JOB-TARGET-LOW-FIT-01` | Add a recoverable low-fit warning gate that stops automatic success before final persistence, `generate_file`, and credit reservation in clearly off-target cases. [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] | `runJobTargetingPipeline()` is the correct blocking seam because `executeSmartGenerationDecision()` only calls `dispatchSmartGenerationArtifact()` after pipeline success. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`] |
| `JOB-TARGET-EMPHASIS-01` | Improve partial-fit competitiveness by emphasizing explicit evidence and cautious bridges without weakening skill-surface safety. [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] | `TargetEvidence` plus `rewritePermissions` already encode the needed safety levels; add a derived emphasis layer instead of changing skills rules directly. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`; `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`] |
| `JOB-TARGET-CORE-COVERAGE-01` | Compute generic core requirement coverage from vacancy text so peripheral similarities cannot mask missing main stack coverage. [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] | Reuse current vacancy shaping and semantic normalization helpers rather than a second parser or domain-specific lists. [VERIFIED: `src/lib/agent/job-targeting-retry.ts`; `src/lib/agent/job-targeting/semantic-normalization.ts`; `src/lib/agent/tools/build-targeting-plan.ts`] |
| `JOB-TARGET-LOW-FIT-OBS-01` | Trace and logs must explain gate evaluation, trigger reason, ratios, coverage, and warning promotion. [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] | Extend `TargetingPlan`-time logging and `JobTargetingTrace` rather than inventing a second telemetry channel. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/types/trace.ts`] |
| `JOB-TARGET-LOW-FIT-TEST-01` | Add focused regression proof for off-target gating, safe partial-fit emphasis, recoverable override reuse, and UI copy. [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] | Existing pipeline, route, override, and UI tests already cover the nearest seams and should be extended rather than replaced. [VERIFIED: `src/lib/agent/tools/pipeline.test.ts`; `src/lib/agent/job-targeting/validation-policy.test.ts`; `src/app/api/profile/smart-generation/route.test.ts`; `src/app/api/session/[id]/job-targeting/override/route.test.ts`; `src/components/resume/user-data-page.test.tsx`; `src/components/dashboard/resume-workspace.test.tsx`] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- `cvState` remains canonical resume truth and `agentState` remains operational context only. [VERIFIED: `CLAUDE.md`; `src/types/agent.ts`]
- Preserve the current brownfield product surface unless the phase explicitly changes scope. [VERIFIED: `CLAUDE.md`]
- Prefer reliability, billing safety, observability, and verification over new feature breadth. [VERIFIED: `CLAUDE.md`]
- Keep route handlers thin, validate external input with `zod`, and use structured logs via `logInfo`, `logWarn`, and `logError`. [VERIFIED: `CLAUDE.md`; `src/app/api/session/[id]/job-targeting/override/route.ts`]
- Preserve the dispatcher and `ToolPatch` patterns when changing agent flows. [VERIFIED: `CLAUDE.md`; `src/types/agent.ts`]
- Resume targeting may reorder and reframe grounded evidence, but must not invent unsupported claims. [VERIFIED: `CLAUDE.md`; `src/lib/agent/tools/rewrite-resume-full.ts`; `src/lib/agent/tools/validate-rewrite.ts`]

## Summary

The current automatic path is already sequenced correctly for this phase: `executeSmartGenerationDecision()` bootstraps the session, runs `runJobTargetingPipeline()`, checks the persisted handoff, and only then calls `dispatchSmartGenerationArtifact()` / `generate_file`. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`; `src/lib/routes/smart-generation/dispatch.ts`] That means the low-fit stop must happen inside `runJobTargetingPipeline()` before the success return path, not in the UI and not in the override route. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`]

The current partial-fit weakness is structural: `mustEmphasize` is built before `TargetEvidence` exists, so prompt emphasis cannot distinguish explicit evidence from bridge-only evidence. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/evidence-classifier.ts`] The safest fix is to derive a compact `safeTargetingEmphasis` object immediately after `classifyTargetEvidence()` and `buildTargetedRewritePermissions()`, then feed that object into `rewrite-resume-full.ts` without relaxing `skillsSurfaceAllowed`. [VERIFIED: `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`]

The current recoverable product path is also already in place: the smart-generation route returns `422` with `recoverableValidationBlock`, both profile and workspace UIs render the same modal shell, and the override route persists the blocked draft, creates a CV version, calls `generate_file`, and charges only through the existing billable generation seam. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`; `src/app/api/profile/smart-generation/route.test.ts`; `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`; `src/app/api/session/[id]/job-targeting/override/route.ts`] Phase 110 should reuse that exact path and only change when the pipeline decides to enter it. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`]

**Primary recommendation:** derive `safeTargetingEmphasis`, `coreRequirementCoverage`, and a plan-level `lowFitWarningGate` inside `buildTargetedRewritePlan()`, then let `runJobTargetingPipeline()` promote only fit-related soft warnings into the existing recoverable block before final persistence and before `generate_file`. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`]

## Standard Stack

No new npm packages are recommended for Phase 110. [VERIFIED: `package.json`; `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`] The safest implementation stays on the installed stack and adds only internal helpers plus optional type fields. [VERIFIED: `package.json`; `src/types/agent.ts`; `src/types/trace.ts`]

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `14.2.3` in repo; latest `16.2.4` on npm. [VERIFIED: `package.json`; npm registry] | Existing API route surface for smart-generation and override reuse. [VERIFIED: `src/app/api/profile/smart-generation/route.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`] | The phase already fits the current thin-route pattern; no framework change is needed. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`; `src/lib/routes/smart-generation/result-normalization.ts`] |
| `zod` | `3.23.8` in repo; latest `4.3.6` on npm. [VERIFIED: `package.json`; npm registry] | Request validation for existing override and smart-generation routes. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`] | Reuse the project’s current route-validation convention. [VERIFIED: `CLAUDE.md`; `src/app/api/session/[id]/job-targeting/override/route.ts`] |
| `vitest` | `1.6.1` installed; latest `4.1.5` on npm. [VERIFIED: `npx vitest --version`; npm registry] | Focused regression coverage for pipeline, validation, route, and UI reuse. [VERIFIED: `src/lib/agent/tools/pipeline.test.ts`; `src/app/api/profile/smart-generation/route.test.ts`; `src/components/resume/user-data-page.test.tsx`] | The repo already has the exact seam-level tests this phase needs. [VERIFIED: test files listed above] |

### Repo Contracts

| Contract | Current Owner | Why It Must Stay Canonical |
|----------|---------------|----------------------------|
| `TargetEvidence` / `rewritePermissions` | `buildTargetedRewritePlan()` plus `evidence-classifier.ts`. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/evidence-classifier.ts`] | The rewrite and validator already share this contract, so the new emphasis layer should derive from it instead of adding a parallel evidence model. [VERIFIED: `src/lib/agent/tools/rewrite-resume-full.ts`; `src/lib/agent/tools/validate-rewrite.ts`] |
| Recoverable block payload | `recoverableValidationBlock` in the pipeline and `422` normalization. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/result-normalization.ts`] | Both UIs already render this payload and both CTA flows already depend on it. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`] |
| Override persistence and billing | `POST /api/session/[id]/job-targeting/override`. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`] | It already persists first and bills only through `generate_file`, so Phase 110 should not add a second charging path. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing current `422` + `recoverableValidationBlock`. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`] | Introduce a new `409` response family. [ASSUMED] | The current UI and tests already understand `422` with recoverable payload, so a new status would add migration work without solving a current bug. [VERIFIED: `src/app/api/profile/smart-generation/route.test.ts`; `src/components/resume/user-data-page.tsx`] |
| Deriving emphasis from `TargetEvidence`. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`] | Expanding `mustEmphasize` directly from raw keyword overlap. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`] | Raw overlap cannot distinguish explicit evidence from bridge-only evidence, which is the main gap this phase is fixing. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/evidence-classifier.ts`] |
| Reusing `shapeTargetJobDescription()` and semantic normalization for coverage heuristics. [VERIFIED: `src/lib/agent/job-targeting-retry.ts`; `src/lib/agent/job-targeting/semantic-normalization.ts`] | A second LLM pass to label core requirements. [ASSUMED] | The current stack already has deterministic helpers and one LLM evidence pass; a second pass would raise latency and make the gate less stable. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`; `src/lib/agent/job-targeting-retry.ts`] |

**Installation:** no package additions recommended. [VERIFIED: `package.json`]

**Version verification:** `next`, `zod`, and `vitest` versions above were checked against the current npm registry on 2026-04-27. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── lib/agent/job-targeting/safe-targeting-emphasis.ts      # new derived emphasis builder
├── lib/agent/job-targeting/core-requirement-coverage.ts    # new deterministic vacancy heuristic
├── lib/agent/job-targeting/low-fit-warning-gate.ts         # new plan-level gate calculator
├── lib/agent/tools/build-targeting-plan.ts                 # wire evidence -> emphasis -> gate
├── lib/agent/job-targeting-pipeline.ts                     # promote warnings and stop auto-success
├── lib/agent/job-targeting/recoverable-validation.ts       # low-fit modal copy and recoverable helpers
├── lib/agent/tools/validate-rewrite.ts                     # keep issue typing consistent for promotion
└── types/{agent,trace}.ts                                  # add optional contracts for emphasis/gate/trace
```

This structure is recommended because it keeps all new logic inside the existing `job_targeting` stack and avoids creating a second orchestration path. [ASSUMED]

### Pattern 1: Derive `safeTargetingEmphasis` from `TargetEvidence`, not from raw `mustEmphasize`

**What:** Add an optional `safeTargetingEmphasis` sub-object to `TargetingPlan` after `targetEvidence`, `rewritePermissions`, and `targetRolePositioning` are known. [ASSUMED]

**Why this seam is correct:** `buildTargetedRewritePlan()` is already the only allowed entry point for `TargetEvidence` and `TargetedRewritePermissions`. [VERIFIED: comments and flow in `src/lib/agent/tools/build-targeting-plan.ts`] The current `mustEmphasize` list is built earlier from keyword overlap and cannot encode evidence level or rewrite permission. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/evidence-classifier.ts`]

**Prescriptive build rule:**  
- Put `explicit`, `normalized_alias`, and `technical_equivalent` signals into `safeDirectEmphasis`. [VERIFIED: `resolveRewritePermission()` and `resolveValidationSeverity()` in `src/lib/agent/job-targeting/evidence-classifier.ts`]  
- Put `strong_contextual_inference` and `semantic_bridge_only` into `cautiousBridgeEmphasis` with grounded wording taken from `matchedResumeTerms` and `supportingResumeSpans`. [VERIFIED: `TargetEvidence` shape in `src/types/agent.ts`; `buildBridgeClaimInstruction()` in `src/lib/agent/job-targeting/rewrite-permissions.ts`]  
- Mirror `must_not_claim` into `forbiddenDirectClaims`. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`; `src/lib/agent/job-targeting/rewrite-permissions.ts`]  
- Do not change `skillsSurfaceAllowed`; that surface must stay limited to direct and normalized claims. [VERIFIED: `isAllowedOnSkillsSurface()` and `buildTargetedRewritePermissions()` in `src/lib/agent/job-targeting/rewrite-permissions.ts`; `sanitizeJobTargetedSkills()` in `src/lib/agent/tools/rewrite-resume-full.ts`]

**Effect on prompting:** `rewrite-resume-full.ts` should prefer `safeDirectEmphasis` over `mustEmphasize` for summary, experience, and skills ordering, and should render `cautiousBridgeEmphasis` only in the permission instructions, never as extra direct skills. [ASSUMED]

### Pattern 2: Compute `coreRequirementCoverage` from the vacancy text with one deterministic heuristic

**What:** Add a deterministic helper that extracts requirement candidates from the shaped vacancy text, labels them `core`, `secondary`, or `differential`, and then evaluates support by joining those candidates against `TargetEvidence`. [ASSUMED]

**Why this seam is correct:** the repo already has the right deterministic building blocks: vacancy shaping, section-heading detection, semantic token normalization, lexical variants, and plan-level focus extraction. [VERIFIED: `src/lib/agent/job-targeting-retry.ts`; `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/semantic-normalization.ts`]

**Prescriptive heuristic:**  
- Start from `shapeTargetJobDescription(targetJobDescription).content`. [VERIFIED: `src/lib/agent/job-targeting-retry.ts`]  
- Split by lines and separators, then normalize with `buildCanonicalSignal()`. [VERIFIED: `src/lib/agent/job-targeting/semantic-normalization.ts`]  
- Mark a candidate as `core` when any of these are true: it appears in the extracted target role, it appears under a required-section heading (`Requisitos`, `Responsibilities`, `Obrigatório`, `Requirements`, `Qualificações`), it is repeated, it carries “experiência com”, “domínio”, “professional with”, or years-of-experience wording, or it looks like the main stack in a short requirement line. [VERIFIED: existing heading regexes and role signal regexes in `src/lib/agent/tools/build-targeting-plan.ts`; requirement guidance in `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`]  
- Mark a candidate as `differential` when it is inside `Desejável`, `Diferenciais`, `Nice to have`, or equivalent sections. [VERIFIED: section-heading vocabulary in `src/lib/agent/tools/build-targeting-plan.ts`; requirement guidance in `110-PRD.md`]  
- Treat the rest as `secondary`. [ASSUMED]

**Prescriptive support rule:**  
- `supported` means the matched `TargetEvidence` is `explicit`, `normalized_alias`, or `technical_equivalent`. [VERIFIED: `EvidenceLevel` in `src/types/agent.ts`; `resolveRewritePermission()` in `src/lib/agent/job-targeting/evidence-classifier.ts`]  
- `bridge_only` means the matched `TargetEvidence` is `strong_contextual_inference` or `semantic_bridge_only`; count it as partial narrative help, not as supported core coverage. [VERIFIED: same sources above]  
- `unsupported` means `must_not_claim` / `unsupported_gap`. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`]  
- The returned `coreRequirementCoverage` should expose at least `total`, `supported`, `unsupported`, and `unsupportedSignals`. [VERIFIED: target contract in `110-PRD.md`]

### Pattern 3: Evaluate `lowFitWarningGate` at plan time, enforce it at validation time

**What:** Compute a plan-level `lowFitWarningGate` during `buildTargetedRewritePlan()`, persist it in `targetingPlan`, log it in `agent.job_targeting.plan_built`, and use it later inside `runJobTargetingPipeline()` after `validateRewrite()` but before the pipeline returns success or persists the final version. [ASSUMED]

**Why this split is correct:** the plan-time data already contains `gapAnalysis`, `careerFitEvaluation`, `targetRolePositioning`, `targetEvidence`, and the new `coreRequirementCoverage`; the runtime enforcement step additionally needs the actual validation warnings to decide what to promote. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/tools/validate-rewrite.ts`]

**Use current proven thresholds first:**  
- Reuse `matchScore < 45` as the “very low match” floor. [VERIFIED: `deriveTargetFitAssessment()` in `src/lib/agent/target-fit.ts`; `evaluateCareerFitRisk()` in `src/lib/agent/profile-review.ts`]  
- Reuse `unsupportedGapRatio >= 0.5` as the “high unsupported” floor because the current target-role positioning already treats that ratio as `must_not_claim_target_role`. [VERIFIED: `buildTargetRolePositioning()` in `src/lib/agent/job-targeting/recoverable-validation.ts`]  
- Reuse `targetRolePositioning.permission === 'must_not_claim_target_role'` as one gating signal. [VERIFIED: `src/lib/agent/job-targeting/recoverable-validation.ts`]  
- Add one explicit evidence floor such as `explicitEvidenceRatio < 0.2` only as a new Phase 110 threshold. [ASSUMED]

**Recommended trigger combinations:**  
- `high_risk_off_target`: `careerFitEvaluation.riskLevel === 'high'` and `matchScore < 45`. [VERIFIED: `src/lib/agent/profile-review.ts`; `src/lib/agent/target-fit.ts`]  
- `too_many_unsupported_core_requirements`: `coreRequirementCoverage.unsupported > coreRequirementCoverage.supported` for `core` only. [ASSUMED]  
- `target_role_not_supported`: `targetRolePositioning.permission === 'must_not_claim_target_role'` and explicit evidence remains weak. [VERIFIED: `src/lib/agent/job-targeting/recoverable-validation.ts`; ASSUMED for “explicit evidence remains weak” threshold]  
- `explicit_evidence_too_low`: explicit evidence count is near zero while unsupported core gaps dominate. [ASSUMED]  
- `very_low_match_score`: safety fallback when the role fit is structurally weak even if the rewrite stayed conservative. [ASSUMED]

### Pattern 4: Promote only fit-related warnings, and only when the gate is active

**What:** After `validateRewrite()` returns, inspect `softWarnings` and promote only fit-related warnings into `hardIssues` when `targetingPlan.lowFitWarningGate.triggered === true`. [ASSUMED]

**Why this seam is correct:** the current pipeline already creates `blockedDraft`, `recoverableValidationBlock`, and the final success/failure split from the validation result. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`] The safest Phase 110 change is to modify the validation result before that branch runs, not after persistence or in the UI. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`]

**Promote these issue families only:** `target_role_overclaim`, `summary_skill_without_evidence`, and `unsupported_claim`. [VERIFIED: `110-PRD.md`] The current code already enriches or emits those issue types in the summary/targeting path. [VERIFIED: `src/lib/agent/tools/validate-rewrite.ts`; `src/lib/agent/job-targeting/validation-policy.ts`]

**Recommended implementation detail:** add a pipeline-local helper such as `applyLowFitValidationPromotion(validation, lowFitGate)` that returns a cloned `RewriteValidationResult` plus `promotedWarnings` metadata for trace/logging. [ASSUMED]

**Important edge case:** if the gate triggers and there are no promotable soft warnings, synthesize one recoverable high issue anchored on `targetRolePositioning` or unsupported core coverage so the off-target case still stops automatic success. [ASSUMED] This is required because the PRD expects clearly off-target vacancies to stop even if the rewrite did not accidentally overstate a specific line strongly enough to create a warning on its own. [VERIFIED: `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md`]

### Pattern 5: Reuse the current recoverable product flow as-is

**What:** Keep the current `422` normalization, current `recoverableValidationBlock` payload, current modal components, current credit-aware CTA resolution, and current override route semantics. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`; `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`; `src/lib/dashboard/validation-override-cta.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`]

**Why this seam is correct:** Phase 109 is already implemented in the real codebase, not just in docs. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`; `src/app/api/profile/smart-generation/route.test.ts`; `src/components/resume/user-data-page.test.tsx`] The low-fit gate should only decide to enter that path earlier and with different copy. [VERIFIED: same sources plus `110-PRD.md`]

**Prescriptive UI/copy rule:** keep modal rendering client-side exactly as it is now and add the new low-fit explanatory copy in `buildUserFacingValidationBlockModal()` or a small sibling helper in `recoverable-validation.ts`. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`; `src/lib/agent/job-targeting/recoverable-validation.ts`] Do not duplicate copy assembly in both UIs. [VERIFIED: both UIs already read the same payload fields from `recoverableValidationBlock.modal`]

### Anti-Patterns to Avoid

- Do not make bridge-only evidence eligible for `skillsSurfaceAllowed`. [VERIFIED: `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`]
- Do not place the low-fit stop in the UI, because the server would still have generated artifacts already by then. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`]
- Do not create a new billing flow for low-fit confirmation; reuse the existing override route. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`; `110-PRD.md`]
- Do not hardcode Java, BI, RH, or any other role-family-specific allow/deny lists in product logic. [VERIFIED: `110-CONTEXT.md`; `110-PRD.md`]
- Do not classify all vacancy matches equally; peripheral matches must not hide missing core stack. [VERIFIED: `110-PRD.md`; `src/lib/agent/tools/build-targeting-plan.ts`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe emphasis | A new independent “fit” taxonomy unrelated to `TargetEvidence`. [ASSUMED] | A derived `safeTargetingEmphasis` layer built from `TargetEvidence`. [ASSUMED] | The evidence classifier already encodes explicit, normalized, bridge-only, and forbidden levels. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`] |
| Core coverage | A second vacancy parser or domain-specific stack dictionary. [ASSUMED] | One deterministic heuristic over `shapeTargetJobDescription()` plus semantic normalization and current heading detection. [VERIFIED: `src/lib/agent/job-targeting-retry.ts`; `src/lib/agent/job-targeting/semantic-normalization.ts`; `src/lib/agent/tools/build-targeting-plan.ts`] | The repo already has the parsing primitives and the phase explicitly forbids domain-specific hardcode. [VERIFIED: `110-CONTEXT.md`; `110-PRD.md`] |
| Low-fit enforcement | A separate off-target route, modal route, or billing path. [ASSUMED] | The existing pipeline block plus `recoverableValidationBlock` plus override route. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`] | It already preserves persistence-before-billing and credit-aware CTA behavior. [VERIFIED: same sources] |
| Warning promotion | A broad rule that turns every medium warning into a hard block. [ASSUMED] | Promote only fit-related warnings when `lowFitWarningGate.triggered` is true. [VERIFIED: `110-PRD.md`] | Global promotion would regress the safe partial-fit cases the phase is trying to preserve. [VERIFIED: `110-PRD.md`; `src/lib/agent/tools/validate-rewrite.ts`] |

**Key insight:** the phase does not need a second targeting architecture; it needs better derived plan metadata and one earlier decision point inside the existing pipeline. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting-pipeline.ts`; `110-CONTEXT.md`]

## Common Pitfalls

### Pitfall 1: Deriving emphasis from `mustEmphasize` alone

**What goes wrong:** explicit evidence and bridge-only evidence receive the same prompt weight. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`]  
**Why it happens:** `mustEmphasize` is built before evidence classification and only knows text overlap. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`; `src/lib/agent/job-targeting/evidence-classifier.ts`]  
**How to avoid:** derive a separate emphasis layer after `targetEvidence` exists and keep `skillsSurfaceAllowed` unchanged. [VERIFIED: `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`]  
**Warning signs:** partial-fit scenarios still undersell `Power Automate`, `APIs REST`, `HTML`, `CSS`, and integration evidence even though they are explicit in the original CV. [VERIFIED: phase fixtures in `110-PRD.md`]

### Pitfall 2: Enforcing low-fit after persistence or after artifact handoff

**What goes wrong:** the server may already have created a version or attempted billable generation before the gate fires. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`]  
**Why it happens:** `generate_file` is dispatched only after pipeline success, so any gate outside the pipeline is already too late. [VERIFIED: `src/lib/routes/smart-generation/decision.ts`; `src/lib/routes/smart-generation/dispatch.ts`]  
**How to avoid:** enforce the recoverable low-fit block inside `runJobTargetingPipeline()` before the success return path and before `createCvVersion()` for automatic success. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`]  
**Warning signs:** `agent.job_targeting.completed` appears in logs for a case that should have shown the modal. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`]

### Pitfall 3: Letting peripheral matches count as core coverage

**What goes wrong:** `Git`, `SQL`, `APIs REST`, and generic integrations can make a distant backend vacancy look safer than it is. [VERIFIED: examples and requirement text in `110-PRD.md`]  
**Why it happens:** raw keyword overlap treats every signal equally. [VERIFIED: current `mustEmphasize` construction in `src/lib/agent/tools/build-targeting-plan.ts`]  
**How to avoid:** compute `coreRequirementCoverage` from role title, required sections, years-of-experience phrasing, repetition, and central-capability wording. [VERIFIED: `110-PRD.md`; existing heading/role helpers in `src/lib/agent/tools/build-targeting-plan.ts`]  
**Warning signs:** `targetRolePositioning.permission` is still `must_not_claim_target_role`, but the pipeline reaches automatic success. [VERIFIED: `src/lib/agent/job-targeting/recoverable-validation.ts`; `src/lib/agent/job-targeting-pipeline.ts`]

### Pitfall 4: Promoting all medium warnings all the time

**What goes wrong:** valid adjacent cases become over-blocked again, undoing the Phase 106 and 108 improvements. [VERIFIED: historical direction in `.planning/ROADMAP.md`; current soft-warning model in `src/lib/agent/tools/validate-rewrite.ts`]  
**Why it happens:** fit-related warnings and generic editorial warnings are mixed in one `softWarnings` array. [VERIFIED: `src/lib/agent/tools/validate-rewrite.ts`]  
**How to avoid:** promote only `target_role_overclaim`, `summary_skill_without_evidence`, and `unsupported_claim`, and only when the low-fit gate is already active. [VERIFIED: `110-PRD.md`]  
**Warning signs:** Test H starts failing because partial-fit vacancies block even when explicit evidence is strong. [VERIFIED: `110-PRD.md`]

### Pitfall 5: Duplicating modal copy logic in both UIs

**What goes wrong:** profile and workspace modals drift in copy, CTA, or pricing behavior. [VERIFIED: both UIs render shared payload fields from `recoverableValidationBlock.modal`]  
**Why it happens:** copy is assembled separately instead of server-side. [VERIFIED: current shared payload flow in `src/lib/agent/job-targeting/recoverable-validation.ts`; `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`]  
**How to avoid:** keep human copy generation server-side and keep both UIs dumb renderers of the same payload. [VERIFIED: current architecture above]  
**Warning signs:** one UI shows `Gerar mesmo assim (1 crédito)` while the other falls back to generic validation text for the same session state. [VERIFIED: existing dual UI seams above]

## Code Examples

Verified insert points from the current repo:

### Build the plan after evidence classification

```ts
// Source: src/lib/agent/tools/build-targeting-plan.ts
const targetEvidence = await classifyTargetEvidence({
  cvState: params.cvState,
  targetingPlan: basePlan,
  gapAnalysis: params.gapAnalysis,
  userId: params.userId,
  sessionId: params.sessionId,
})
const rewritePermissions = buildTargetedRewritePermissions(targetEvidence)

return {
  ...basePlan,
  targetEvidence,
  rewritePermissions,
  targetRolePositioning: buildTargetRolePositioning({ ... }),
}
```

This is the correct place to add `safeTargetingEmphasis`, `coreRequirementCoverage`, and the plan-level `lowFitWarningGate`. [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`]

### Stop automatic success before persistence

```ts
// Source: src/lib/agent/job-targeting-pipeline.ts
const validation = validateRewrite(session.cvState, finalizedOptimizedCvState, {
  mode: 'job_targeting',
  targetJobDescription,
  gapAnalysis: gapAnalysisResult,
  targetingPlan,
})

const blockedDraft = validation.blocked && optimizedChanged && isRecoverableValidationBlock(validation)
  ? createBlockedTargetedRewriteDraft({ ... })
  : undefined

if (validation.blocked) {
  return {
    success: false,
    validation,
    recoverableBlock: recoverableValidationBlock,
  }
}

await createCvVersion({ sessionId: session.id, snapshot: validatedOptimizedCvState, source: 'job-targeting' })
```

Low-fit promotion must happen between `validateRewrite(...)` and `createBlockedTargetedRewriteDraft(...)`. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`]

### Reuse the existing recoverable route and artifact path

```ts
// Source: src/app/api/session/[id]/job-targeting/override/route.ts
await persistAgentState(session, consumedDraftState)
await createCvVersion({
  sessionId: session.id,
  snapshot: blockedDraft.optimizedCvState,
  source: 'job-targeting',
})

const generationResult = await dispatchToolWithContext(
  'generate_file',
  {
    cv_state: blockedDraft.optimizedCvState,
    idempotency_key: `profile-target-override:${session.id}:${blockedDraft.id}`,
  },
  generationSession,
)
```

This route already preserves the Phase 109 persistence-before-billing contract and should remain the only low-fit confirmation path. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`]

## Verification Matrix

| PRD Scenario | Expected Result | Primary Test Files | Suggested Command |
|--------------|-----------------|--------------------|-------------------|
| Test A: Java off-target triggers low-fit warning | `lowFitGate.triggered = true`, recoverable block returned, no auto artifact, no auto credit. [VERIFIED: `110-PRD.md`] | `src/lib/agent/tools/pipeline.test.ts`, `src/app/api/profile/smart-generation/route.test.ts` [VERIFIED: file inventory] | `npx vitest run src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts` |
| Test B: Soft warnings are promoted under low-fit | promoted warnings recorded, `validation.blocked = true`, recoverable block returned. [VERIFIED: `110-PRD.md`] | `src/lib/agent/tools/pipeline.test.ts`, `src/lib/agent/tools/validate-rewrite.test.ts` [VERIFIED: file inventory] | `npx vitest run src/lib/agent/tools/pipeline.test.ts src/lib/agent/tools/validate-rewrite.test.ts` |
| Test C: Forbidden target skills stay out of skills surface | unsupported core stack does not appear in `skills`. [VERIFIED: `110-PRD.md`] | `src/lib/agent/job-targeting/validation-policy.test.ts`, `src/lib/agent/tools/validate-rewrite.test.ts` [VERIFIED: file inventory] | `npx vitest run src/lib/agent/job-targeting/validation-policy.test.ts src/lib/agent/tools/validate-rewrite.test.ts` |
| Test D: Peripheral similarities do not unlock the target role | `Git`/`SQL`/`APIs REST` may remain claimable, but target role remains not directly claimable and low-fit still triggers. [VERIFIED: `110-PRD.md`] | `src/lib/agent/tools/build-targeting-plan.test.ts`, `src/lib/agent/tools/pipeline.test.ts` [VERIFIED: file inventory] | `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/pipeline.test.ts` |
| Test E: Low-fit modal uses human framing | human PT-BR copy, no internal vocabulary, same modal shell. [VERIFIED: `110-PRD.md`] | `src/app/api/profile/smart-generation/route.test.ts`, `src/components/resume/user-data-page.test.tsx`, `src/components/dashboard/resume-workspace.test.tsx` [VERIFIED: file inventory] | `npx vitest run src/app/api/profile/smart-generation/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx` |
| Test F: Override still works with credit | same CTA, same override route, success persists and charges once. [VERIFIED: `110-PRD.md`] | `src/app/api/session/[id]/job-targeting/override/route.test.ts`, `src/components/resume/user-data-page.test.tsx`, `src/components/dashboard/resume-workspace.test.tsx` [VERIFIED: file inventory] | `npx vitest run src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx` |
| Test G: No credit opens pricing | CTA switches to `Adicionar créditos`, no override call, token remains reusable after refresh. [VERIFIED: `110-PRD.md`] | `src/components/resume/user-data-page.test.tsx`, `src/components/dashboard/resume-workspace.test.tsx`, `src/app/api/session/[id]/job-targeting/override/route.test.ts` [VERIFIED: file inventory] | `npx vitest run src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx src/app/api/session/[id]/job-targeting/override/route.test.ts` |
| Test H: Partially adherent vacancy does not block when safe | explicit evidence is emphasized better, bridges stay cautious, unsupported direct claims stay forbidden. [VERIFIED: `110-PRD.md`] | `src/lib/agent/tools/build-targeting-plan.test.ts`, `src/lib/agent/tools/pipeline.test.ts`, `src/lib/agent/job-targeting/validation-policy.test.ts` [VERIFIED: file inventory] | `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/pipeline.test.ts src/lib/agent/job-targeting/validation-policy.test.ts` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Targeted rewrite emphasis depended mainly on raw overlap (`mustEmphasize`, `focusKeywords`). [VERIFIED: `src/lib/agent/tools/build-targeting-plan.ts`] | Phase 108 already introduced `TargetEvidence` and permission-aware validation, but prompt emphasis still does not derive from that richer evidence contract. [VERIFIED: `src/lib/agent/job-targeting/evidence-classifier.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`] | Phase 108 research and code landed before this phase. [VERIFIED: `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md`; `src/lib/agent/job-targeting/evidence-classifier.ts`] | Phase 110 should finish that design by deriving prompt emphasis from the evidence contract already in place. [ASSUMED] |
| Recoverable blocking existed only as Phase 109 product behavior for factual validation failures. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`] | The real codebase now already ships modal payloads, credit-aware CTAs, and an override route. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`; `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`; `src/app/api/session/[id]/job-targeting/override/route.ts`] | Implemented by 2026-04-27. [VERIFIED: current code and tests dated in phase artifacts] | Phase 110 should reuse this product path instead of redesigning recoverable generation. [VERIFIED: `110-PRD.md`; current code above] |
| Career fit already exposes graduated `low` / `medium` / `high` risk and role-family distance. [VERIFIED: `src/lib/agent/profile-review.ts`] | The automatic target pipeline still does not convert those signals into a pre-success low-fit gate. [VERIFIED: repo grep for `lowFitWarningGate|coreRequirementCoverage|promotedWarnings` on 2026-04-27; `src/types/trace.ts`; `src/lib/agent/job-targeting-pipeline.ts`] | This gap is current as of 2026-04-27. [VERIFIED: same repo grep] | Phase 110 should connect existing fit signals to the already-shipped recoverable block path. [VERIFIED: `src/lib/agent/profile-review.ts`; `src/lib/agent/job-targeting-pipeline.ts`] |

**Deprecated/outdated:**  
- Adding a new recoverable route contract is outdated for this phase because the current code already ships `422` plus `recoverableValidationBlock`. [VERIFIED: `src/lib/routes/smart-generation/result-normalization.ts`; `src/app/api/profile/smart-generation/route.test.ts`]  
- Treating every signal in the vacancy as equally important is outdated once Phase 110 requires core requirement coverage. [VERIFIED: `110-PRD.md`]  

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New helpers should be split into `safe-targeting-emphasis.ts`, `core-requirement-coverage.ts`, and `low-fit-warning-gate.ts` rather than staying inline. [ASSUMED] | Architecture Patterns | If wrong, the planner may over-split a change that could stay co-located in `build-targeting-plan.ts`. |
| A2 | `safeTargetingEmphasis` should live under `TargetingPlan` as an optional sub-object. [ASSUMED] | Architecture Patterns | If wrong, the implementation may prefer a sibling contract or transient local object. |
| A3 | The new explicit-evidence floor should start around an `explicitEvidenceRatio < 0.2` threshold. [ASSUMED] | Architecture Patterns | If wrong, the gate may over-block or under-block until thresholds are recalibrated. |
| A4 | When the gate triggers without promotable warnings, the pipeline should synthesize one recoverable high issue by reusing an already-allowed recoverable `issueType` from Phase 109, so override semantics remain valid. [RESOLVED: use `target_role_overclaim` when `targetRolePositioning.permission === 'must_not_claim_target_role'`; otherwise synthesize `unsupported_claim` tied to unsupported core coverage.] | Architecture Patterns | This keeps the fallback compatible with `RECOVERABLE_VALIDATION_ISSUE_TYPES` and with the existing override route revalidation. [VERIFIED: `src/lib/agent/job-targeting/recoverable-validation.ts`; `src/app/api/session/[id]/job-targeting/override/route.ts`] |
| A5 | Adding optional promotion metadata to both trace and `rewriteValidation` is the lowest-friction way to make warning promotion observable and testable while keeping current UI consumers unchanged. [RESOLVED] | Verification / Observability | UI code already ignores unknown fields on `rewriteValidation`, so optional metadata can be carried server-side without changing existing rendering. [VERIFIED: `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`] |

## Open Questions (RESOLVED)

1. **Should promotion metadata live only in trace/logs, or also in `rewriteValidation`?**  
What we know: the PRD requires promoted warnings to be recorded, and the current public response already returns `rewriteValidation`. [VERIFIED: `110-PRD.md`; `src/lib/routes/smart-generation/result-normalization.ts`]  
What's unclear: whether product or downstream tooling needs that metadata in the client payload, or whether trace/log coverage is enough. [VERIFIED: current UI code reads `rewriteValidation` and `recoverableValidationBlock`, but does not read promotion metadata today.]  
Recommendation: make trace mandatory, keep validation metadata optional, and avoid a required public contract change unless tests or UX need it. [ASSUMED]

Resolution: keep promotion metadata in both places, but optional.
- `trace.validation.promotedWarnings` remains the canonical observability record. [VERIFIED: `110-PRD.md`; `src/types/trace.ts`]
- `rewriteValidation.promotedWarnings` may be attached as an optional server-side/testing field so route and pipeline tests can assert the promotion without parsing logs. Existing UI consumers do not need to render it. [VERIFIED: current UI code reads `issues`, `hardIssues`, `softWarnings`, and `recoverableValidationBlock`, but ignores unknown fields today.]

2. **Should core coverage count `strong_contextual_inference` as partial or unsupported for `core`?**  
What we know: the PRD wants adjacent evidence to help wording, but not to mask missing main stack coverage. [VERIFIED: `110-PRD.md`]  
What's unclear: whether “partial” should reduce severity numerically or only stay visible for copy. [VERIFIED: no existing `coreRequirementCoverage` contract exists in the repo today.]  
Recommendation: count it as narrative help, not as supported core coverage, and expose it only in rationale/copy. [ASSUMED]

Resolution: treat `strong_contextual_inference` as narrative help, not as supported core coverage.
- For `coreRequirementCoverage.supported`, count only `explicit`, `normalized_alias`, and `technical_equivalent`. [VERIFIED: earlier recommended support rule in this research]
- Treat `strong_contextual_inference` and `semantic_bridge_only` as useful for copy/bridges, but insufficient to cover core stack claims automatically. [VERIFIED: `110-PRD.md`; `src/lib/agent/job-targeting/evidence-classifier.ts`]
- This keeps partial-fit competitiveness useful while preventing peripheral contextual similarity from masking central unsupported requirements in off-target roles. [VERIFIED: `110-PRD.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Typecheck and Vitest execution. [VERIFIED: `package.json`] | Yes. [VERIFIED: `node --version`] | `v24.14.0`. [VERIFIED: `node --version`] | None needed. |
| npm | Registry/version checks and script execution. [VERIFIED: `package.json`] | Yes. [VERIFIED: `npm --version`] | `11.9.0`. [VERIFIED: `npm --version`] | None needed. |
| Vitest CLI | Focused seam verification. [VERIFIED: `package.json`; `vitest.config.ts`] | Yes. [VERIFIED: `npx vitest --version`] | `1.6.1`. [VERIFIED: `npx vitest --version`] | None needed. |

**Missing dependencies with no fallback:** none for planning or focused regression work. [VERIFIED: environment probes above]

**Missing dependencies with fallback:** none identified; this phase is code-and-test only. [VERIFIED: no external service dependency is required by the PRD or current seams.]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` `1.6.1`. [VERIFIED: `npx vitest --version`; `vitest.config.ts`] |
| Config file | `vitest.config.ts`. [VERIFIED: `vitest.config.ts`] |
| Quick run command | `npm run typecheck`. [VERIFIED: `package.json`] |
| Full suite command | `npm test`. [VERIFIED: `package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| `JOB-TARGET-EMPHASIS-01` | Safe emphasis improves partial-fit competitiveness without weakening skill safety. [VERIFIED: `110-PRD.md`] | unit/integration | `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/job-targeting/validation-policy.test.ts src/lib/agent/tools/pipeline.test.ts` | Yes. [VERIFIED: file inventory] |
| `JOB-TARGET-CORE-COVERAGE-01` | Core coverage is derived generically from vacancy text and used by the gate. [VERIFIED: `110-PRD.md`] | unit | `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/pipeline.test.ts` | Partial; new assertions required. [VERIFIED: existing files; ASSUMED for new assertions] |
| `JOB-TARGET-LOW-FIT-01` | Low-fit cases stop before automatic final persistence and before `generate_file`. [VERIFIED: `110-PRD.md`] | integration/route | `npx vitest run src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts` | Yes. [VERIFIED: file inventory] |
| `JOB-TARGET-LOW-FIT-OBS-01` | Trace and logs expose gate inputs, reason, and warning promotion. [VERIFIED: `110-PRD.md`] | unit | `npx vitest run src/lib/agent/tools/pipeline.test.ts` | Yes. [VERIFIED: existing pipeline trace assertions in `src/lib/agent/tools/pipeline.test.ts`] |
| `JOB-TARGET-LOW-FIT-TEST-01` | UI, pricing CTA, and override reuse remain correct. [VERIFIED: `110-PRD.md`] | route/component | `npx vitest run src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx` | Yes. [VERIFIED: file inventory] |

### Sampling Rate

- **Per task commit:** `npm run typecheck`. [VERIFIED: `package.json`]
- **Per wave merge:** `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/job-targeting/validation-policy.test.ts src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx`. [VERIFIED: test file inventory]
- **Phase gate:** `npm run typecheck && npm run audit:copy-regression && npm test -- src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/job-targeting/validation-policy.test.ts src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx`. [VERIFIED: `package.json`; test file inventory]

### Wave 0 Gaps

- [ ] Add new assertions for `safeTargetingEmphasis`, `coreRequirementCoverage`, and plan-level `lowFitWarningGate` in `src/lib/agent/tools/build-targeting-plan.test.ts`. [ASSUMED]
- [ ] Add trace assertions for `trace.lowFitGate` and `trace.validation.promotedWarnings` in `src/lib/agent/tools/pipeline.test.ts`. [ASSUMED]
- [ ] Add modal-copy assertions that low-fit framing stays human and PT-BR-only in both `user-data-page.test.tsx` and `resume-workspace.test.tsx`. [ASSUMED]
- [ ] Extend `route.test.ts` coverage to prove `recoverableValidationBlock` is still returned as `422` for low-fit recoverable blocks. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes. [VERIFIED: current override route resolves `getCurrentAppUser()` in `src/app/api/session/[id]/job-targeting/override/route.ts`] | Keep auth exactly where it is and do not move low-fit confirmation into an unauthenticated client path. [VERIFIED: same source] |
| V3 Session Management | No new auth/session primitive is needed. [VERIFIED: Phase 110 only changes targeting logic and recoverable gating.] | Keep session bundle semantics unchanged. [VERIFIED: `src/types/agent.ts`; `CLAUDE.md`] |
| V4 Access Control | Yes. [VERIFIED: override route checks session ownership and token match in `src/app/api/session/[id]/job-targeting/override/route.ts`] | Reuse the existing override route and do not create a new bypass path for low-fit confirmation. [VERIFIED: same source] |
| V5 Input Validation | Yes. [VERIFIED: project convention in `CLAUDE.md`; current override body uses `zod`] | Keep route inputs typed with `zod`; keep new gate inputs derived server-side from trusted session and vacancy state. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`; `CLAUDE.md`] |
| V6 Cryptography | No new cryptography is required. [VERIFIED: existing override flow uses opaque draft tokens from server state in `src/app/api/session/[id]/job-targeting/override/route.ts`] | Reuse the existing opaque token flow. [VERIFIED: same source] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Off-target low-fit logic bypassed by client-only gating. [VERIFIED: automatic artifact dispatch happens server-side in `src/lib/routes/smart-generation/decision.ts`] | Tampering | Enforce the stop inside `runJobTargetingPipeline()` before pipeline success. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/routes/smart-generation/decision.ts`] |
| Credit charging on a new confirmation path outside the override route. [VERIFIED: `110-PRD.md`] | Tampering / Repudiation | Reuse the existing override route and its `generate_file` dispatch path. [VERIFIED: `src/app/api/session/[id]/job-targeting/override/route.ts`] |
| Bridge-only skills becoming direct skills. [VERIFIED: `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/agent/tools/rewrite-resume-full.ts`] | Elevation of Privilege | Keep `skillsSurfaceAllowed` limited to direct and normalized claims. [VERIFIED: same sources] |
| Internal/debug vocabulary leaking to end users through low-fit copy. [VERIFIED: copy requirements in `110-PRD.md`] | Information Disclosure | Keep modal copy server-built and test it in both UI surfaces. [VERIFIED: `src/lib/agent/job-targeting/recoverable-validation.ts`; `src/components/resume/user-data-page.tsx`; `src/components/dashboard/resume-workspace.tsx`] |

## Sources

### Primary (HIGH confidence)

- `CLAUDE.md` - project constraints, state ownership, logging, and brownfield rules.
- `.planning/config.json` - validation and security enforcement flags.
- `.planning/ROADMAP.md` - Phase 110 requirement IDs and success criteria.
- `.planning/REQUIREMENTS.md` - milestone-level active requirements and testing context.
- `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-PRD.md` - phase objective, gate contract, scenarios, and copy constraints.
- `.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md` - locked decisions and deferred scope.
- `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-RESEARCH.md` - evidence-layer intent and canonical plan contract.
- `.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-RESEARCH.md` - prior intent for recoverable targeting behavior.
- `src/lib/agent/tools/build-targeting-plan.ts` - current targeting-plan assembly and pre-evidence emphasis behavior.
- `src/lib/agent/job-targeting/evidence-classifier.ts` - evidence levels, permissions, and classification flow.
- `src/lib/agent/job-targeting/rewrite-permissions.ts` - current direct/bridge/forbidden/skills buckets.
- `src/lib/agent/job-targeting/validation-policy.ts` - permission-aware targeted validation.
- `src/lib/agent/job-targeting/recoverable-validation.ts` - current role positioning, modal payload, and recoverable helpers.
- `src/lib/agent/job-targeting-pipeline.ts` - current rewrite/validate/recoverable/persist flow and trace/log points.
- `src/lib/agent/tools/rewrite-resume-full.ts` - current prompt assembly and skills-surface enforcement.
- `src/lib/agent/tools/validate-rewrite.ts` - shared validation result and issue typing.
- `src/lib/agent/target-fit.ts` - current weak/partial/strong thresholds.
- `src/lib/agent/profile-review.ts` - current risk-level, family-distance, and confirmation logic.
- `src/lib/agent/job-targeting/semantic-normalization.ts` - canonical signal and lexical alias helpers.
- `src/lib/agent/job-targeting-retry.ts` - vacancy shaping and current line prioritization.
- `src/lib/routes/smart-generation/decision.ts` - pipeline-to-artifact orchestration order.
- `src/lib/routes/smart-generation/dispatch.ts` - `generate_file` handoff.
- `src/lib/routes/smart-generation/result-normalization.ts` - current `422` recoverable normalization.
- `src/app/api/session/[id]/job-targeting/override/route.ts` - existing override persistence and billing-safe generation path.
- `src/components/resume/user-data-page.tsx` - profile modal reuse and CTA wiring.
- `src/components/dashboard/resume-workspace.tsx` - workspace modal reuse and CTA wiring.
- `src/lib/dashboard/validation-override-cta.ts` - shared credit-aware CTA behavior.
- `src/types/agent.ts` - current targeting, validation, and recoverable block contracts.
- `src/types/trace.ts` - current trace contract.
- `src/app/api/profile/smart-generation/route.test.ts` - current recoverable `422` route behavior.
- `src/app/api/session/[id]/job-targeting/override/route.test.ts` - current override-route seam.
- `src/lib/agent/tools/build-targeting-plan.test.ts` - current plan-level assertions.
- `src/lib/agent/tools/pipeline.test.ts` - current pipeline trace and validation assertions.
- `src/lib/agent/tools/validate-rewrite.test.ts` - current targeted validation assertions.
- `src/lib/agent/job-targeting/validation-policy.test.ts` - current targeted permission regression.
- `src/components/resume/user-data-page.test.tsx` - current profile modal and CTA behavior.
- `src/components/dashboard/resume-workspace.test.tsx` - current workspace modal and CTA behavior.
- `package.json` - scripts and locked dependency versions.
- npm registry - current `next`, `zod`, and `vitest` versions.

### Secondary (MEDIUM confidence)

- None.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**  
- Standard stack: HIGH - no new external dependency selection is needed and the existing route/test stack is explicit. [VERIFIED: `package.json`; current route/test seams above]  
- Architecture: MEDIUM - the correct insertion points are clear, but the exact helper split and explicit evidence threshold remain new implementation decisions. [VERIFIED: current seams; ASSUMED for helper split and new threshold]  
- Pitfalls: HIGH - the main regressions are directly visible in the current code order, permission model, and UI reuse contract. [VERIFIED: `src/lib/agent/job-targeting-pipeline.ts`; `src/lib/agent/job-targeting/rewrite-permissions.ts`; `src/lib/routes/smart-generation/result-normalization.ts`]  

**Research date:** 2026-04-27. [VERIFIED: current session date]  
**Valid until:** 2026-05-27. [ASSUMED]
