# Summary: Layout do zip em Pontos para revisar

## Implementado

- `ReviewWarningPanel` foi refeito para seguir o layout do zip.
- O card agora usa a mesma estrutura visual principal:
  - banner âmbar no topo;
  - título grande "Pontos para revisar" com linha horizontal;
  - seções "Experiência relevante", "Seu perfil comprovado", "Pontos sem evidência suficiente" e "Por que revisar";
  - bullets âmbar e bloco interno âmbar para evidências insuficientes.
- Os dados reais de `reviewItems` foram adaptados ao layout fixo:
  - `jobRequirements` alimenta a lista de experiência/requisitos relevantes;
  - `provenProfile`, `originalProfileLabel` ou `supportedEvidence` alimentam o perfil comprovado;
  - `missingEvidence` e `unsupportedRequirements` alimentam os pontos sem evidência;
  - `whyItMatters` alimenta o motivo de revisão.
- O componente antigo expansível `review-diagnostic-card.tsx` foi removido por ter virado código morto.
- A interação antiga de clicar em um ponto para rolar até uma seção foi removida junto com o layout antigo.

## Arquivos alterados

- `src/components/resume/review-warning-panel.tsx`
- `src/components/resume/review-warning-panel.test.tsx`
- `src/components/resume/resume-comparison-view.tsx`
- `src/components/resume/resume-comparison-view.test.tsx`

## Arquivos removidos

- `src/components/resume/review-diagnostic-card.tsx`

## Validação

- `npm test -- src/components/resume/review-warning-panel.test.tsx src/components/resume/resume-comparison-view.test.tsx src/components/resume/resume-comparison-page.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
