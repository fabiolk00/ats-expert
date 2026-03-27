# CurrIA

CurrIA is a resume optimization SaaS built on Next.js, Clerk, Supabase, Anthropic, and Asaas. The current system uses an internal app-user model, canonical structured resume state, patch-based agent tools, and persisted file-generation metadata.

## What exists today
- Internal user model: `users` + `user_auth_identities`
- Runtime credits in `credit_accounts`
- Asaas webhook idempotency with processed delivery tracking
- Session state split into:
  - `cvState`
  - `agentState`
  - `generatedOutput`
- Patch-based tool dispatch
- Canonical `rewrite_section` persistence
- Canonical `generate_file` pipeline
- Immutable `cv_versions` snapshots
- Structured gap analysis
- Multi-target derived resumes in `resume_targets`
- Manual canonical base-section editing with versioned persistence
- End-to-end session state evolution coverage

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in real values.

### 3. Run the app
```bash
npm run dev
```

### 4. Verify locally
```bash
npm run typecheck
npm test
npm run lint
```

## Core architecture

### Identity
- Clerk authenticates the user.
- Runtime code resolves the request to an internal app user via `src/lib/auth/app-user.ts`.
- Domain logic should use app user IDs, not Clerk IDs.

### Session state
- `cvState`: canonical resume truth
- `agentState`: operational context such as parsed text and rewrite metadata
- `generatedOutput`: artifact metadata only
- `stateVersion`: top-level version for the session state bundle
- `cv_versions`: immutable snapshots of trusted `cvState` milestones
- `resume_targets`: target-specific derived resume states kept separate from the base canonical resume

### Tool pipeline
- Tools return `{ output, patch? }`
- `dispatchTool()` persists session patches through `applyToolPatchWithVersion()`
- The merged state updates both the database and the in-memory session snapshot
- First canonical ingestion and canonical rewrites create immutable CV versions
- Gap analysis is validated before it is stored
- Target-specific resumes are derived and persisted without overwriting the base `cvState`

### Credits
- `credit_accounts` is the runtime source of truth
- `/api/agent` consumes one credit when creating a new session
- Existing sessions do not consume more credits per message

## Implemented API routes
- `POST /api/agent`
- `GET /api/session`
- `POST /api/session` returns `403`
- `GET /api/session/[id]/messages`
- `GET /api/session/[id]/versions`
- `GET /api/session/[id]/targets`
- `POST /api/session/[id]/targets`
- `POST /api/session/[id]/manual-edit`
- `GET /api/file/[sessionId]`
- `POST /api/checkout`
- `POST /api/webhook/asaas`
- `POST /api/webhook/clerk`
- `GET /api/cron/cleanup`

## Resume history and targeting

### CV versioning
- `cv_versions` stores immutable `CVState` snapshots
- current sources:
  - `ingestion`
  - `rewrite`
  - `manual`
  - `target-derived`
- raw parsed resume text is never stored in version snapshots

### Manual canonical edits
- Manual edits currently apply only to base `session.cvState`
- One canonical section may be edited at a time:
  - `contact`
  - `summary`
  - `skills`
  - `experience`
  - `education`
  - `certifications`
- Valid manual edits persist through the same controlled patch flow and create `cv_versions` entries with source `manual` only when canonical state actually changes
- Target-specific manual edits are intentionally deferred; they should be modeled later as `resume_targets`-owned edit flows rather than mutations to base `cvState`

### Gap analysis
- `analyze_gap` compares canonical `cvState` against a target job description
- output is structured and validated
- the latest result is stored in `agentState.gapAnalysis`

### Multi-target resumes
- one session owns one canonical base `cvState`
- multiple target-specific variants can coexist in `resume_targets`
- each target stores:
  - target job description
  - derived `cvState`
  - optional structured gap analysis
  - optional generated artifact metadata for target-specific files
  - timestamps
- target creation must not overwrite the base canonical resume

### File generation
- Base resume generation persists artifact metadata in `session.generatedOutput`
- Target resume generation persists artifact metadata in `resume_targets.generatedOutput`
- `GET /api/file/[sessionId]` serves the base artifact by default
- `GET /api/file/[sessionId]?targetId=<resumeTargetId>` serves a target-derived artifact for the same owned session
- signed URLs are minted on demand and are never persisted

## Important docs
- [CLAUDE.md](/C:/CurrIA/CLAUDE.md)
- [Architecture Overview](/C:/CurrIA/docs/architecture-overview.md)
- [State Model](/C:/CurrIA/docs/state-model.md)
- [Tool Development Guide](/C:/CurrIA/docs/tool-development.md)

## Commands
```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:push
npm run db:migrate
npm run db:studio
```
