# Code Style Rules

## TypeScript
- Always use strict TypeScript — no `any`, no `// @ts-ignore`
- Prefer `type` over `interface` for data shapes; use `interface` only for extensible contracts
- All async functions must have explicit return types: `Promise<CVState>` not `Promise<any>`
- Use Zod for all external input validation (API route bodies, tool call arguments, env vars)

## React / Next.js
- Server Components by default — only add `"use client"` when strictly needed (event handlers, hooks)
- Never fetch data inside client components — use server actions or route handlers
- All forms use `react-hook-form` + Zod schema validation
- Loading states use `<Suspense>` boundaries, not `isLoading` booleans in client state

## Styling
- Tailwind only — no inline styles, no CSS modules, no styled-components
- Use `cn()` from `lib/utils` to merge classNames conditionally
- Responsive breakpoints always mobile-first: `sm:`, `md:`, `lg:`
- Colors from the design token system — no raw hex values in components

## Imports
- Absolute imports via `@/` alias (e.g. `import { db } from '@/lib/db'`)
- Group imports: 1) React/Next, 2) third-party, 3) internal — separated by blank line
- Never import from `src/` directly — always use `@/`

## Error handling
- API routes always return `{ error: string }` with the appropriate HTTP status on failure
- Agent tools wrap their logic in try/catch and return `{ success: false, error: string }`
- Never let unhandled promise rejections reach the client

## Comments
- No inline comments explaining *what* the code does — code should be self-documenting
- JSDoc only on exported functions that are non-obvious (e.g. scoring algorithms)
- TODO comments must include a GitHub issue number: `// TODO(#42): handle scanned PDFs`
