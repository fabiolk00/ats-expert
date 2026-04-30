# Quick Task: Mostrar créditos disponíveis no header da comparação

## Objetivo

Exibir, entre a logo e o botão "Voltar ao Perfil", a quantidade de créditos disponíveis do usuário nas telas de comparação de currículo.

## Plano

1. Reaproveitar o endpoint existente de resumo de billing (`getBillingSummary`) para obter `currentCredits` e `maxCredits`.
2. Passar o saldo para `ResumeComparisonView` por props, mantendo a tela resiliente se o resumo de billing falhar.
3. Renderizar um indicador compacto no header, centralizado entre logo e ação de voltar.
4. Atualizar testes de `ResumeComparisonView` e validar lint/typecheck/test/copy audit.

## Escopo

- Job Targeting comparison.
- ATS Enhancement comparison.
- Sem alteração em regra de crédito, cobrança ou entitlement.
