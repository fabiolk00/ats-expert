---
phase: 02-core-funnel-browser-verification
plan: "03"
subsystem: browser-lane-ci-and-docs
tags: [ci, docs, playwright, release-gate]
requires: [02-01, 02-02]
provides:
  - Dedicated CI lane for Chromium browser verification
  - Contributor-facing local and maintenance guidance for the mocked-provider E2E workflow
affects: [github-actions, onboarding, testing-rules]
tech-stack:
  added:
    - "No new packages"
  patterns:
    - Separate browser job in CI with explicit Chromium install
    - Top-level docs that point to the repo-local Playwright command
    - Testing guidance that codifies the mocked-provider and E2E auth model
key-files:
  modified:
    - .github/workflows/ci.yml
    - README.md
    - docs/developer-rules/TESTING.md
key-decisions:
  - "Expose browser verification as a dedicated CI job so failures are obvious in workflow output."
  - "Document the browser lane as provider-free and test-only instead of encouraging real credentials."
patterns-established:
  - "CI installs Chromium explicitly and runs `npm run test:e2e -- --project=chromium`."
  - "Contributor docs direct browser specs to the shared mocks and the committed `/api/e2e/auth` seam."
requirements-completed: [QA-03]
duration: 18 min
completed: 2026-04-10
---

# Phase 2 Plan 3: CI and Docs Summary

**The browser suite is now part of the repo contract: it has a dedicated CI job and top-level contributor guidance instead of living as a local-only workflow.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-10T05:47:00Z
- **Completed:** 2026-04-10T06:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added a dedicated `browser-e2e` GitHub Actions job that installs Chromium and runs the committed Playwright lane.
- Injected explicit `E2E_AUTH_ENABLED` and `E2E_AUTH_BYPASS_SECRET` values into the browser CI job.
- Updated `README.md` so contributors can discover and run the browser lane from the top-level project docs.
- Updated testing rules so future Playwright coverage follows the shared mock fixtures and the test-only auth seam instead of live providers.

## Files Created/Modified

- `.github/workflows/ci.yml` - Added the dedicated browser job with Playwright browser installation and the Chromium command.
- `README.md` - Added a browser verification section and listed `test:e2e` in the useful command set.
- `docs/developer-rules/TESTING.md` - Declared Playwright as the committed browser framework and documented the mocking/auth rules for maintaining the suite.

## Decisions Made

- Prefer a separate browser CI job over hiding the new gate inside the generic unit-test step.
- Keep the docs explicit that the Playwright lane uses mocked API providers and a test-only auth seam, not live external credentials.

## Verification

- `npm run typecheck`
- `npm run test:e2e -- --project=chromium`
- `rg -n "test:e2e|playwright install --with-deps chromium|E2E_AUTH_ENABLED|E2E_AUTH_BYPASS_SECRET" .github/workflows/ci.yml README.md docs/developer-rules/TESTING.md`

## User Setup Required

Install Chromium locally once with `npx playwright install chromium`, then run `npm run test:e2e -- --project=chromium`.

## Next Phase Readiness

- Phase 2 is now ready for closure: the browser suite exists, the critical journeys pass, and CI/docs treat it as a launch gate.
- Phase 3 can focus on real staging billing validation instead of basic browser confidence.

---
*Phase: 02-core-funnel-browser-verification*
*Completed: 2026-04-10*
