# Summary: Refinar tela de currículo otimizado

## Implementado

- Removido o header completo da tela de comparação; ficou apenas o botão "Voltar ao Perfil" em fundo branco.
- Removida a sidebar visual do Job Targeting e do ATS Enhancement.
- Mantida a comparação lado a lado para ATS Enhancement.
- Movido o diagnóstico do Job Targeting para um bloco acima do currículo, com score, pontos para revisar e sugestões de aderência.
- Adicionado controle de abrir/ocultar no diagnóstico da vaga.
- Adicionado controle de abrir/ocultar no currículo do Job Targeting, aberto por padrão.
- Reduzida a largura do currículo no layout principal.
- Alterado "Currículo gerado" para "Currículo ATS Otimizado".
- Adicionada orientação curta acima do currículo otimizado: "Use as dicas de ATS para ajustar seu currículo e, em seguida, baixe a versão editada em PDF."
- Tornados os ícones de editar e baixar mais fortes/pretos.
- Ajustado o score card para usar percentual correto quando `score/max` não for 100.

## Arquivos alterados

- `src/components/resume/resume-comparison-view.tsx`
- `src/components/resume/job-targeting-score-card.tsx`
- `src/components/resume/review-warning-panel.tsx`
- `src/components/resume/resume-comparison-view.test.tsx`
- `src/components/resume/job-targeting-score-card.test.tsx`

## Validação

- `npm test -- src/components/resume/job-targeting-score-card.test.tsx src/components/resume/resume-comparison-view.test.tsx src/components/resume/review-warning-panel.test.tsx src/components/resume/target-recommendations-card.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
