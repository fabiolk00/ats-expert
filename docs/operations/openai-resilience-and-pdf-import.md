# OpenAI Resilience and Async PDF Import

## OpenAI protection

The shared OpenAI wrapper now applies:

- per-attempt timeout budgets
- bounded retries with backoff
- a process-local circuit breaker with `closed`, `open`, and `half_open` states

Current breaker defaults:

- retryable failures to open the breaker: `3`
- breaker open window: `30s`

Structured log events to watch:

- `openai.request.timeout`
- `openai.request.retry`
- `openai.circuit.open`
- `openai.circuit.half_open`
- `openai.circuit.closed`
- `openai.circuit.short_circuit`

Useful fields:

- `operation`
- `workflowMode`
- `stage`
- `requestKind`
- `model`
- `sessionId`
- `userId`
- `breakerState`

Operational guidance:

- repeated `openai.request.timeout` for the same `operation` usually means the stage budget is too aggressive or the provider is degraded
- `openai.circuit.open` means CurrIA is actively cutting off new provider calls for the cooldown window to avoid cascading timeouts
- `openai.circuit.half_open` followed by `openai.circuit.closed` means recovery succeeded
- `openai.circuit.half_open` followed by another `openai.circuit.open` means the provider is still unstable

## Async PDF import

Large PDF imports from `/api/profile/upload` no longer depend on one long request window.

Flow:

1. `POST /api/profile/upload`
2. if the PDF is above the async threshold, the route persists a `pdf_import_jobs` row and returns `202`
3. the client polls `GET /api/profile/upload/status/:jobId`
4. the status route reports `pending`, `processing`, `completed`, or `failed`
5. on `completed`, the client reloads `/api/profile` and applies the saved `UserProfile`

Structured log events to watch:

- `[api/profile/upload] PDF import queued`
- `[pdf-import-jobs] Job created`
- `[pdf-import-jobs] Job completed`
- `[pdf-import-jobs] Job failed`
- `[pdf-import-jobs] Reclaiming stale processing job`

Useful fields:

- `jobId`
- `appUserId`
- `status`
- `fileSize`
- `strategy`
- `changedFields`
- `warningPresent`

Operational guidance:

- jobs stuck in `pending` or `processing` beyond the stale lease window are eligible for reclaim on the next status poll
- failed jobs persist a user-facing `error_message` for the UI
- completed jobs can also persist a `warning_message` when extraction confidence is low
- cron cleanup now clears old `pdf_import_jobs` rows and resets stale `processing` rows back to `pending`
