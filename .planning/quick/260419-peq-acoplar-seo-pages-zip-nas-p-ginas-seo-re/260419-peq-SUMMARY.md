# Quick Task 260419-peq Summary

## Outcome

- As páginas SEO do bundle foram acopladas ao projeto em `src/components/landing/seo-pages/**`.
- A antiga rota dinâmica baseada em `[variant]` foi removida e substituída por rotas independentes em `src/app/(public)/**`.
- O FAQ da home pública foi trocado para o visual do zip, mantendo o conteúdo global existente do projeto.
- O wrapper público do CurrIA foi preservado com `Header`, `Footer` e metadata canônica por slug.

## Validation

- `npm run lint:next`
- `npm run typecheck`
- `npm run build`

## Notes

- Assumimos que “substituir o FAQ pelo FAQ do zip” significava reaproveitar o visual/comportamento do FAQ do pacote na home pública, já que o zip não traz um FAQ global único separado das páginas por cargo.
- O conteúdo original configurado em `src/lib/seo/role-landing-config.ts` foi mantido apenas para metadata e referências já usadas pelo restante do projeto.
