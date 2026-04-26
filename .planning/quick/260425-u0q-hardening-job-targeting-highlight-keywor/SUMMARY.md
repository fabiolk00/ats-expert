## Quick Summary

Task: close remaining hardening gaps for job-targeting highlight keyword fallback, gate observability, semantic-vs-keyword regression coverage, and API flow-agnostic highlight exposure.

### Implemented

- Extended `extractJobKeywords(...)` in `job-targeting-pipeline.ts` to use ordered fallback sources:
  1. `gapAnalysis.result.missingSkills`
  2. `targetingPlan.mustEmphasize`
  3. `targetingPlan.focusKeywords`
  4. short candidates derived from `targetFitAssessment.reasons`
  5. compact phrases derived from `targetJobDescription`
- Added explicit highlight-generation gate telemetry in `job-targeting-pipeline.ts`:
  - `allowed`
  - `blocked_validation_failed`
  - `blocked_unchanged_cv_state`
- Added detector regression tests showing that:
  - vacancy keywords enrich the prompt
  - a stronger non-keyword semantic nucleus still passes when keywords are present
  - a keyword-aligned fragment also passes when the model chooses that path
- Added pipeline tests for:
  - emphasis fallback when `missingSkills` is empty
  - final fallback to `targetJobDescription`
  - explicit gate telemetry on generated / validation_failed / unchanged branches
- Added `session-comparison` test proving `highlightState` remains flow-agnostic for `job_targeting`.

### Guardrails Preserved

- No ATS enhancement call site changes.
- No highlight persistence contract changes.
- No validation/fallback/unchanged gating changes beyond explicit telemetry.
- Existing `agent.highlight_state.persisted` logging preserved with `workflowMode: 'job_targeting'`.

### Validation

- `npx vitest run src/lib/agent/tools/detect-cv-highlights.test.ts src/lib/resume/cv-highlight-artifact.test.ts src/lib/agent/tools/pipeline.test.ts src/lib/routes/session-comparison/decision.test.ts src/components/resume/resume-comparison-view.test.tsx`
- `npm run typecheck`

Validation passed. Existing React `act(...)` warnings in `resume-comparison-view.test.tsx` remain pre-existing and non-blocking.
