# Phase 108 Research

**Researched:** 2026-04-26
**Domain:** `job_targeting` semantic evidence classification for targeted rewrite only
**Confidence:** HIGH for current-state mapping, MEDIUM for the recommended implementation shape

<user_constraints>
## User Constraints (from CONTEXT.md)

[CITED: .planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-CONTEXT.md]
> ### Objective
> Add a dynamic, domain-agnostic semantic evidence layer for `job_targeting` targeted rewrite so the system can distinguish:
>
> - explicit evidence
> - normalized aliases
> - technical equivalents
> - strong contextual inferences
> - semantic bridges
> - unsupported gaps
>
> The new model must improve targeted rewrite alignment without inventing unsupported experience.
>
> ### Scope
>
> Applies only when both conditions are true:
>
> - workflow is `job_targeting`
> - the flow is performing a target-driven resume rewrite
>
> ### Explicitly Out Of Scope
>
> Do not change behavior for:
>
> - ATS enhancement
> - generic/non-targeted resume rewrite
> - highlight generation without targeted rewrite
> - generic job analysis without targeted rewrite
> - keyword-only vacancy highlighting
> - non-target chat or comparison flows
>
> ### Required Outcomes
>
> 1. Preserve existing targeting plan fields for compatibility.
> 2. Add evidence classification data that explains how each job signal is supported by the original resume.
> 3. Feed richer permission-aware guidance into the targeted rewrite prompt.
> 4. Make targeted validation aware of what is directly claimable, normalizable, bridgeable, contextual-only, or forbidden.
> 5. Keep anti-hallucination guarantees intact.
> 6. Prove isolation with focused tests for target and non-target flows.
>
> ### Non-Negotiables
>
> - Domain-agnostic architecture only.
> - No BI/data/software-only hardcoded core rules.
> - Examples from specific domains may appear in tests, not as the central product rule set.
> - Explainability data must be retained through rationale and supporting resume spans.
</user_constraints>

## Summary

- [VERIFIED: src/lib/agent/job-targeting-pipeline.ts] The `job_targeting` pipeline already has one clean planning seam before rewrite: it builds `targetingPlan` at lines 390-396, then passes that plan into `rewriteResumeFull(...)` at lines 459-467 and `validateRewrite(...)` at lines 521-526.
- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] `buildTargetingPlan()` currently produces only coarse buckets (`focusKeywords`, `mustEmphasize`, `shouldDeemphasize`, `missingButCannotInvent`) plus section strings; it does not carry typed evidence classes per target signal.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts; src/lib/agent/tools/validate-rewrite.ts] Rewrite and validation consume those coarse buckets, so the current flow can say "emphasize this" or "do not invent that", but it cannot distinguish "directly proven", "adjacent/transferable", and "missing" evidence in a reusable way.

**Primary recommendation:** add a compact `semanticEvidence` sub-contract to `TargetingPlan` inside `buildTargetingPlan()`, and make only the `job_targeting` branches of rewrite and validation consume it.

## Project Constraints (from CLAUDE.md)

- [VERIFIED: CLAUDE.md] `cvState` is canonical resume truth and `agentState` is operational context only.
- [VERIFIED: CLAUDE.md] Tools must not mutate the session directly; state changes must go through the existing persistence/patch seams.
- [VERIFIED: CLAUDE.md] Resume rewrites must never fabricate new resume content.
- [VERIFIED: CLAUDE.md] Target-derived state must stay isolated from base `cvState` and from other targets.
- [VERIFIED: CLAUDE.md] New tool or state behavior needs focused automated coverage.

## Current Behavior

### Pipeline

- [VERIFIED: src/lib/agent/job-targeting-pipeline.ts] `runJobTargetingPipeline()` requires `targetJobDescription`, persists `workflowMode: 'job_targeting'`, runs gap analysis, derives fit signals, builds `targetingPlan`, rewrites, validates, optionally generates highlights, then persists a `job-targeting` CV version.
- [VERIFIED: src/lib/agent/job-targeting-pipeline.ts] The only targeting-specific payload reused across planning, rewrite, validation, logging, and session persistence today is `targetingPlan`, plus `gapAnalysis`, `targetJobDescription`, and the derived `jobKeywords`.

### Plan Builder

- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] `extractSemanticSignals()` still uses a hardcoded phrase list plus token extraction from the job description.
- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] `mustEmphasize` is built from resume skills and experience strings that directly match the normalized JD text or the extracted focus signals.
- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] `missingButCannotInvent` is currently only `gapAnalysis.missingSkills`.
- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] `TargetingPlan` already acts as the rewrite contract owner because it stores both the targeting arrays and the per-section strategy strings.

### Rewrite

- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] `buildTargetJobSectionInstructions()` turns the targeting plan into prompt text for each section.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] `rewriteSection()` still receives only `target_keywords`, and in `job_targeting` those keywords are `targetingPlan.mustEmphasize`.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] `sanitizeJobTargetedSkills()` prevents the model from inventing skills by reordering back within the original skill universe.

### Validation

- [VERIFIED: src/lib/agent/tools/validate-rewrite.ts] Shared validation already blocks invented companies, title/company pairs, dates, certifications, and unsupported gap-filling, and warns on unsupported skills or numeric claims.
- [VERIFIED: src/lib/agent/tools/validate-rewrite.ts] The `job_targeting`-only branch currently adds only two target-specific checks: unsupported self-presentation as the target role, and newly claimed `missingButCannotInvent` items.

### Surface Exposure

- [VERIFIED: src/types/agent.ts; src/app/api/session/[id]/route.ts] `agentState.targetingPlan` is persisted and returned wholesale by the session route.
- [VERIFIED: src/lib/routes/smart-generation/result-normalization.ts; src/components/resume/user-data-page.tsx] Smart-generation success returns only soft-warning strings, while 422 validation failures return `rewriteValidation` and `targetRoleConfidence`.
- [VERIFIED: src/lib/agent/highlight-observability.ts; src/lib/routes/session-comparison/decision.ts] Highlight rendering reads only `highlightState` plus optimized CV text; it does not depend on `TargetingPlan`.

## Best Insertion Point

Add the new layer inside `buildTargetingPlan()` as a helper that runs after `focusKeywords`, `mustEmphasize`, and `missingButCannotInvent` are computed, and before `sectionStrategy` is assembled.

- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] That module already owns semantic JD extraction, resume/JD overlap detection, target-role confidence, and the final rewrite plan object.
- [VERIFIED: src/lib/agent/job-targeting-pipeline.ts] The pipeline persists `targetingPlan` before rewrite, so any new evidence contract becomes available to rewrite, validation, logging, and downstream session reads without adding a new pipeline stage.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] `rewriteResumeFull()` already accepts a precomputed `targetingPlan`, so it can stay a consumer instead of becoming a second planner.
- [VERIFIED: src/lib/agent/tools/validate-rewrite.ts] Validation already receives `targetingPlan` only in `job_targeting` mode, which is the correct seam for evidence-aware target-specific guardrails.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] ATS enhancement never enters the `buildTargetingPlan()` branch unless `params.mode === 'job_targeting'`, which keeps the scope isolated.

## Required Data Contract Additions

Keep the new state compact and attach it to `TargetingPlan`, not to shared top-level session fields.

```ts
type SemanticEvidenceDisposition =
  | 'proven'
  | 'adjacent'
  | 'transferable'
  | 'missing'

type SemanticEvidenceItem = {
  targetSignal: string
  disposition: SemanticEvidenceDisposition
  confidence: 'high' | 'medium' | 'low'
  rationale: string
  sourceSections: Array<'summary' | 'experience' | 'skills' | 'education' | 'certifications'>
  supportingSignals: string[]
  supportingSpans: Array<{
    section: 'summary' | 'experience' | 'skills' | 'education' | 'certifications'
    itemId?: string
    start?: number
    end?: number
    text: string
  }>
}

type TargetingPlan = {
  // existing fields...
  semanticEvidence: {
    items: SemanticEvidenceItem[]
    emphasize: string[]
    translateCarefully: string[]
    doNotClaim: string[]
  }
}
```

- [VERIFIED: src/types/agent.ts] `TargetingPlan` is already the smallest shared contract that reaches pipeline persistence, rewrite, validation, and session serialization.
- [VERIFIED: src/app/api/session/[id]/route.ts] Because `targetingPlan` is returned to clients today, `supportingSignals` and `supportingSpans` should stay compact; retain short evidence excerpts or offsets, not duplicated full resume sections or large JD excerpts.
- [VERIFIED: src/types/trace.ts] `JobTargetingTrace` has no evidence section yet, so add only summary counts there rather than duplicating the full item list in logs.

