# Quick Task: Replicar layout do zip em Pontos para revisar

## Objetivo

Substituir a seção atual de "Pontos para revisar" pelo layout do zip enviado, mantendo a estrutura visual do card e adaptando os dados reais do CurrIA para as seções fixas do layout.

## Referência

Zip: `Untitled.zip`

Layout alvo identificado em `src/app/App.tsx` do zip:

- card branco com `rounded-2xl`, `shadow-sm`, `border-gray-200` e `overflow-hidden`;
- banner superior âmbar;
- título "Pontos para revisar" com linha horizontal;
- seções fixas:
  - "Experiência relevante";
  - "Seu perfil comprovado";
  - "Pontos sem evidência suficiente";
  - "Por que revisar".

## Plano

1. Reescrever `ReviewWarningPanel` para seguir o card do zip.
2. Adaptar `reviewItems` para as seções do layout:
   - requisitos da vaga -> "Experiência relevante";
   - perfil comprovado/supported evidence -> "Seu perfil comprovado";
   - missing/unsupported evidence -> "Pontos sem evidência suficiente";
   - whyItMatters/summary/explanation -> "Por que revisar".
3. Remover o card antigo expansível de diagnóstico se ficar sem uso.
4. Atualizar testes de painel e comparação.
5. Validar teste focado, typecheck, lint e copy audit.
