# Signed URL TTL Review

Current launch posture keeps signed URL TTL at `3600s`.

Do not lower it reactively without evidence. Review it when one of these triggers appears:

- suspicious repeated access patterns in artifact telemetry
- support incidents that suggest overexposed artifact windows
- product sensitivity increases for exported artifacts

If a trigger is hit, review:

1. current download failure rate
2. current replay and locked-preview behavior
3. whether shorter TTL harms legitimate user download success
