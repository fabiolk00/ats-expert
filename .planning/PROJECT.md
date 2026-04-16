# CurrIA

## What This Is

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. It ships the core funnel for profile seeding, conversational analysis, deterministic ATS enhancement, deterministic target-job rewriting, artifact generation, and paid usage. The current brownfield baseline now includes milestone-audit-compatible verification artifacts, durable archive metadata checks, and stronger freeform vacancy targeting before the next runtime refactor lands.

## Core Value

A job seeker can reliably turn their real profile and a target role into an honest, ATS-ready resume output they can confidently download and use.

## Current State

**Latest shipped version:** `v1.5 Verification Closure and Runtime Residuals` shipped on 2026-04-16.

**What is now true:**
- live `/api/agent` traffic exposes provenance and follows a documented parity contract
- resume-only flows run a deterministic ATS-enhancement pipeline
- resume-plus-job flows run a deterministic target-job rewrite pipeline
- `/dashboard/resume/new` branches by context instead of forcing ATS only
- OpenAI and PDF ingestion paths have stronger resilience and clearer failure modes
- security, billing, file-access, and JSON persistence boundaries are more explicit and test-backed
- the main agent route now exposes first-response timing evidence, earlier existing-session progress, reduced ATS chat blocking, deterministic continuation fast paths, and phase-specific runtime budgets
- milestone audit can now consume committed `VERIFICATION.md` artifacts instead of relying on summary-only inference
- milestone closeout metadata, decimal-phase archive counts, and next-cycle planning resets now have repo-native proof
- freeform vacancy targeting now derives usable context from arbitrary pasted job text with stronger rewrite grounding

## Current Milestone

Current milestone: `v1.6 Async Agent Orchestration and Background Job Runtime` started on 2026-04-16.

**Goal:** Make `/api/agent` a lightweight orchestrator and move ATS enhancement, target-job rewriting, and artifact generation behind durable async execution without changing the current UX, billing rules, or rewrite semantics.

**Target features:**
- freeze shared async execution contracts for actions, jobs, status lifecycle, and resume source-of-truth rules before implementation diverges
- keep lightweight chat synchronous while `/api/agent` classifies actions and dispatches heavy work to async jobs
- move ATS enhancement, target-job rewriting, and artifact generation out of the synchronous request path with persisted job state, stage progress, and retry-safe failure handling
- keep `cvState`, `optimizedCvState`, previews, and generated artifacts consistent and traceable to the exact snapshot used

## Next Milestone Goals

- prove the async execution model under realistic concurrent load once the new job runtime is in place
- decide later whether richer cancellation, retry controls, or UI progress affordances are worth productizing after the core background-job contract is stable
- continue prioritizing reliability, billing safety, observability, and verification over unrelated feature breadth

## Requirements

### Validated