## Validation and Prompt Changes

### Prompting

- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] `buildTargetJobSectionInstructions()` is the safest place to translate the new evidence classes into rewrite instructions without changing shared ATS prompt builders.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts] The current `target_keywords` handoff is too narrow because it only carries `mustEmphasize`; the richer evidence contract should drive phrasing rules inside `instructions`, not a broader shared `RewriteSectionInput` unless strictly necessary.

Recommended prompt policy:

- `proven`: tell the model it may present the signal directly and confidently.
- `adjacent`: tell the model to position it as closely related experience, not as exact role parity.
- `transferable`: tell the model to frame it as transferable context or supporting exposure, not ownership.
- `missing`: tell the model to avoid explicit claims and preserve the gap.

### Validation

- [VERIFIED: src/lib/agent/tools/validate-rewrite.ts] New checks should stay inside `context?.mode === 'job_targeting'` so ATS and non-target flows keep their current behavior.
- [VERIFIED: src/lib/agent/tools/validate-rewrite.ts] The existing target-only validation shape already supports both hard blocks and soft warnings, which matches evidence-aware policy.

Recommended validation additions:

- Block when a `missing` signal appears as a direct skill/tool/role claim in summary, skills, or experience.
- Warn when an `adjacent` or `transferable` signal is rewritten as exact ownership instead of related exposure.
- Warn when the optimized summary upgrades a target role claim beyond what `proven` evidence supports.

## Observability and Test Implications

### Observability

- [VERIFIED: src/lib/agent/job-targeting-pipeline.ts; src/types/trace.ts] `agent.job_targeting.plan_built`, `agent.job_targeting.validation_failed`, and `agent.job_targeting.pipeline_trace` are the right existing logs to add evidence counts and top-level disposition summaries.
- [VERIFIED: src/lib/agent/job-targeting-observability.ts] The current shared job-targeting log context is minimal, so evidence details should be passed as explicit extras at call sites rather than expanding the helper too aggressively.

Recommended log fields:

- `semanticEvidenceCounts`: counts for `proven`, `adjacent`, `transferable`, `missing`
- `semanticEvidenceVersion`: explicit contract version for future migrations
- `blockedClaimSignals`: short list of the signals that caused a hard validation block

### Tests

- [VERIFIED: src/lib/agent/tools/build-targeting-plan.test.ts] Add plan-builder tests that classify the same JD signal as `proven`, `adjacent`, `transferable`, or `missing` based on resume evidence, without relying on domain-specific role families.
- [VERIFIED: src/lib/agent/tools/validate-rewrite.test.ts] Add target-only validation tests for false promotion of `adjacent`/`transferable` evidence and hard blocking of `missing` evidence claims.
- [VERIFIED: src/lib/agent/tools/pipeline.test.ts] Add integration coverage proving the evidence contract is persisted into `targetingPlan`, affects job-targeting prompts/validation, and does not alter ATS branches.
- [VERIFIED: src/app/api/profile/smart-generation/route.test.ts; src/app/api/session/[id]/route.ts] If `TargetingPlan` grows, update route tests to confirm the new persisted shape either serializes safely or is intentionally filtered.
- [VERIFIED: src/lib/routes/session-comparison/decision.ts; src/lib/agent/highlight-observability.ts] No new highlight tests should be required if the classifier stays in `TargetingPlan` and does not change `highlightState`.

## Key Isolation Risks

- [VERIFIED: src/app/api/session/[id]/route.ts] Anything added to `TargetingPlan` is exposed through the session snapshot today, so a verbose span-level evidence artifact will leak internal reasoning to clients and bloat payloads unless it is compact or filtered.
- [VERIFIED: src/lib/agent/tools/rewrite-resume-full.ts; src/lib/agent/tools/validate-rewrite.ts] Both rewrite and validation are shared ATS/job-targeting modules, so any non-guarded contract change can spill into ATS enhancement.
- [VERIFIED: src/lib/routes/smart-generation/result-normalization.ts] Smart-generation success currently collapses validation warnings to plain strings, so evidence-aware warnings can become lossy unless that response stays intentionally summary-only.
- [VERIFIED: src/lib/agent/tools/build-targeting-plan.ts] Keeping both the old coarse arrays and a new evidence classifier can create contradictory prompt inputs unless `mustEmphasize`, `translateCarefully`, and `doNotClaim` are derived from one canonical evidence map.
- [VERIFIED: src/lib/agent/highlight-observability.ts; src/lib/routes/session-comparison/decision.ts] Highlight-only and compare flows are safe only if the new layer never becomes a prerequisite for rendering highlights or optimized previews.

