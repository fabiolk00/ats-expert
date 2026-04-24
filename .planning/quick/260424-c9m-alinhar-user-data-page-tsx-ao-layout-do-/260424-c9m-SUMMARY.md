# Quick Task Summary - 260424-c9m

## Goal

Alinhar `src/components/resume/user-data-page.tsx` ao layout do ZIP de referência sem quebrar os fluxos reais da página de profile.

## What Changed

- Reaproximei o profile shell do mock:
  - header sem card/container extra;
  - hierarquia visual compacta;
  - ações alinhadas ao padrão do ZIP;
  - cards com borda, raio e densidade mais fiéis ao layout aprovado.
- Reorganizei o header para ficar muito mais próximo do ZIP:
  - `Importar / LinkedIn / PDF`;
  - `Download PDF`;
  - `Melhorar currículo com IA`;
  - edição pessoal mantida via affordance real do editor.
- Ajustei a leitura visual dos cards:
  - `Resumo profissional`, `Experiência`, `Skills`, `Educação`, `Certificações`;
  - experience com densidade, alinhamento e ritmo visual mais próximos do mock;
  - chips de skills e blocos de educação/certificações menos “pesados”.
- Reaproximei o enhancement mode do ZIP:
  - tela branca e compacta;
  - top bar simples;
  - selector cards com ícones e densidade do mock;
  - CTA com `Sparkles`;
  - painel lateral “O que você recebe” mais fiel ao ZIP.
- Preservei os fluxos reais:
  - load/save em `/api/profile`;
  - import LinkedIn/PDF;
  - edição pelo editor existente;
  - ATS enhancement e target-job;
  - validações, diálogos, créditos, download e compare redirect.
- Corrigi um regression no pós-import:
  - o profile precisava voltar para o shell principal após `handleImportSuccess`.
- Estabilizei os testes com `data-testid="enhancement-back-button"` no botão superior de volta da tela de enhancement.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npx vitest run src/components/resume/user-data-page.test.tsx`
- `npx playwright test tests/e2e/profile-setup.spec.ts --project=chromium --workers=1 --reporter=line`

## Result

A página ficou visualmente muito mais próxima do ZIP de referência, especialmente no cabeçalho, na densidade dos cards e no enhancement mode, sem perder os comportamentos reais já existentes.
