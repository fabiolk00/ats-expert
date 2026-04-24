# Quick Task Summary - 260424-d2p

## Goal

Renomear e canonizar os endpoints autenticados ligados a dashboard/auth para a nova navegação baseada em `/profile-setup`, `/chat` e `/dashboard/resumes-history`.

## What Changed

- Criei as rotas canônicas:
  - `/profile-setup`
  - `/chat`
  - `/dashboard/resumes-history`
- Mantive compatibilidade com aliases antigos por redirect:
  - `/dashboard` agora redireciona para `/chat`
  - `/dashboard/resumes/new` e `/dashboard/resume/new` agora redirecionam para `/profile-setup`
  - `/dashboard/resumes/history` e `/dashboard/resume/history` agora redirecionam para `/dashboard/resumes-history`
  - `/profile` agora redireciona para `/profile-setup`
  - `/chat/[sessionId]` agora canoniza para `/chat?session=...`
- Centralizei constantes e helpers de rota em `src/lib/routes/app.ts`.
- Atualizei a navegação autenticada para usar os novos destinos:
  - sidebar
  - listas de sessão
  - tela de profile setup
  - comparison/back links
  - checkout/pricing fallbacks
  - redirects do auth flow
- Corrigi `redirect_to` no login/cadastro para canonizar aliases antigos de dashboard antes de navegar.
- Reajustei os E2E do workspace para validar o comportamento atual do `/chat`, usando o preview/download real no lugar do antigo painel de documentos colapsado no desktop.

## Validation

- `npm test -- "src/lib/auth/redirects.test.ts" "src/components/auth/login-form.test.tsx" "src/components/auth/signup-form.test.tsx" "src/app/(auth)/dashboard/page.test.tsx" "src/app/(auth)/chat/page.test.tsx" "src/app/(auth)/resumes/page.test.tsx" "src/app/api/checkout/route.test.ts" "src/lib/asaas/checkout.test.ts" "src/components/dashboard/session-list.test.tsx" "src/components/dashboard/sessions-list.test.tsx" "src/components/dashboard/sidebar.test.tsx" "src/components/dashboard/welcome-guide.test.tsx" "src/components/pricing/pricing-cards.test.tsx" "src/components/resume/user-data-page.test.tsx"`
- `npx playwright test tests/e2e/auth.guard.spec.ts tests/e2e/profile-setup.spec.ts tests/e2e/core-funnel.spec.ts tests/e2e/chat-transcript.spec.ts tests/e2e/long-vacancy-generation.spec.ts --project=chromium`

## Result

O produto agora expõe uma navegação canônica mais coerente:

- setup de perfil em `/profile-setup`
- workspace/chat em `/chat`
- histórico em `/dashboard/resumes-history`

Os aliases antigos continuam funcionando como ponte, mas os fluxos internos, redirects e testes já apontam para os endpoints novos.