- [x] User can authenticate, reach the workspace, and resume intended flows after login or signup.
- [x] User can seed a canonical profile from LinkedIn or manual editing and reuse it in new sessions.
- [x] User can run conversational resume analysis and section rewriting against persisted session state.
- [x] User can create job-targeted resume variants without overwriting the base resume.
- [x] User can generate DOCX and PDF resume artifacts from current resume state.
- [x] Paid usage can be enforced through credit-backed session creation and Asaas billing flows.
- [x] Paid users can track job applications inside the dashboard.
- [x] Phase 1: Runtime, CI, and operator docs share the same provider contract and fail fast on missing critical configuration.
- [x] Phase 2: Browser verification covers auth, manual profile setup, session creation, target outcome, preview readiness, artifact delivery, and CI gating for the core funnel.
- [x] Phase 3: Billing settlement, replay safety, and dashboard credit totals are validated end to end with live evidence.
- [x] Phase 4: Production debugging is fast enough to diagnose agent, billing, session, file, webhook, and profile import failures, and the core funnel now surfaces safer actionable error states.
- [x] Phase 5: `/api/agent` now exposes release provenance, a safe parity CLI and runbook exist, and automated coverage protects the runtime evidence contract.
- [x] Phase 6: Dialog follow-ups now preserve rewrite intent, degraded recovery avoids stale vacancy-bootstrap repetition, and `dialog` plus `confirm` share one explicit model-routing contract.
- [x] Phase 7: The visible chat transcript now stays coherent through recovery paths, route-to-UI and Chromium transcript regressions are committed, and operators can replay the representative incident with provenance-aware evidence.
- [x] Phase 8: Resume-only sessions now run deterministic ATS enhancement with persisted optimized snapshots and export-aware versioning.
- [x] Phase 9: ATS enhancement now has section-aware retries, stronger validation, and structured observability.
- [x] Phase 10: Resume-plus-job sessions now run deterministic target-job rewriting with targeting plans, factual validation, and target-linked persistence.
- [x] Phase 11: `/dashboard/resume/new` now chooses ATS enhancement or target-job adaptation by context through one smart generation entrypoint.
- [x] Phase 12: OpenAI and PDF import paths now fail more safely through circuit-breaker protections and async PDF processing.
- [x] Phase 13: LGPD handling, secret boundaries, and the E2E auth bypass now have stronger contracts and verification.
- [x] Phase 14: TypeScript-aware quality gates and test visibility are documented and enforced at a useful baseline.
- [x] Phase 15: Session persistence is split across narrower internal modules instead of one large orchestration file.
- [x] Phase 16: Middleware, webhook, and file-access security boundaries now have committed fail-closed proof.
- [x] Phase 17: Billing settlement, replay, and webhook invariants now have focused regression proof.
- [x] Phase 18: File-access ownership and storage or RLS boundary claims are now explicitly separated and documented.
- [x] Phase 19: High-value JSON persistence seams now have an explicit contract matrix and narrower typed repository boundaries.
- [x] Phase 20: The repo exposes a safe dead-code detection toolchain for imports, exports, orphan files, and dependencies.
- [x] Phase 21: Unused imports and low-risk unused locals can be removed automatically or near-automatically in agreed scopes.
- [x] Phase 22: Unused exports, orphan files, and packages can be inventoried and reduced with manual verification for dynamic runtime seams.
- [x] Phase 23: Sustained code-hygiene enforcement is documented and wired into lint, TypeScript, editor, or CI flows only after the repo is clean enough to support it.
- [x] Phase 24: The repo can measure request-stage latency for user-visible agent flows, including first SSE emission and first useful assistant response timing.
- [x] Phase 25: Chat interactions respond faster in practice through reduced blocking work before visible output.
- [x] Phase 26: ATS enhancement flows complete faster by removing or deferring non-essential synchronous work without compromising canonical state or billing safety.
- [x] Phase 27: The milestone ended with before or after latency proof, focused regression verification, and autonomous execution guidance that keeps future work aligned to response-time priorities.
- [x] Phase 28: The agent route front half now delegates message preparation, vacancy detection, and pre-loop setup through smaller services with targeted regression proof.
- [x] Phase 29: Recovery, streaming, and persistence now live behind narrower runtime seams with direct handoff tests.
- [x] Phase 30: Checkout and sensitive authenticated mutations now enforce canonical-host or trusted-browser boundaries with committed regression proof.
- [x] Phase 31: Long-vacancy generation and release-critical browser stability are protected by committed regression and CI gates.
- [x] Phase 31.1: Non-E2E runtime defaults, artificial delay removal, and CI-visible profiling proof now exist, with residual runtime debt explicitly documented.
- [x] Phase 32: The `v1.4` archive now includes committed `VERIFICATION.md` artifacts and milestone audit no longer fails on missing-proof fallback.
- [x] Phase 33: Milestone summaries, decimal-phase counts, and next-cycle planning state now have a repo-native metadata checker and aligned archive narrative.
- [x] Phase 34: The dominant residual suite was reduced materially and the repo now gates it through an explicit resume-builder runtime budget check.
- [x] Phase 35: Effective optimized-state selection now keeps follow-up rewrites and target resume derivation aligned with the deterministic ATS and job-targeting contract.
- [x] Phase 36: Job targeting now uses semantic vacancy focus, low-confidence role fallback, and supported-skill sanitization to stay useful under arbitrary pasted vacancy text.

### Active

