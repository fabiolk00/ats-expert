# 59 Validation

## Automated Validation

- `npm run typecheck`
- `npx vitest run "src/lib/agent/tool-errors.test.ts" "src/lib/resume-generation/generate-billable-resume.test.ts" "src/lib/agent/tools/index.test.ts"`
- `npx vitest run "src/lib/resume-generation/generate-billable-resume.test.ts" "src/lib/agent/tools/index.test.ts" "src/app/api/profile/smart-generation/route.test.ts" "src/app/api/profile/ats-enhancement/route.test.ts"`
- `npm run audit:route-architecture`
- `npm run test:architecture-proof-pack`

## Live Validation Note

The local live scenario remains blocked by quota before the billable path in this environment, so the new phase was validated through targeted and architecture-level automated coverage plus the already captured real log that showed `agent.generate_file.preflight.passed` before the downstream failure.
