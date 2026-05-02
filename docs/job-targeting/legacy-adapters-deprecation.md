# Legacy Job Targeting Adapters Deprecation

`src/lib/agent/job-targeting/compatibility/legacy-adapters.ts` exists only to bridge brownfield consumers from older Job Targeting structures to `JobCompatibilityAssessment`.

Deprecated since: 2026-05-02  
Removal target: 2026-07-31

## Current Consumers

- `src/lib/agent/tools/build-targeting-plan.ts`
- `src/lib/agent/tools/validate-rewrite.ts`
- `src/lib/agent/job-targeting/validation-policy.ts`
- `src/lib/agent/job-targeting/target-recommendations.ts`
- `src/lib/agent/job-targeting/score-breakdown.ts`
- `src/lib/agent/job-targeting/safe-targeting-emphasis.ts`
- `src/lib/agent/job-targeting/rewrite-permissions.ts`
- `src/lib/agent/job-targeting/low-fit-warning-gate.ts`

## Migration Plan

1. Keep the adapter import cap from `legacy-adapters-usage.test.ts` from increasing.
2. Move UI score and recommendations to consume `JobCompatibilityAssessment` directly.
3. Move rewrite and validation callers to consume claim policy and generated traces directly.
4. Reduce the import cap every time a consumer is migrated.
5. Delete the adapter after all direct consumers are migrated and shadow cutover criteria have passed.
