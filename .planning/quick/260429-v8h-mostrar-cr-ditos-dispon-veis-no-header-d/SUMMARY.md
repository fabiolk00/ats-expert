# Summary: Créditos no header da comparação

## Implementado

- A tela de comparação agora carrega o resumo de billing junto com os dados da comparação.
- O saldo é passado para `ResumeComparisonView` como `creditsRemaining` e `maxCredits`.
- O header exibe um badge central com "Créditos disponíveis" e o saldo atual.
- Se o resumo de billing falhar, a comparação continua funcionando sem travar a tela.
- O badge aparece tanto em Job Targeting quanto em ATS Enhancement quando há saldo disponível nas props.

## Arquivos alterados

- `src/components/resume/resume-comparison-page.tsx`
- `src/components/resume/resume-comparison-page.test.tsx`
- `src/components/resume/resume-comparison-view.tsx`
- `src/components/resume/resume-comparison-view.test.tsx`

## Validação

- `npm test -- src/components/resume/resume-comparison-view.test.tsx src/components/resume/resume-comparison-page.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
