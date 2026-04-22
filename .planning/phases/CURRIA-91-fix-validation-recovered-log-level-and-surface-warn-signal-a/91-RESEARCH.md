# Phase 91 Research

## Current seams

The relevant log seams are local and narrow:

- `src/lib/agent/ats-enhancement-pipeline.ts`
  - emits `agent.ats_enhancement.validation_recovered`
  - currently uses `logWarn(...)` even though the final gate outcome is still unknown at that point
- `src/lib/ats/scoring/observability.ts`
  - emits `agent.ats_enhancement.summary_clarity_outcome`
  - currently uses `logInfo(...)` for every path, including the Phase 90 problematic path flagged by `summaryRepairThenClarityFail`

## Local monitoring-rule audit

Repo-wide search for:

- `validation_recovered`
- `summary_clarity_outcome`
- `alert`
- `monitor`
- `warn`

found:

- references in source and tests for the emit sites themselves
- Phase 90 planning/validation artifacts
- generic billing/openai monitoring docs unrelated to these ATS enhancement events

The repo does **not** contain a local alert rule, monitoring config, or documented operator query that depends on `agent.ats_enhancement.validation_recovered` specifically staying at `warn`.

That means the level change is safe to keep local to the event emitters and tests.

## Semantic conclusion

`validation_recovered` fires before final ATS quality-gate evaluation and before the final score outcome is known. It is evidence that the pipeline continued safely, not evidence that the outcome is problematic. Therefore `info` is the correct level.

`summary_clarity_outcome` already has the exact semantic boolean needed to drive the real warning:

- `summaryRepairThenClarityFail`

This should become the only condition that promotes the event to `warn`, because it captures the confirmed problematic path rather than a merely intermediate recovery step.

## Exact implementation shape

1. Replace `logWarn(...)` with `logInfo(...)` for `agent.ats_enhancement.validation_recovered`.
2. In `recordAtsSummaryClarityOutcome(...)`, emit:
   - `logWarn(...)` when `outcome.summaryRepairThenClarityFail === true`
   - `logInfo(...)` otherwise
3. Keep the event payload identical.
4. Update unit tests in `observability.test.ts` and pipeline tests in `pipeline.test.ts` so they assert the log level explicitly.
