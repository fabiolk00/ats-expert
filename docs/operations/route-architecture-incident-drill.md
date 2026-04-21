# Route Architecture Incident Drill

Run this drill in staging before a sensitive release.

## Scenarios

1. Generate on free plan and confirm replay stays locked after upgrade until a new paid generation happens.
2. Call file route for a locked artifact and confirm no real signed URL is emitted.
3. Call compare and versions for locked snapshots and confirm no diff or real snapshot leaks.
4. Call an artifact-available path and confirm only the approved signer emits the real URL.

## Commands

```bash
npm run audit:route-architecture
npm run test:architecture-proof-pack
```

## Expected Result

- audit passes
- proof pack stays green
- telemetry counters show locked and artifact-available paths separately