- [ ] `/api/agent` stays the main public entry point while lightweight chat remains synchronous and heavy actions are dispatched to async jobs.
- [ ] ATS enhancement, target-job rewriting, and artifact generation run outside the request path with persisted lifecycle, stage, and progress state.
- [ ] Async execution preserves previous valid optimized snapshots on failure and keeps preview plus artifact output traceable to the exact selected source snapshot.
- [ ] Operators and regression coverage can observe dispatch, status, retries, and completion without changing credits logic or business rules.

### Out of Scope

- broad onboarding expansion such as PDF profile upload unless it becomes required to unblock the current hardening work
- a full product-surface redesign while the milestone is focused on orchestration, execution safety, and runtime scalability
- credits or billing-model redesign instead of preserving the existing brownfield billing contract
- changing ATS rewrite rules, target-job semantics, or artifact generation rules instead of moving them behind async execution

## Context

- The codebase is a Next.js 14 App Router monolith with Clerk auth, Supabase/Postgres persistence, Prisma migrations, OpenAI agent orchestration, Asaas billing, and LinkdAPI profile import.
- v1.3 established latency evidence, reduced visible blocking work, tightened runtime budgets, and hardened adjacent performance-sensitive routes.
- v1.4 extracted the agent route into narrower seams for setup, recovery, streaming, and persistence while tightening authenticated-route and billing trust boundaries.
- v1.5 closed the verification gap for recent milestones, hardened archive metadata integrity, and narrowed residual runtime debt into explicit proof.
- The next cycle should build on the existing agent seams and deterministic resume pipelines instead of redesigning the product surface.
- The repo already has ESLint, Prettier, TypeScript, Vitest, and Playwright, so the milestone should deepen focused proof rather than introduce a separate toolchain.

## Constraints

- **Tech stack**: Stay within Next.js 14, React 18, TypeScript, Clerk, Supabase/Postgres, Prisma, OpenAI, Asaas, and the existing docs and testing toolchain.
- **Canonical state**: Preserve `cvState` as product truth and keep `agentState` operational only, even while moving heavy execution out of the request path.
- **Business semantics**: Do not change credits logic, ATS rewrite rules, target-job rules, or artifact generation rules during the refactor.
- **Security**: Fail closed on authenticated and billing-sensitive route mutations, external return handling, and trust-boundary validation.
- **Brownfield discipline**: Favor small, test-backed extractions and explicit contracts rather than broad rewrites or UX redesign.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep `/api/agent` as the main public entry point for chat and heavy actions | The product shape should remain familiar while the execution model changes behind the boundary | Good |
| Freeze shared async execution contracts before splitting work across the orchestrator and job runtime | Parallel implementation is safer when action types, job types, lifecycle state, and source-of-truth rules are explicit first | Good |
| Move ATS enhancement, target-job rewriting, and artifact generation behind durable async jobs while preserving business semantics | The bottleneck is request-path execution, not the existing product rules | Good |
| Keep lightweight chat synchronous and use SSE for acknowledgments plus status rather than trapping the whole heavy lifecycle in one request | The user experience should stay responsive even as heavy work becomes background execution | Good |
| Persist job state explicitly and preserve previous valid optimized snapshots on failure | Async work needs durable observability and must not clobber good resume state when a later run fails | Good |
| Focus v1.4 on agent modularization, trust-boundary hardening, and release stability before new feature breadth | The current highest leverage is making critical brownfield flows safer to evolve and safer to trust | Good |
| Replace raw-origin trust with canonical host configuration and explicit origin or CSRF checks | Sensitive mutations and billing flows should not depend on untrusted request metadata | Good |
| Raise CI and regression gates around workspace, preview, and long vacancy generation before expanding scope | Operational confidence depends on catching user-visible release regressions before deployment | Good |
| Default non-E2E tests to `node` and use named profiling proof in CI | The suite should expose runtime waste early without paying browser cost where DOM is unnecessary | Good |
| Treat archive metadata and decimal phases as a first-class closeout contract with repo-native proof | Milestone summaries, counts, and next-cycle state should not require manual repair after shipping | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions.
5. "What This Is" still accurate? Update if it drifted.

**After each milestone**:
1. Review current shipped state.
2. Validate whether Core Value still holds.
3. Start the next milestone from fresh requirements.
4. Archive prior roadmap and requirements before expanding scope again.

---
*Last updated: 2026-04-16 when milestone v1.6 was initialized*
