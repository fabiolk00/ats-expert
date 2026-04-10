---
title: Agent Route Stress
audience:
  - operators
  - developers
related:
  - ./agent-runtime-parity.md
  - ./agent-transcript-repro.md
  - ./launch-readiness.md
status: current
updated: 2026-04-10
---

# Agent Route Stress

Use this runbook when you need real concurrency or soak pressure against `POST /api/agent`.

This harness is meant for runtime pressure and latency evidence. It is different from the deterministic browser regressions:

- browser specs prove the UI and transcript contract
- `agent:stress-route` pressures the actual route with concurrent authenticated requests

## What It Measures

The stress artifact captures:

- HTTP status distribution
- total, successful, and failed request counts
- latency min, max, average, p50, and p95
- empty assistant text count
- stream error count
- new-session count
- safe provenance headers seen during the run

It also keeps sample request records so you can inspect representative failures without storing every raw response.

## Safety Notes

- If you do not pass `--session-id` or `--session-ids`, the harness sends requests without `sessionId`.
- That creates new sessions and may consume credits.
- For deployed environments, prefer reusing a pool of existing session IDs when you want route pressure without creating more sessions.
- Run `npm run agent:parity` first if you are testing a deployment and need confidence about which build is serving traffic.

## Local Example

This uses the test-only E2E auth seam already wired into the local dev server:

```bash
npm run agent:stress-route -- \
  --url http://127.0.0.1:3000 \
  --e2e-secret curria-e2e-secret \
  --e2e-credits 120 \
  --concurrency 6 \
  --requests 24 \
  --message-profile long_vacancy \
  --format markdown
```

Notes:

- `--e2e-secret` bootstraps a local cookie automatically through `/api/e2e/auth`
- `--e2e-credits` gives the local synthetic user enough balance for create-session runs
- `--message-profile long_vacancy` stresses the near-limit vacancy payload

## Deployed Example

For a real environment, export an authenticated cookie from the browser and reuse known sessions:

```bash
npm run agent:stress-route -- \
  --url https://your-app.example.com \
  --cookie "__session=..." \
  --session-ids sess_a,sess_b,sess_c,sess_d \
  --concurrency 8 \
  --duration-ms 120000 \
  --message-profile follow_up \
  --format json \
  --output test-results/agent-stress.json
```

This mode is better for deployments because it avoids creating brand-new sessions on every request.

## Long Vacancy File Input

If you want to pressure the route with a specific vacancy instead of the built-in profiles, provide a file:

```bash
npm run agent:stress-route -- \
  --url https://your-app.example.com \
  --cookie "__session=..." \
  --session-ids sess_a,sess_b \
  --concurrency 4 \
  --requests 16 \
  --message-file tmp/very-long-vacancy.txt
```

## Interpreting Results

- `PASS` means every captured request completed with a non-empty assistant response and no route-level stream errors.
- `FAIL` means at least one request failed, returned empty assistant text, or surfaced an explicit route/SSE error.

Common patterns:

- many `429` responses:
  you are hitting route limits or session caps and need more session IDs or lower concurrency
- rising p95 with mostly `200`:
  the route is surviving but latency is degrading under load
- empty assistant text with `200`:
  the route completed but response continuity degraded and needs investigation
- mixed release or model headers:
  deployment parity is unstable; resolve that before trusting the stress result

## Suggested Workflow

1. Run `npm run agent:parity` for the target deployment.
2. Run `npm run agent:stress-route` with either reused sessions or explicit local E2E auth.
3. If failures appear, follow with `npm run agent:replay-dialog` on one affected session pattern to inspect the visible SSE behavior in more detail.
