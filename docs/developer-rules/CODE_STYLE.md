---
title: CurrIA Code Style Rules
audience: [developers]
related: [README.md, API_CONVENTIONS.md, TESTING.md]
status: current
updated: 2026-04-01
---

# Code Style Rules

Back to [Developer Rules](./README.md) | [All Docs](../INDEX.md)

## TypeScript

- Use strict TypeScript.
- No `any`.
- No `// @ts-ignore`.
- Prefer `type` over `interface` for data shapes.
- Validate external input explicitly with Zod or equivalent typed guards.

## Architecture-aware rules

- Use internal app user IDs in domain logic, not Clerk IDs.
- Treat `cvState` as canonical structured resume truth.
- Treat `agentState` as operational context only.
- Treat `generatedOutput` as artifact metadata only.
- Tool-originated state changes must return `ToolPatch`; do not mutate `session` directly.
- Do not persist signed URLs in `generatedOutput`.

## React / Next.js

- Server Components by default.
- Add `"use client"` only when required.
- Keep data writes in route handlers or server actions.
- Use `react-hook-form` + Zod when forms have non-trivial validation.

## Styling

- Tailwind only.
- Use `cn()` for conditional class merging.
- Keep breakpoints mobile-first.

## Formatting

- Prefer the committed Prettier baseline for touched files.
- Run `pnpm format:check` before merge when you touch docs, config, or mixed-format files.
- Avoid repo-wide formatting churn unless a dedicated cleanup phase explicitly scopes it.

## Imports

- Use `@/` absolute imports.
- Group imports: framework, third-party, internal.
- Do not import from `src/` directly.
- Use `pnpm lint:types:fix` for scoped unused-import cleanup instead of ad hoc manual churn in the approved baseline slices.
- Treat static dead-code findings as candidates that still require human review.

## Error handling

- Route handlers should return structured JSON errors with proper status codes.
- Agent tools should return structured failures with a stable code and user-facing error message.
- Reject malformed model output before it reaches canonical state.

## Comments

- Prefer self-documenting code.
- Use comments only when they explain intent, invariants, or tricky behavior.
- TODOs should include an issue number.

## Resume-State Boundaries

- `cvState` is the canonical base resume only.
- `agentState` may store structured gap analysis and operational targeting context, but not target-derived resume variants.
- Immutable resume history belongs in `cv_versions`.
- Target-specific derived resume variants belong in `resume_targets`.

## Dead-Code Guardrails

Do not auto-delete findings from static tooling when they may belong to:

- Next.js app or API routes
- dynamic imports
- string-driven handlers or workflow dispatch
- background jobs, polling endpoints, or queue-like flows

Review the staged cleanup workflow in [dead-code-cleanup-workflow.md](../operations/dead-code-cleanup-workflow.md) before deleting code.

For dependency hygiene:

- use the configured `pnpm depcheck` command, not raw `depcheck` defaults
- review [dependency-hygiene-inventory.md](../operations/dependency-hygiene-inventory.md) before uninstalling anything
