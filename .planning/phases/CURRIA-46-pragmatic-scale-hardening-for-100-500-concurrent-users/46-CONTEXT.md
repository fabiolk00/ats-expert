# Phase 46 Context - Pragmatic scale hardening for 100-500 concurrent users

## Decisions

- Keep the monolith and current reservation-ledger export contract intact.
- Separate heavy artifact-generation execution by runtime role instead of by service split.
- Bound render concurrency per worker process and cap same-user active export fanout at one.
- Prefer log-based telemetry plus a compact internal operations dashboard over vendor-specific observability work.
- Add only missing hot-path indexes; do not redesign billing, reconciliation, or durable intent semantics.

## Scope

- export worker/runtime separation
- render concurrency cap
- per-user active export limit
- timeout and bounded retry/backoff
- billing/render timing instrumentation
- log-native counter events
- small operator read model and alert summary
- staging validation guidance for 50/100/250/500 concurrency

## Deferred

- microservices
- distributed locks outside Postgres
- Kafka/Redis orchestration
- billing service split
- 5k+ concurrency optimization
