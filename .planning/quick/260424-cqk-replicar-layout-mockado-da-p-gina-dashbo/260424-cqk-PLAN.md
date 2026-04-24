# Quick Task 260424-cqk Plan

## Goal

Replicar, com mocks locais, o layout da página `/dashboard/resume/history` a partir da referência enviada no zip `Resumes.zip`, sem conectar dados reais nesta etapa.

## Tasks

1. Adicionar a nova rota de histórico no padrão existente do dashboard (`resumes/history` com alias `resume/history`).
2. Portar o layout da referência para componentes reutilizáveis em `src/components/resume`, incluindo cards, paginação e estados vazios/erro/loading.
3. Garantir previsibilidade com mock data dedicado e teste de componente cobrindo renderização principal e estados básicos.
