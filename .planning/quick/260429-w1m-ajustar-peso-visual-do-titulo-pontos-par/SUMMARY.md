# Summary: Peso visual de Pontos para revisar ajustado

## Implementado

- O título "Pontos para revisar" voltou para `text-2xl font-bold`.
- O teste de `ReviewWarningPanel` foi atualizado para cobrir o padrão visual.

## Arquivos alterados

- `src/components/resume/review-warning-panel.tsx`
- `src/components/resume/review-warning-panel.test.tsx`

## Validação

- `npm test -- src/components/resume/review-warning-panel.test.tsx src/components/resume/resume-comparison-view.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
