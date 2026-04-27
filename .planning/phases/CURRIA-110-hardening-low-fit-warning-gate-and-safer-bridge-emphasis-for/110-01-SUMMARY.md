## Execution Summary

- Added `SafeTargetingEmphasis`, `CoreRequirementCoverage`, and `LowFitWarningGate` to the targeted job-targeting plan.
- Hardened the job-targeting pipeline to convert low-fit cases into recoverable validation blocks before version persistence or artifact generation.
- Reused the existing Phase 109 override/modal flow with a dedicated low-fit human warning copy and credit-aware CTA behavior.
- Added observability for low-fit decisions, promoted warnings, and evidence ratios.
- Added coverage for partial-fit emphasis, Java off-target blocking, smart-generation no-auto-dispatch, and low-fit modal UX.

## Validation

- `npm run typecheck`
- `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/tools/pipeline.test.ts src/lib/routes/smart-generation/decision.test.ts src/components/resume/user-data-page.test.tsx`
- `npx vitest run src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/job-targeting/validation-policy.test.ts`
