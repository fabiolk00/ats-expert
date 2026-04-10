# CurrIA

## What This Is

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. It combines profile seeding, conversational resume analysis, job-targeted rewriting, ATS guidance, file generation, and credit-based billing inside a single authenticated workspace. This planning baseline treats the product as a brownfield system and focuses the current milestone on making the existing launch funnel safe to ship.

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
- [x] Phase 2: Browser verification covers auth, manual profile setup, session creation, target outcome, preview readiness, artifact delivery, and CI gating for the core funnel.
- [x] Phase 3: Billing settlement, replay safety, and dashboard credit totals are validated end-to-end with live evidence.
- [x] Phase 4: Production debugging is fast enough to diagnose agent, billing, session, file, webhook, and profile import failures, and the core funnel now surfaces safer actionable error states.

### Active

No active launch-hardening requirements remain in this milestone.

### Out of Scope

- PDF and DOCX profile upload onboarding - important, but secondary to launch hardening because the current funnel already supports LinkedIn and manual profile setup.
- New end-user product areas beyond the current funnel - avoid breadth before reliability.
- Native mobile apps and non-Brazilian localization - not required to validate the current market and launch path.

## Context

- The existing codebase is a Next.js 14 App Router monolith with Clerk auth, Supabase/Postgres persistence, Prisma migrations, OpenAI agent orchestration, Asaas billing, and LinkdAPI profile import.
- README and current docs show the product already covers analysis, rewriting, target resume creation, file generation, and paid plans.
- The highest-risk gaps are operational rather than breadth: launch confidence now depends most on live billing validation and diagnosable failure handling.
- Phase 1 closed the env-contract drift and fail-open configuration gaps, Phase 2 closed the browser verification gap with a committed Playwright lane plus CI coverage, and Phase 3 added live billing evidence for settlement, replay, and display-balance correctness.
- Phase 4 completed the launch-hardening milestone with structured diagnostics on fragile routes, safer user-facing degradation states, and a controlled-launch handoff in repo docs.
- Billing logic was recently updated to settlement-based processing, and the live Phase 3 proof confirmed the current contract without requiring runtime billing remediation.
- The agent, billing, and profile import paths are already feature-rich but live in large or sensitive modules, so safer verification and observability are higher leverage than adding more surface area first.

## Constraints

- **Tech stack**: Stay within Next.js 14, React 18, TypeScript, Clerk, Supabase/Postgres, Prisma, OpenAI, Asaas, and the existing docs/testing toolchain - minimize architecture churn in a brownfield repo.
- **Reliability**: Changes must preserve canonical `cvState`, billing idempotency, and target-resume/history behavior - these are already established product contracts.
- **Security**: Failures around provider credentials, webhooks, and auth cannot be silent - the milestone should reduce misconfiguration and auth risk rather than mask it.
- **Testing**: Vitest coverage already exists, and launch confidence now depends on keeping the committed Playwright lane green alongside it.
- **Scope**: The milestone should improve launch readiness of the current product, not reopen product strategy or add large new feature pillars.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus the next milestone on launch hardening for the core funnel | The product already has breadth; the main gaps are verification, deployment safety, and diagnosability | Good |
| Finish Phase 1 before adding browser coverage | Contract drift and fail-open provider behavior would have made browser failures noisy and misleading | Good |
| Use a mocked-provider Playwright lane with a signed E2E auth seam and stable UI hooks | The core funnel needed deterministic browser proof that still exercised real product state and artifact delivery | Good |
| Treat current shipped capabilities as the validated baseline | This is a brownfield repo with working auth, profile, agent, billing, and file-generation flows | Good |
| Defer PDF profile upload until after core launch hardening | It is a visible onboarding gap, but less leverage than making the current funnel safe to ship | Pending |
| Prefer additive hardening over architectural rewrites | Large sensitive modules exist today; verification and observability reduce risk faster than broad refactors | Good |
| End the milestone with a controlled-launch recommendation, not a blanket all-clear | The funnel is launch-ready, but early operator monitoring still matters for billing and third-party import incidents | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements validated? -> Move to Validated with phase reference
2. Remaining launch blockers? -> Keep in Active
3. Decisions to log? -> Add to Key Decisions
4. Context drifted? -> Update What This Is and Context

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 4 completion*
