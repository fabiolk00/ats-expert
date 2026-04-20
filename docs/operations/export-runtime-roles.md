# Export Runtime Roles

CurrIA keeps the current monolith and separates heavy export execution with one runtime flag:

- `APP_RUNTIME_ROLE=web`
  - serves Next.js and API traffic
  - creates durable export jobs
  - does not execute heavy artifact-generation work inline
- `APP_RUNTIME_ROLE=worker`
  - runs `npm run jobs:worker`
  - polls queued `artifact_generation` jobs
  - enforces `EXPORT_GENERATION_MAX_CONCURRENCY` and `EXPORT_GENERATION_MAX_PER_USER`

## Required env

```bash
APP_RUNTIME_ROLE=web
EXPORT_GENERATION_MAX_CONCURRENCY=3
EXPORT_GENERATION_MAX_PER_USER=1
EXPORT_GENERATION_TIMEOUT_MS=90000
EXPORT_GENERATION_RETRY_DELAYS_MS=10000,30000,120000
EXPORT_WORKER_POLL_INTERVAL_MS=2000
EXPORT_WORKER_CLAIM_BATCH_SIZE=12
```

## Pool guidance

- Web nodes:
  - keep DB pools conservative because web traffic is bursty and mostly short-lived
  - start around 5 to 10 connections per node unless the deployment platform already constrains lower
- Worker nodes:
  - do not size the pool above the meaningful export parallelism
  - a safe starting rule is `worker_pool_max <= EXPORT_GENERATION_MAX_CONCURRENCY + 2`
  - if `EXPORT_GENERATION_MAX_CONCURRENCY=3`, prefer a worker pool around 4 to 6

## Operational notes

- Export reservations are still created inside the current reserve -> render -> finalize/release -> reconcile contract.
- Jobs above the concurrency cap stay queued.
- Same-user export fanout is capped before a second export starts.
- Use `/operations` with `OPERATIONS_DASHBOARD_EMAILS` configured for an internal health view.
