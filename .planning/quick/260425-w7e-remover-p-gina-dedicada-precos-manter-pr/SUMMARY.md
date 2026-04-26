# Quick Task Summary

Task: Remover página dedicada `/precos`, manter pricing só na landing e redirecionar os CTAs da seção para signup.

Changes:
- Removed the standalone `/precos` public page and its now-unused `PricingCards` component/tests.
- Kept the landing `PricingSection` as the single pricing surface, preserving the inclusion/exclusion matrix with green checks and red X states.
- Changed all landing pricing card CTAs to point to `/criar-conta`.
- Repointed informational links that used `/precos` to the landing anchor `/#pricing`.
- Repointed plan-specific post-auth and upsell flows to `/finalizar-compra?plan=...` instead of `/precos?checkoutPlan=...`.
- Updated checkout cancel/expired return URLs to land back on `/#pricing`.

Validation:
- `npx vitest run "src/components/landing/pricing-section.test.tsx" "src/app/sitemap.test.ts" "src/lib/auth/redirects.test.ts" "src/components/auth/signup-form.test.tsx" "src/components/auth/login-form.test.tsx" "src/app/api/checkout/route.test.ts" "src/lib/asaas/checkout.test.ts" "src/app/(auth)/chat/page.test.tsx" "src/components/dashboard/resume-workspace.test.tsx" "src/app/api/session/route.test.ts" "src/app/api/session/[id]/route.test.ts" "src/app/api/session/[id]/messages/route.test.ts" "src/app/api/agent/route.test.ts" "src/lib/agent/request-orchestrator.test.ts"`
