# Approved Architecture Chokepoints

## Signed URL Emitters

- `src/lib/agent/tools/generate-file.ts`
- `src/lib/routes/file-access/response.ts`
- `src/lib/resume-generation/generate-billable-resume.ts`

## Preview Lock Interpreters

- `src/lib/generated-preview/locked-preview.ts`
- `src/lib/cv/preview-sanitization.ts`
- `src/lib/routes/file-access/decision.ts`
- `src/lib/routes/smart-generation/preview-access.ts`
- `src/lib/routes/session-compare/invariants.ts`
- `src/lib/routes/session-versions/invariants.ts`

## Replay Access Resolvers

- `src/lib/resume-generation/generate-billable-resume.ts`

## Route Decision Layers

- `src/lib/routes/session-generate/decision.ts`
- `src/lib/routes/file-access/decision.ts`
- `src/lib/routes/smart-generation/decision.ts`
- `src/lib/routes/session-compare/decision.ts`
- `src/lib/routes/session-versions/decision.ts`