## Files Read

- [VERIFIED: file read] `CLAUDE.md`
- [VERIFIED: file read] `.planning/config.json`
- [VERIFIED: file read] `.planning/STATE.md`
- [VERIFIED: file read] `.planning/REQUIREMENTS.md`
- [VERIFIED: file read] `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-CONTEXT.md`
- [VERIFIED: file read] `.planning/phases/CURRIA-106-refatorar-o-pipeline-job-targeting-validacao-extracao/106-RESEARCH.md`
- [VERIFIED: file read] `.planning/phases/CURRIA-107-harden-highlight-de-job-targeting-com-origem-rastreavel-e-g/107-RESEARCH.md`
- [VERIFIED: file read] `src/lib/agent/job-targeting-pipeline.ts`
- [VERIFIED: file read] `src/lib/agent/tools/build-targeting-plan.ts`
- [VERIFIED: file read] `src/lib/agent/tools/rewrite-resume-full.ts`
- [VERIFIED: file read] `src/lib/agent/tools/validate-rewrite.ts`
- [VERIFIED: file read] `src/lib/agent/tools/rewrite-section.ts`
- [VERIFIED: file read] `src/lib/agent/job-targeting-retry.ts`
- [VERIFIED: file read] `src/lib/agent/job-targeting-observability.ts`
- [VERIFIED: file read] `src/lib/agent/highlight-observability.ts`
- [VERIFIED: file read] `src/lib/jobs/processors/job-targeting.ts`
- [VERIFIED: file read] `src/lib/routes/smart-generation/decision.ts`
- [VERIFIED: file read] `src/lib/routes/smart-generation/result-normalization.ts`
- [VERIFIED: file read] `src/lib/routes/smart-generation/types.ts`
- [VERIFIED: file read] `src/lib/routes/session-comparison/decision.ts`
- [VERIFIED: file read] `src/lib/routes/file-access/response.ts`
- [VERIFIED: file read] `src/lib/resume/cv-highlight-artifact.ts`
- [VERIFIED: file read] `src/types/agent.ts`
- [VERIFIED: file read] `src/types/cv.ts`
- [VERIFIED: file read] `src/types/trace.ts`
- [VERIFIED: file read] `src/lib/agent/tools/build-targeting-plan.test.ts`
- [VERIFIED: file read] `src/lib/agent/tools/validate-rewrite.test.ts`
- [VERIFIED: file read] `src/lib/agent/tools/pipeline.test.ts`
- [VERIFIED: file read] `src/app/api/profile/smart-generation/route.test.ts`
- [VERIFIED: file read] `src/components/resume/user-data-page.tsx`

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|-------|---------------|
| A1 | [ASSUMED] A single compact evidence map on `TargetingPlan` is enough for both prompting and validation, so no second persisted artifact is needed. | If wrong, the planner will under-scope storage and serialization work. |
| A2 | [ASSUMED] The new classifier can stay compact enough for session serialization by storing short evidence excerpts or offsets for supporting spans instead of duplicating full bullets/sections. | If wrong, the session route may need an explicit server-only filtering layer. |

## Sources

- [VERIFIED: code inspection] `src/lib/agent/job-targeting-pipeline.ts`
- [VERIFIED: code inspection] `src/lib/agent/tools/build-targeting-plan.ts`
- [VERIFIED: code inspection] `src/lib/agent/tools/rewrite-resume-full.ts`
- [VERIFIED: code inspection] `src/lib/agent/tools/validate-rewrite.ts`
- [VERIFIED: code inspection] `src/types/agent.ts`
- [VERIFIED: code inspection] `src/types/trace.ts`
- [VERIFIED: code inspection] `src/lib/routes/smart-generation/result-normalization.ts`
- [VERIFIED: code inspection] `src/app/api/session/[id]/route.ts`
- [VERIFIED: code inspection] `.planning/phases/CURRIA-108-adicionar-camada-dinamica-de-evidencia-semantica-para-targeted-rewrite/108-CONTEXT.md`
