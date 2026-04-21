# Phase 64 Validation

- `npm run typecheck`
- `npx vitest run "src/lib/ats/scoring/index.test.ts" "src/lib/ats/scoring/observability.test.ts" "src/lib/ats/scoring/session-readiness.test.ts" "src/app/api/session/[id]/route.test.ts" "src/app/api/session/[id]/comparison/route.test.ts" "src/components/dashboard/session-list.test.tsx" "src/components/dashboard/chat-interface.test.tsx" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run audit:route-architecture`
- `npm run test:architecture-proof-pack`
