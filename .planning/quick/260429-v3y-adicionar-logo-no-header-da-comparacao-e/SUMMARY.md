# Summary: Logo no header e colapso parcial do currículo

## Implementado

- Adicionada a logo no canto superior esquerdo do header da comparação.
- A logo aparece tanto para Job Targeting quanto para ATS Enhancement.
- O header continua limpo, sem título grande, com "Voltar ao Perfil" à direita.
- No Job Targeting, o controle "Ocultar/Abrir currículo" saiu do topo e foi para o rodapé visual do currículo.
- Ao colapsar, o currículo não some mais: o frame fica limitado a `52vh`, mantendo a parte superior visível com gradiente e botão "Abrir currículo".
- ATS Enhancement não recebeu controle de colapso, apenas a logo no header.

## Arquivos alterados

- `src/components/resume/resume-comparison-view.tsx`
- `src/components/resume/resume-comparison-view.test.tsx`

## Validação

- `npm test -- src/components/resume/resume-comparison-view.test.tsx src/components/dashboard/dashboard-shell.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
