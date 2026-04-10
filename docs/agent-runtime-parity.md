---
title: Agent Runtime Parity
audience:
  - operators
  - developers
related:
  - ./architecture-overview.md
  - ./openai/README.md
  - ./launch-readiness.md
status: current
updated: 2026-04-10
---

# Agent Runtime Parity

Use this runbook after a deploy to prove which `/api/agent` runtime is serving traffic.

## Header Contract

The deployed route now exposes these safe provenance headers:

- `X-Agent-Release`
- `X-Agent-Release-Source`
- `X-Agent-Resolved-Agent-Model`
- `X-Agent-Resolved-Dialog-Model`

`X-Agent-Release` is the short release identity used to correlate a live response with server logs. The source tells you whether that identity came from a Vercel commit SHA, a Vercel ref fallback, a Vercel environment fallback, or `local_dev`.

## Why This Check Is Safe

`npm run agent:parity` sends an unauthenticated `POST` to `/api/agent` with an empty JSON body.

That request is intentionally safe because `/api/agent` resolves auth before body validation, session creation, message counting, billing, or SSE execution. The expected result is an early `401` response that still carries the provenance headers.

## Command

```bash
npm run agent:parity -- \
  --url https://your-app.example.com/api/agent \
  --expected-release abc123def456 \
  --expected-release-source vercel_commit \
  --expected-agent-model gpt-5-mini \
  --expected-dialog-model gpt-5-mini
```

You can also pass the base app URL and let the script append `/api/agent` automatically:

```bash
npm run agent:parity -- \
  --url https://your-app.example.com \
  --expected-release abc123def456 \
  --expected-release-source vercel_commit \
  --expected-agent-model gpt-5-mini \
  --expected-dialog-model gpt-5-mini
```

## Interpreting Results

- `PASS` means the deployed route returned the expected 401 safe-check status and every provenance header matched.
- `FAIL` means the live route is serving a different release or model contract than expected, or the required headers are missing.

Common mismatch meanings:

- `status: expected 401, received 200`
  The request path is no longer using the safe unauthenticated contract and needs investigation before using this check operationally.
- `release`
  The live deployment is not on the commit or fallback identity you expected.
- `agentModel` or `dialogModel`
  The runtime config does not match the intended `OPENAI_AGENT_MODEL`, `OPENAI_MODEL`, `OPENAI_MODEL_COMBO`, or `OPENAI_DIALOG_MODEL` resolution.

## Operational Notes

- Run this immediately after deploy or before investigating a live agent incident.
- Capture the `X-Agent-Release` value alongside the `requestId` from structured logs.
- If the parity check fails, do not trust behavior debugging until release parity is resolved first.
