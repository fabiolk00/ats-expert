<!-- GSD:project-start source:PROJECT.md -->
## Project

CurrIA is an AI-powered resume optimization platform for Brazilian job seekers. The current milestone focus is launch hardening for the core funnel: auth, profile setup, agent analysis, target resume creation, billing correctness, and artifact download.

Core value: a user can reliably turn their real profile plus a target role into an honest, ATS-ready resume they can download and use.

Current priorities:
- Preserve the existing brownfield product surface unless the user explicitly changes scope.
- Prefer reliability, billing safety, observability, and verification over net-new feature breadth.
- Treat PDF profile upload and other onboarding expansion work as deferred unless reprioritized.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- Next.js 14 App Router with React 18 and TypeScript.
- Clerk for auth, Supabase/Postgres plus Prisma migrations for persistence, and Supabase Storage for artifacts.
- OpenAI powers the agent runtime, Asaas handles billing, Upstash supports rate limiting and webhook dedupe, and LinkdAPI powers LinkedIn import.
- Tailwind CSS plus shadcn-style UI primitives on the frontend; Vitest plus Testing Library for committed automated tests.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- Follow the surrounding file style; newer frontend files often use double quotes while backend and service modules often use single quotes.
- Use `@/*` imports, kebab-case filenames, camelCase functions, and named exports except where Next.js expects default exports.
- Keep route handlers thin, validate external input with `zod`, and prefer structured server logs through `logInfo`, `logWarn`, and `logError`.
- Treat `cvState` as canonical resume truth and `agentState` as operational context only; preserve dispatcher and `ToolPatch` patterns when changing agent flows.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- The app is a monolith: `src/app/**` holds pages and HTTP adapters, while `src/lib/**` contains domain logic.
- The most sensitive paths are the agent loop, billing/webhook handling, and profile import flow.
- Session state, resume versions, and targets are persisted server-side; the client should stay relatively shallow.
- Large orchestration modules already exist, so prefer small, test-backed changes over broad rewrites.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` - do not edit manually.
<!-- GSD:profile-end -->
