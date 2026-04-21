# 60 Validation

## Automated Validation

- `npm run typecheck`
- `npx vitest run "src/lib/db/resume-generations.test.ts" "src/lib/resume-generation/generate-billable-resume.test.ts" "src/lib/agent/tools/index.test.ts" "src/lib/agent/tool-errors.test.ts"`
- `npx vitest run "src/lib/resume-generation/generate-billable-resume.test.ts" "src/lib/agent/tools/index.test.ts" "src/app/api/profile/smart-generation/route.test.ts" "src/app/api/profile/ats-enhancement/route.test.ts"`
- `npm run audit:route-architecture`
- `npm run test:architecture-proof-pack`

## Live Validation Note

The local environment still cannot complete the original end-to-end scenario because quota blocks execution before the relevant billable stage. This phase therefore focused on making the next live recurrence diagnosable by branch and raw persistence cause.
