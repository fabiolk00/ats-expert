# Job Targeting Compatibility Cutover Policy

The JobCompatibilityAssessment must run in shadow mode before it becomes the production source of truth.

## Runtime Modes

- `JOB_COMPATIBILITY_ASSESSMENT_ENABLED=false`: the new assessment does not run.
- `JOB_COMPATIBILITY_ASSESSMENT_ENABLED=true` + `JOB_COMPATIBILITY_ASSESSMENT_SHADOW_MODE=true` + `JOB_COMPATIBILITY_ASSESSMENT_SOURCE_OF_TRUTH=false`: the new assessment runs, is persisted as `agentState.jobCompatibilityAssessmentShadow`, and logs comparison metrics. It must not alter UI, score, rewrite, validation, or low-fit decisions.
- `JOB_COMPATIBILITY_ASSESSMENT_ENABLED=true` + `JOB_COMPATIBILITY_ASSESSMENT_SHADOW_MODE=false` + `JOB_COMPATIBILITY_ASSESSMENT_SOURCE_OF_TRUTH=true`: the new assessment is persisted as `agentState.jobCompatibilityAssessment` and may drive score, claim policy, low-fit, rewrite, and validation.

## Promotion Criteria

Promotion to source of truth is blocked until all criteria are true:

1. At least 500 real Job Targeting cases ran in shadow mode.
2. Mean absolute score divergence is <= 15 points.
3. P95 score divergence is <= 30 points.
4. There are 0 confirmed false-positive forbidden claims in generated resumes.
5. There are 0 confirmed factual violations released by override.
6. There are 0 confirmed false negatives for core requirements with explicit evidence.
7. At least 95% of divergent cases are explainable from logs and assessment audit fields.
8. Golden cases pass.
9. Mutation and adversarial cases pass.
10. No operational pipeline error increase is observed.

## Required Event

Every shadow run logs `job_targeting.compatibility.shadow_comparison` with safe metadata only:

- session and user ids
- legacy score and assessment score
- score delta
- critical gap delta
- low-fit delta
- legacy unsupported count
- assessment supported, adjacent, unsupported, and forbidden claim counts
- assessment, score, and catalog versions
- generated timestamp

Full resumes and full job descriptions must never be logged in this event.

## Non-Overrideable Boundary

Low-fit is a business fit warning. A factual violation is an unsafe generated claim. A user may accept low-fit risk, but an override must never release a final artifact with a factual violation such as a forbidden term, unsupported added skill, unsupported certification, unsupported education claim, unsafe direct claim, missing claim trace, or unsupported expressed signal.
