# Quick Task 260425-vsz: Recover from stale download session ids and harden post-generation lookup

## Scope

1. Add ownership-safe stale session fallback in file access context with distinct telemetry.
2. Teach the dashboard download client to auto-retry once with a suggested replacement session id.
3. Propagate triggers and recovery persistence in the profile download flow, then extend tests for API and UI recovery.
