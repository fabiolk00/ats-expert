# Summary: Títulos padronizados e layout responsivo corrigido

## Implementado

- O título "Pontos para revisar" agora usa o mesmo padrão de tamanho/peso do título "Compatibilidade com a vaga".
- O currículo de Job Targeting, quando aberto, não usa mais `max-height` nem scroll interno.
- O colapso do currículo agora só atua em `lg+`; em mobile/tablet o botão fica escondido e o currículo aparece completo.
- A ordem em mobile/tablet ficou:
  1. Compatibilidade com a vaga
  2. Currículo ATS Otimizado
  3. Pontos para revisar
- Em desktop, o currículo permanece à esquerda e os blocos de diagnóstico ficam à direita.
- O painel de pontos a revisar perdeu scroll interno base; o scroll limitado fica aplicado apenas na coluna desktop.

## Arquivos alterados

- `src/components/resume/resume-comparison-view.tsx`
- `src/components/resume/resume-comparison-view.test.tsx`
- `src/components/resume/review-warning-panel.tsx`
- `src/components/resume/review-warning-panel.test.tsx`

## Validação

- `npm test -- src/components/resume/review-warning-panel.test.tsx src/components/resume/resume-comparison-view.test.tsx src/components/resume/resume-comparison-page.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
