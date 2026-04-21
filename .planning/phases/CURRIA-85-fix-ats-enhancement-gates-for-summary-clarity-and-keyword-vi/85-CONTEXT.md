# Phase 85 Context

## Title
Fix ATS enhancement gates for summary clarity and keyword visibility

## Problem

ATS enhancement was producing stronger experience output and passing rewrite validation, but final readiness still fell back to `estimated_range` too often because:

- `improvedSummaryClarity` mostly rewarded "changed + longer"
- `improvedKeywordVisibility` in `ats_enhancement` had no explicit signal and relied on the weak no-JD keyword proxy

## Scope

In scope:

- summary clarity gate logic
- keyword visibility gate logic and signaling
- ATS enhancement path only where needed

Out of scope:

- experience highlight selector
- PDF/export
- billing/generation flow
- broader job-targeting changes

## Intended Outcome

- concise but cleaner summaries can pass
- ATS enhancement can emit explicit keyword visibility improvement without a JD
- valid ATS outputs are withheld less often for the wrong reasons
