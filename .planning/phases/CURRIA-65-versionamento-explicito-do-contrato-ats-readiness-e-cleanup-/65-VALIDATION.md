# Phase 65 Validation

- `npm run typecheck`
- `npx vitest run "src/lib/ats/scoring/index.test.ts" "src/lib/ats/scoring/observability.test.ts" "src/lib/ats/scoring/session-readiness.test.ts" "src/app/api/session/[id]/route.test.ts" "src/app/api/session/[id]/comparison/route.test.ts" "src/lib/agent/context-builder.test.ts" "src/lib/agent/streaming-loop.test.ts" "src/components/dashboard/chat-interface.test.tsx" "src/components/resume/resume-comparison-view.test.tsx"`
- `npm run audit:route-architecture`
- `npm run test:architecture-proof-pack`
