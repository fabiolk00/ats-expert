# Scripts

Operational scripts live here so they stay separate from the application runtime.

## Available scripts

### `npm run phase1:model-selection`

Runs the OpenAI model-selection bakeoff defined in [run-openai-model-selection-phase1.ts](./run-openai-model-selection-phase1.ts).

- Purpose: generate blind-review packets comparing the configured model combinations
- Requires: `.env` with `OPENAI_API_KEY`
- Output: timestamped files under `docs/openai-model-selection-runs/` plus a `latest/` copy

### `npm run agent:baseline`

Generates a 7-day OpenAI cost and generation baseline using production data sources.

- Purpose: capture median token/cost usage before trying any agent-model promotion
- Requires: `.env` with Supabase admin credentials
- Output: timestamped files under `docs/openai-baselines/` plus a `latest/` copy

### `scripts/verify-staging.sh`

Checks whether the staging environment is ready for billing and webhook validation.

- Purpose: operator preflight for the Phase 1 and Phase 3 staging proof path
- Requires: Bash, `psql`, a real `curl` binary, and a populated `.env.staging` copied from `.env.staging.example`
- Verifies: required staging vars, database access, billing tables, billing RPC functions, staging API reachability, Asaas webhook/access tokens, and the staging test user
- Typical use:

```bash
bash scripts/verify-staging.sh
```

### `scripts/replay-staging-asaas.ts`

Replays named settlement scenarios against the staging Asaas webhook endpoint.

- Purpose: committed Phase 3 operator helper for replaying billing scenarios without hand-editing payloads each time
- Requires: `npx tsx`, `.env.staging`, and a staging deployment that accepts `/api/webhook/asaas`
- Supports:
  - `--list-scenarios`
  - `--scenario <name>`
  - `--dry-run`
  - `--output <file>`
  - identifier overrides such as `--payment`, `--subscription`, `--checkout`, and `--app-user`
- Typical use:

```bash
npx tsx scripts/replay-staging-asaas.ts --list-scenarios
npx tsx scripts/replay-staging-asaas.ts --scenario one_time_settlement --dry-run --checkout chk_demo --payment pay_demo
npx tsx scripts/replay-staging-asaas.ts --scenario duplicate_delivery --checkout chk_live --payment pay_live --output .planning/phases/03-billing-settlement-validation/03-SCENARIO-RESPONSES.json
```

### `scripts/check-staging-billing-state.ts`

Captures a JSON snapshot of the billing rows associated with a staging user, checkout, or subscription.

- Purpose: Phase 3 evidence helper for pairing webhook responses with actual DB state
- Requires: `npx tsx`, `psql`, `.env.staging`, and at least one filter flag
- Outputs:
  - `billing_checkouts`
  - `credit_accounts`
  - `user_quotas`
  - `processed_events`
- Typical use:

```bash
npx tsx scripts/check-staging-billing-state.ts --help
npx tsx scripts/check-staging-billing-state.ts --user usr_staging_001
npx tsx scripts/check-staging-billing-state.ts --checkout chk_live_001
```

## Guidance

- Keep scripts here focused on operator workflows, validation, or one-off engineering support tasks.
- If a script becomes part of the product runtime, move it under `src/` or wire it through a first-class app command instead.

## Phase 1 proof set

### Repo-local proof

```bash
npm run typecheck
npm test
```

### Live staging proof

```bash
bash scripts/verify-staging.sh
npx tsx scripts/replay-staging-asaas.ts --list-scenarios
npx tsx scripts/check-staging-billing-state.ts --help
```
