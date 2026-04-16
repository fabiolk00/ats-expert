# Quick Task 260415-tld Plan

## Goal

Restaurar a tela de comparação de currículo para o layout da branch `compare-generated-resumes` e ajustar o fallback ATS para preservar conteúdo reescrito real, sem perder a garantia de sempre retornar currículo quando a base mínima existir.

## Tasks

1. Substituir `src/components/resume/resume-comparison-view.tsx` por uma versão alinhada ao layout de referência, incluindo comportamento mobile e integrações locais.
2. Corrigir `src/lib/agent/ats-enhancement-pipeline.ts` para reparar `summary` e `skills` antes de reverter seções inteiras.
3. Atualizar regressões em `src/components/resume/user-data-page.test.tsx` e `src/lib/agent/tools/pipeline.test.ts`.

## Verification

- `npm run typecheck`
- `npm test -- src/lib/agent/tools/pipeline.test.ts src/components/resume/user-data-page.test.tsx`
- `npm run audit:copy-regression`
