# CurrIA — Project Instructions

## What this project is
Brazilian AI-powered resume optimization SaaS. Users upload or paste their resume,
a conversational agent analyzes it, suggests improvements, and generates an ATS-optimized DOCX/PDF.

## Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Auth**: Clerk
- **Database**: Supabase (Postgres + Storage)
- **ORM**: Prisma
- **AI**: Anthropic SDK — default model is `claude-sonnet-4-5` (never use Haiku in production)
- **DOCX generation**: Docxtemplater + PizZip
- **PDF**: LibreOffice headless via child_process (server-side only)
- **Payments**: Asaas (Brazilian payment gateway — one-time R$19 + subscriptions)
- **Deploy**: Vercel (frontend + API routes) + Railway (heavy PDF jobs)
- **Analytics**: Posthog
- **Email**: Resend

## Folder structure
```
src/
  app/
    (auth)/          # Clerk-protected routes
    (public)/        # landing, pricing, login
    api/
      agent/         # POST /api/agent — main agent loop
      webhook/       # Asaas webhooks
      file/          # file generation and download
  components/
    chat/            # conversational agent UI
    resume/          # resume preview and editor
    ui/              # shadcn components
  lib/
    agent/           # context builder, tools, state machine
    ats/             # ATS scoring logic
    db/              # Prisma client + queries
    storage/         # Supabase Storage helpers
    asaas/           # payment helpers
  types/
    agent.ts         # Session, CVState, Phase, Tool types
    cv.ts            # resume data structure
```

## Required environment variables
```
ANTHROPIC_API_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ASAAS_API_KEY
ASAAS_WEBHOOK_TOKEN
ASAAS_SANDBOX
RESEND_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
```

## Hard rules
1. **Never** expose `ANTHROPIC_API_KEY` or `ASAAS_API_KEY` on the client
2. **Always** validate the user's quota before calling the Claude API
3. **Never** store raw resume text in the database — store only the structured CVState (JSON)
4. All generated files go to Supabase Storage, never to the server filesystem
5. Every write API route requires Clerk authentication
6. The Claude model is **always** `claude-sonnet-4-5` — do not accept PRs that change this

## Naming conventions
- Files: `kebab-case.ts`
- React components: `PascalCase.tsx`
- Utility functions: `camelCase`
- Global constants: `UPPER_SNAKE_CASE`
- Prisma tables: `snake_case`

## Agent phases (state machine)
`intake` → `analysis` → `dialog` → `confirm` → `generation`

Each session stores the current phase in the database. The agent advances phases by calling
the `set_phase` tool. Phases must never be skipped — if the user tries to confirm before
going through dialog, the agent must redirect them back.

## Pricing tiers
- One-time: R$19 (1 analysis + 1 file)
- Monthly plan: R$39/month (5 resumes)
- Pro: R$97/month (unlimited)
- Free analysis: always available, no file generated

## Useful commands
```bash
pnpm dev          # start dev server
pnpm db:push      # push Prisma schema to Supabase
pnpm db:studio    # open Prisma Studio
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
```
