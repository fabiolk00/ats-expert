---
title: CurrIA Logging and Error Queries
audience: [developers, operations]
related: [INDEX.md, error-codes.md, billing/MONITORING.md, launch-readiness.md]
status: current
updated: 2026-04-10
---

# Logging and Error Queries

Back to [Documentation Index](./INDEX.md) | Related guides: [Error Codes](./error-codes.md), [Launch Readiness](./launch-readiness.md)

## Overview

CurrIA now emits flat JSON logs through `src/lib/observability/structured-log.ts`.

The logger writes one JSON object per line with:

- `timestamp`
- `level`
- `event`
- zero or more top-level scalar fields such as `appUserId`, `sessionId`, `requestPath`, `errorCode`, or `errorMessage`

There is no nested `metadata` envelope anymore. Query examples should target top-level fields.

## Current Log Shape

Example error log:

```json
{
  "timestamp": "2026-04-10T09:15:00.000Z",
  "level": "error",
  "event": "api.file.download_urls_failed",
  "requestMethod": "GET",
  "requestPath": "/api/file/sess_123",
  "sessionId": "sess_123",
  "appUserId": "usr_123",
  "success": false,
  "errorMessage": "signing failed"
}
```

Example warning log:

```json
{
  "timestamp": "2026-04-10T09:16:00.000Z",
  "level": "warn",
  "event": "billing.info.load_failed",
  "appUserId": "usr_123",
  "surface": "auth_layout",
  "success": false,
  "errorMessage": "Failed to load billing metadata: relation does not exist"
}
```

## Important Event Families

### Agent and tool loop

- `agent.turn.started`
- `agent.turn.completed`
- `agent.request.failed`
- `agent.tool.started`
- `agent.tool.completed`
- `agent.tool.failed`
- `agent.tool.generated_output.persisted`

### Billing and checkout

- `checkout.request_started`
- `checkout.created`
- `checkout.creation_failed`
- `checkout.subscription_validation_failed`
- `asaas.webhook.processed`
- `asaas.webhook.failed`
- `asaas.webhook.duplicate_skipped`
- `billing.info.load_failed`

### Auth and webhook bootstrap

- `clerk.webhook.config_missing`
- `clerk.webhook.headers_missing`
- `clerk.webhook.signature_invalid`
- `clerk.webhook.duplicate`
- `clerk.webhook.handler_failed`
- `clerk.webhook.processed`

### Session and artifact retrieval

- `api.session.list_failed`
- `api.session.messages_failed`
- `api.file.download_urls_failed`

### Profile import

- `[api/profile/extract] Failed to create job`
- `[api/profile/status] Failed to get job status`
- `[import-jobs] Job failed`

## Common Fields

Fields vary by event, but the most useful ones are:

- `appUserId`
- `sessionId`
- `requestMethod`
- `requestPath`
- `surface`
- `eventType`
- `errorCode`
- `errorMessage`
- `success`
- `latencyMs`

`serializeError(...)` intentionally keeps the output narrow:

- `errorName`
- `errorMessage`
- `errorCode`
- `errorStatus`

Stacks, raw payloads, and arbitrary nested objects are intentionally excluded.

## Query Examples

The SQL examples below assume each line is stored as a JSON payload column named `payload`.

### Find recent internal errors

```sql
SELECT *
FROM logs
WHERE payload->>'level' = 'error'
  AND payload->>'timestamp' > to_char(NOW() - INTERVAL '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS')
ORDER BY created_at DESC;
```

### Find file retrieval failures

```sql
SELECT *
FROM logs
WHERE payload->>'event' = 'api.file.download_urls_failed'
ORDER BY created_at DESC
LIMIT 100;
```

### Find billing metadata degradation

```sql
SELECT *
FROM logs
WHERE payload->>'event' = 'billing.info.load_failed'
ORDER BY created_at DESC
LIMIT 100;
```

### Find Clerk webhook failures

```sql
SELECT *
FROM logs
WHERE payload->>'event' IN (
  'clerk.webhook.config_missing',
  'clerk.webhook.signature_invalid',
  'clerk.webhook.handler_failed'
)
ORDER BY created_at DESC;
```

### Count errors by event in the last day

```sql
SELECT
  payload->>'event' AS event_name,
  COUNT(*) AS count
FROM logs
WHERE payload->>'level' = 'error'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY payload->>'event'
ORDER BY count DESC;
```

## Grep Patterns

If you only have newline-delimited JSON logs on disk:

```bash
rg '"event":"api.file.download_urls_failed"' ./logs
rg '"event":"billing.info.load_failed"' ./logs
rg '"event":"clerk.webhook.handler_failed"' ./logs
rg '"event":"agent.tool.failed"' ./logs
```

## Incident Triage

### User cannot download generated files

1. Search `api.file.download_urls_failed`.
2. Filter by `sessionId` or `appUserId`.
3. Check whether the UI showed the retryable document message.

### Billing data disappears from the shell

1. Search `billing.info.load_failed`.
2. Group by `surface` to see whether the failures are isolated to `auth_layout`, `dashboard_page`, or `settings_page`.
3. Cross-check recent billing DB and Supabase incidents before treating it as a UI bug.

### Clerk bootstrap or auth sync issues

1. Search `clerk.webhook.config_missing`, `clerk.webhook.signature_invalid`, and `clerk.webhook.handler_failed`.
2. Filter by `svixId` or `clerkUserId`.
3. Confirm Upstash and Clerk webhook env values before replaying deliveries.

## Query Tips

- Prefer `event` for grouping and dashboards.
- Use `errorCode` when a flow already maps to structured tool-error classifications.
- Use `appUserId` and `sessionId` for one-user incident reconstruction.
- Treat `success: false` plus `level: warn` as degraded-but-recovered behavior, not necessarily a failed request.

For code-selection semantics, see [Error Codes](./error-codes.md).
