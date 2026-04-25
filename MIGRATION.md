# Migration Notes

## [CURRIA-105] buildCareerFitCheckpoint - behavior change

**Date:** 2026-04-25
**Branch:** feat/curria-105-career-fit-graduated-risk
**Affects:** any consumer of `buildCareerFitCheckpoint` using the result
             for soft UI signals (badges, tooltips, warning text)

### What changed

Previously: emitted a checkpoint for any weak fit (boolean model).
Now: emitted only when `riskLevel='high'` and `careerFitOverrideConfirmedAt` is absent.
Sessions with `riskLevel='medium'` receive `null` from this function.

### Consumer audit result

Audited on 2026-04-25. No soft-signal consumers found.
All existing consumers use the checkpoint exclusively for the hard-block modal.
No migration action required for current consumers.

### Action for new consumers

Do not use `buildCareerFitCheckpoint` for new features.
Read `agentState.careerFitEvaluation` directly and handle all three risk levels.
Function is marked `@deprecated` in source.

### Rollback reference

To restore boolean behavior: revert commits tagged `curria-105-profile-review`.

## [CURRIA-105-H2] fingerprintJD - JD comparison hardening

**Date:** 2026-04-25
**Branch:** main
**Affects:** `phaseMeta.careerFitWarningJDFingerprint`, `shouldShowCareerFitWarning`,
             `hasPendingCareerFitOverride`, `hasActiveCareerFitWarning`

### What changed

Replaced raw string equality comparison of `targetJobDescription` with a normalized
fingerprint (`fingerprintJD`) across all career fit warning helpers.

`careerFitWarningJDFingerprint` added to `phaseMeta` as the logical reference.
`careerFitWarningTargetJobDescription` retained for human-readable debugging only -
not used in any conditional logic.

### Consumer impact

Any consumer that previously compared `careerFitWarningTargetJobDescription` directly
must migrate to fingerprint-based comparison via `fingerprintJD`.

No such consumer was found at time of implementation (2026-04-25).

### Rollback reference

To restore raw string comparison: revert commits tagged `curria-105-hardening-ii`.
Remove `careerFitWarningJDFingerprint` from `phaseMeta` and restore the original
string equality checks in `agent-loop.ts` and `profile-review.ts`.

### Known limitation introduced

`fingerprintJD` is case-insensitive. JDs differing only in capitalization of
technology or company names are treated as identical. Documented in module JSDoc.
