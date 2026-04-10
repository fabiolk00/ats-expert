# CurrIA

## What This Is

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. It combines profile seeding, conversational resume analysis, job-targeted rewriting, ATS guidance, file generation, and credit-based billing inside a single authenticated workspace. This planning baseline treats the product as a brownfield system and focuses the next milestone on making the core funnel safe to launch.

## Core Value

A job seeker can reliably turn their real profile and a target role into an honest, ATS-ready resume output they can confidently download and use.

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

### Active

- [ ] Core launch funnel is reliable across auth, profile setup, agent chat, target resume creation, and artifact download.
- [ ] Billing settlement and credit behavior are validated end-to-end before launch.
- [ ] Production debugging is fast enough to diagnose failures in agent, billing, and profile import flows.

### Out of Scope

- PDF and DOCX profile upload onboarding - important, but secondary to launch hardening because the current funnel already supports LinkedIn and manual profile setup.
- New end-user product areas beyond the current funnel - avoid breadth before reliability.
- Native mobile apps and non-Brazilian localization - not required to validate the current market and launch path.

## Context

- The existing codebase is a Next.js 14 App Router monolith with Clerk auth, Supabase/Postgres persistence, Prisma migrations, OpenAI agent orchestration, Asaas billing, and LinkdAPI profile import.
- README and current docs show the product already covers analysis, rewriting, target resume creation, file generation, and paid plans.
- The highest-risk gaps are operational rather than breadth: no committed browser E2E suite, incomplete production-readiness checklist, CI/runtime env drift, and some fail-open configuration or logging behavior in fragile routes.
- Phase 1 closed the env-contract drift and fail-open configuration gaps, so the next bottleneck is proving the core journey in the browser and then validating live billing behavior in staging.
- Billing logic was recently updated to settlement-based processing, so launch work must preserve idempotency and credit correctness rather than redesign billing from scratch.
- The agent, billing, and profile import paths are already feature-rich but live in large or sensitive modules, so safer verification and observability are higher leverage than adding more surface area first.

## Constraints

- **Tech stack**: Stay within Next.js 14, React 18, TypeScript, Clerk, Supabase/Postgres, Prisma, OpenAI, Asaas, and the existing docs/testing toolchain - minimize architecture churn in a brownfield repo.
- **Reliability**: Changes must preserve canonical `cvState`, billing idempotency, and target-resume/history behavior - these are already established product contracts.
- **Security**: Failures around provider credentials, webhooks, and auth cannot be silent - the next milestone must reduce misconfiguration risk rather than mask it.
- **Testing**: Vitest coverage already exists, but launch confidence requires browser-level verification on top of it - do not replace existing tests; extend the stack.
- **Scope**: The milestone should improve launch readiness of the current product, not reopen product strategy or add large new feature pillars.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus the next milestone on launch hardening for the core funnel | The product already has breadth; the main gaps are verification, deployment safety, and diagnosability | Pending |
| Finish Phase 1 before adding browser coverage | Contract drift and fail-open provider behavior would have made browser failures noisy and misleading | Good |
| Treat current shipped capabilities as the validated baseline | This is a brownfield repo with working auth, profile, agent, billing, and file-generation flows | Good |
| Defer PDF profile upload until after core launch hardening | It is a visible onboarding gap, but less leverage than making the current funnel safe to ship | Pending |
| Prefer additive hardening over architectural rewrites | Large sensitive modules exist today; verification and observability reduce risk faster than broad refactors | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 1 completion*
