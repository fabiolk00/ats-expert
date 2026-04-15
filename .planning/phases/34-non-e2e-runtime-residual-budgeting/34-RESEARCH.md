# Phase 34 Research

## Objective

Plan the remaining non-E2E runtime work so the repo either reduces the dominant residual bottleneck or records an explicit accepted budget with durable proof.

## What I Reviewed

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/milestones/v1.4-phases/CURRIA-31.1-reduce-test-suite-runtime-and-add-ci-friendly-performance-pr/31.1-03-SUMMARY.md`
- `package.json`
- `src/components/resume/resume-builder.test.tsx`
- `src/components/resume/resume-builder.tsx`

## Current Runtime Evidence

- Phase `31.1` already removed the largest structural waste:
  - node-first Vitest defaults
  - retry delay override for recovery tests
  - lower-overhead interaction patterns in the hottest UI suites
  - canonical runtime command `npm run test:profile:non-e2e`
- The archived summary for `31.1-03` is explicit that the broad non-E2E sweep still timed out after about `129s`.
- The remaining bottleneck was narrowed to residual medium-cost suites plus `resume-builder` polling behavior.

## Code-Level Findings

### `resume-builder` is still the clearest dominant suspect

- `src/components/resume/resume-builder.tsx` has two polling loops driven by `window.setInterval(...)`:
  - LinkedIn import status polling
  - PDF import status polling
- The component already exposes `linkedinPollMs` and `pdfImportPollMs` props, which means the runtime seam is present but not yet fully exploited by the tests.
- `src/components/resume/resume-builder.test.tsx` still mixes:
  - `vi.useRealTimers()` in the async polling scenarios
  - many `waitFor(...)` calls
  - multiple status transitions that currently depend on wall-clock progress rather than deterministic timer advancement

### The repo already has the right proof entrypoint

- `package.json` exposes `test:profile:non-e2e`, so Phase 34 should reuse that command rather than inventing a new profiling path.
- Phase 33 added `audit:milestone-metadata`, which means this phase can add a similar repo-native runtime proof or budget checker without inventing a one-off process.

## Risks

- Chasing broad-suite runtime again without isolating the dominant file first will likely recreate the earlier 2-minute timeout loop.
- Switching polling tests to fake timers too aggressively could weaken real async behavior if the assertions stop covering the intended state transitions.
- If the repo cannot reduce the dominant outlier enough, the fallback must be an explicit budget and gate, not another implicit “known slow but untracked” state.

## Recommended Planning Direction

Use 2 waves:

1. Re-profile the residual non-E2E outliers and publish a current, committed budget snapshot centered on `resume-builder` and any remaining medium suites.
2. Either materially reduce the dominant bottleneck, or formalize the accepted budget through a repo-native gate and documentation if further reduction is not safe enough.

## Proposed Requirement Mapping

- `PERF-04`: publish committed evidence showing which suites dominate post-`v1.4` non-E2E runtime
- `PERF-05`: either reduce the dominant outlier or make the accepted runtime budget explicit with proof and gating
