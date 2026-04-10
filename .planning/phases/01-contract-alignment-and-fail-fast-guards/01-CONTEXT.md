# Phase 1: Contract Alignment and Fail-Fast Guards - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase eliminates silent configuration drift across runtime, CI, and staging for the launch-critical provider contracts that power CurrIA's core funnel. It clarifies which environment variable names are canonical, where missing configuration must fail early, and what proof is required before Phase 1 is considered complete. It does not add new product capabilities or perform a broad architecture refactor.

</domain>

<decisions>
## Implementation Decisions

### Env contract cutover
- **D-01:** Keep the current runtime env names as the canonical contract and align CI, docs, and verification steps to those names.
- **D-02:** Use a hard cutover in this phase with no legacy alias support or silent fallback names.
- **D-03:** Scope the contract-alignment pass to launch-critical providers only: Asaas, Upstash, OpenAI, Supabase, and Clerk.

### Fail-fast scope
- **D-04:** Required launch-critical configuration must fail fast in every non-test environment, including local dev, preview, staging, and production.
- **D-05:** Truly optional integrations must be explicitly modeled as optional; they should not inherit silent degraded behavior by accident.

### Validation bar
- **D-06:** Phase 1 is not complete after code and docs cleanup alone; it must end with a strong proof set.
- **D-07:** The proof set must include aligned env contracts, fail-fast validation in code, updated docs/templates, and runnable verification that proves the contract works in local and CI contexts.

### Refactor shape
- **D-08:** Favor targeted hardening in existing modules over a broad shared-config refactor.
- **D-09:** Only centralize validation primitives if duplication becomes clearly harmful during implementation; otherwise keep changes local to the modules already owning each provider contract.

### the agent's Discretion
- Exact mechanism for runnable verification, as long as it provides a concrete proof set for local and CI contexts.
- Whether small shared helpers are introduced to remove clearly harmful duplication without expanding Phase 1 into a broader architecture project.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and project scope
- `.planning/PROJECT.md` - Project-level launch-hardening priority, constraints, and active requirements context.
- `.planning/REQUIREMENTS.md` - Phase-mapped requirements `OPS-01`, `OPS-02`, and `OPS-03`.
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and boundaries.
- `.planning/STATE.md` - Current focus, blockers, and project memory.
- `.planning/codebase/CONCERNS.md` - Existing known env-drift and fail-open risks already identified in the brownfield audit.

### Environment and release docs
- `docs/ENVIRONMENT_SETUP.md` - Current environment-variable guidance and template expectations.
- `docs/PRODUCTION-READINESS-CHECKLIST.md` - Deploy prerequisites and runtime validation expectations tied to launch readiness.
- `docs/staging/VALIDATION_PLAN.md` - Current staging validation flow for billing and contract verification.

### Runtime and CI touchpoints
- `.github/workflows/ci.yml` - Current CI env block and test pipeline contract.
- `src/lib/openai/client.ts` - OpenAI client initialization and current `test-key` fallback behavior.
- `src/lib/asaas/client.ts` - Asaas runtime contract and token usage.
- `src/lib/rate-limit.ts` - Upstash runtime contract for rate limiting.
- `src/app/api/webhook/clerk/route.ts` - Upstash and Clerk webhook contract plus current non-null assertion behavior.
- `src/lib/db/supabase-admin.ts` - Existing explicit fail-fast pattern for Supabase admin configuration.
- `src/middleware.ts` - Clerk publishable-key-dependent behavior and request-time config usage.

[If more env or release docs are discovered during planning, they should be added here before implementation begins.]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/supabase-admin.ts`: already shows the preferred explicit-throw pattern when required env vars are missing.
- `src/lib/openai/client.ts#resolveOpenAIBaseUrl`: existing normalization helper that can stay local while fail-fast behavior is tightened around API key requirements.
- `src/lib/observability/structured-log.ts`: existing structured logging helper available if validation failures need consistent server diagnostics.

### Established Patterns
- Provider clients currently own their own env access rather than reading from a shared config module; this supports the chosen targeted-hardening approach.
- Some critical paths already throw explicitly on missing config, while others still rely on non-null assertions or permissive fallbacks. Phase 1 should standardize behavior without forcing a full architecture rewrite.
- CI keeps provider settings in a single workflow env block, so contract cleanup will need coordinated changes across runtime code, docs, and the workflow file.

### Integration Points
- CI contract changes center on `.github/workflows/ci.yml`.
- Runtime contract hardening centers on `src/lib/openai/client.ts`, `src/lib/asaas/client.ts`, `src/lib/rate-limit.ts`, `src/app/api/webhook/clerk/route.ts`, and `src/lib/db/supabase-admin.ts`.
- Release proof and operator guidance connect through `docs/ENVIRONMENT_SETUP.md`, `docs/PRODUCTION-READINESS-CHECKLIST.md`, and `docs/staging/VALIDATION_PLAN.md`.

</code_context>

<specifics>
## Specific Ideas

- Prefer explicit failure over compatibility shims for launch-critical configuration.
- Treat local development as part of the safety boundary for required config, not a special case where silent degradation is acceptable.
- Keep the phase anchored on contract clarity and proof, not on designing a new configuration subsystem.

</specifics>

<deferred>
## Deferred Ideas

- Full repository-wide env-contract standardization beyond launch-critical providers - worth considering later, but out of scope for this phase.
- Centralized shared config-validation layer - only revisit if targeted hardening reveals enough duplication to justify its own phase.

</deferred>

---

*Phase: 01-contract-alignment-and-fail-fast-guards*
*Context gathered: 2026-04-09*
