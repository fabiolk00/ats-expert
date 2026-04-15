# Phase 34 Validation

## Goal-Backward Check

Phase 34 only succeeds if the repo leaves the remaining non-E2E runtime in a deliberate state rather than an ambiguous one.

That means:

- the dominant residual suites must be identified from committed profiling evidence
- the primary outlier must either improve materially or be carried forward behind an explicit budget and gate
- the proof path must reuse named repo commands and be rerunnable in local or CI contexts

## Required Outputs

- a committed budget evidence artifact for the residual non-E2E suite
- either a code-level reduction of the dominant outlier or a documented accepted runtime budget with repo-native enforcement

## Risks To Avoid

- rerunning broad profiling without narrowing the next target first
- reducing runtime by dropping assertions or async state coverage
- leaving the repo with another conversational performance conclusion instead of committed proof

## Plan Shape Decision

Use 2 sequential plans:

- `34-01` to re-profile residual suites and publish the current budget evidence
- `34-02` to either reduce or explicitly gate the dominant remaining bottleneck

This keeps measurement and decision-making separate, which makes the tradeoff explicit if the bottleneck turns out not to be safely reducible in one pass.
