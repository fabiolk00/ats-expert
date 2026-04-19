# Quick Task 260419-peq: Acoplar SEO Pages.zip nas páginas SEO, remover rota variant, tornar páginas independentes e substituir FAQ pelo conteúdo do zip

## Scope

- Extrair o conteúdo útil do bundle `SEO Pages.zip` para componentes do projeto.
- Trocar a rota dinâmica `src/app/(public)/[variant]/page.tsx` por rotas estáticas independentes para cada slug SEO.
- Preservar `Header`, `Footer` e a casca pública existente do CurrIA.
- Atualizar o FAQ público para o visual do zip sem inventar conteúdo novo fora do pacote.

## Tasks

1. Adaptar o template e as seções do zip ao App Router atual, com CTAs apontando para fluxos internos do produto.
2. Criar páginas estáticas para cada rota SEO existente e reaproveitar a metadata canônica já mantida em `role-landing-config.ts`.
3. Validar `lint:next`, `typecheck` e `build` para garantir que a remoção da rota dinâmica não quebrou o build.
