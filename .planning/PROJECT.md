# CurrIA

## What This Is

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. It already ships the core funnel for profile seeding, conversational resume analysis, job-targeted rewriting, file generation, and paid usage, and the current milestone focuses on making the agent experience reliable under real dialog pressure after the launch-hardening baseline shipped.

## Core Value

A job seeker can reliably turn their real profile and a target role into an honest, ATS-ready resume output they can confidently download and use.

## Current Milestone: v1.1 Agent Reliability and Response Continuity

**Goal:** Prove what code and model configuration the live `/api/agent` route is serving, then eliminate truncation-driven repetition so rewrite follow-ups stay useful and trustworthy.

**Target features:**
- Deployment and runtime evidence that identifies the live agent route version, selected model, and recovery path for a real request.
- Dialog-turn hardening so requests like `reescreva` produce an actual rewrite or a non-repetitive continuation instead of reusing the vacancy bootstrap.
- End-to-end transcript and SSE verification that proves the user-visible chat output matches the backend recovery behavior.

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

- [ ] Team can prove which code and config the live `/api/agent` route is serving during a real chat request.
- [ ] A dialog follow-up like `reescreva` returns a concrete rewrite or a non-repetitive continuation instead of repeating earlier vacancy bootstrap copy.
- [ ] Streamed chat transcripts preserve one coherent assistant turn per request, even when truncation recovery or fallback paths fire.
- [ ] Automated verification covers deployment parity, model selection, truncation recovery, and final rendered chat output through the real route seams.

### Out of Scope

- PDF and DOCX profile upload onboarding - still valuable, but secondary to fixing trust-eroding agent continuity in the existing funnel.
- New premium feature pillars or broad prompt redesign - this milestone is about reliability and debuggability of the current agent, not widening scope.
- Native mobile apps and non-Brazilian localization - not needed to diagnose or harden the current web agent experience.

## Context

- The existing codebase is a Next.js 14 App Router monolith with Clerk auth, Supabase/Postgres persistence, Prisma migrations, OpenAI agent orchestration, Asaas billing, and LinkdAPI profile import.
- v1.0 already hardened launch-critical configuration, browser verification, billing settlement validation, and structured observability around the existing funnel.
- A live user transcript now shows a different failure mode from the earlier empty-fallback bug: a short follow-up in `dialog` (`reescreva`) still hits repeated `finishReason: "length"` completions and the visible assistant reply repeats the earlier vacancy acknowledgment instead of continuing the rewrite.
- The affected live logs do not include the newer `model`, `assistantTextChars`, or `fallbackKind` fields now present in the repo's agent loop, which strongly suggests runtime parity between current code and the deployed environment is not yet proven.
- The highest-leverage next work is therefore not new product breadth, but proving deployment parity, tightening dialog recovery, and verifying the backend and frontend agree on the final rendered transcript.

## Constraints

- **Tech stack**: Stay within Next.js 14, React 18, TypeScript, Clerk, Supabase/Postgres, Prisma, OpenAI, Asaas, and the existing docs/testing toolchain - minimize architecture churn in a brownfield repo.
- **Deployment parity**: Any fix must make it obvious which commit, config, and model selection reached the live route - otherwise repeated-chat reports stay ambiguous.
- **Reliability**: Changes must preserve canonical `cvState`, persisted session history, and existing billing/session contracts while hardening the dialog flow.
- **Testing**: v1.0 already established Vitest plus Playwright as repo contracts, so agent fixes should land with route-level and transcript-level regression proof instead of local-only reasoning.
- **Scope**: This milestone should improve confidence in the current agent experience, not reopen launch-hardening work that is already validated or add major new product pillars.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus v1.1 on agent reliability and response continuity before new product breadth | The most visible live issue is user trust erosion from repeated or truncated agent replies, not missing surface area | Pending |
| Continue phase numbering from 5 | Preserves continuity with the shipped v1.0 roadmap and keeps milestone history easy to follow | Good |
| Include milestone research before defining requirements | The issue spans deployment parity, model routing, truncation recovery, and transcript rendering, so a small research pass reduces guesswork | Good |
| Treat v1.0 launch hardening as the validated baseline | The next milestone should build on the shipped reliability work instead of re-planning it | Good |
| Require end-to-end transcript proof, not only loop-level tests | The user-facing bug is about what appears in chat, so backend correctness alone is not enough | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements validated? -> Move to Validated with phase reference
2. Remaining blockers? -> Keep in Active
3. Decisions to log? -> Add to Key Decisions
4. Context drifted? -> Update What This Is and Context

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after starting milestone v1.1*
