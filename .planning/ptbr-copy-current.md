# PT-BR Copy Audit

- Files scanned for PT-BR review: 587
- Files scanned for mojibake: 587
- Mojibake issues: 6
- PT-BR copy review issues: 13

## Mojibake

- src/components/resume/user-data-page.test.tsx:752 - encodeUtf8AsMojibake("O resumo otimizado menciona skill sem evid�ncia no curr�culo original."),

- src/components/resume/user-data-page.test.tsx:753 - encodeUtf8AsMojibake("O resumo targetizado passou a se apresentar diretamente como o cargo alvo sem evid�ncia equivalente no curr�culo original."),

- src/components/resume/user-data-page.test.tsx:773 - expect.stringContaining("Revise estes pontos antes de usar a vers�o final"),

- src/components/resume/user-data-page.test.tsx:782 - expect.stringContaining(encodeUtf8AsMojibake("evid�ncia")),

- src/components/resume/user-data-page.test.tsx:785 - expect.stringContaining(encodeUtf8AsMojibake("curr�culo")),

- src/lib/agent/tools/generate-file-intake.ts:132 - 'Gere uma nova versÃ£o otimizada pela IA antes de exportar este currÃ­culo.',

## PT-BR Copy Review

- src/lib/agent/job-targeting/rewrite-permissions.ts:26 - `experiencia` -> `experiência`
  safeBridge: `When relevant, connect ${evidence.canonicalSignal} to adjacent real evidence such as ${anchors} using cautious language like "experiencia relacionada a", "atuacao com", "base em", or "contexto de". Do not present it as direct mastery.`,

- src/lib/agent/job-targeting/validation-policy.test.ts:78 - `experiencia` -> `experiência`
  summary: 'Profissional com experiencia relacionada a Lean Six Sigma a partir de melhoria continua e padronizacao de processos.',

- src/lib/agent/job-targeting/validation-policy.test.ts:144 - `experiencia` -> `experiência`
  summary: 'Profissional com experiencia relacionada a Lean Six Sigma em transformacoes globais.',

- src/lib/agent/job-targeting/validation-policy.test.ts:271 - `nao` -> `não`
  message: expect.stringContaining('senioridade ou dominio nao comprovado'),

- src/lib/agent/job-targeting/validation-policy.ts:6 - `experiencia` -> `experiência`
  'experiencia relacionada a',

- src/lib/agent/tools/pipeline.test.ts:186 - `curriculo` -> `currículo`
  rationale: 'O termo aparece explicitamente no curriculo.',

- src/lib/agent/tools/pipeline.test.ts:199 - `Nao` -> `Não`
  rationale: 'Nao ha evidencia suficiente no curriculo.',

- src/lib/agent/tools/pipeline.test.ts:199 - `curriculo` -> `currículo`
  rationale: 'Nao ha evidencia suficiente no curriculo.',

- src/lib/agent/tools/pipeline.test.ts:1509 - `experiencia` -> `experiência`
  improvementSuggestions: ['Aproxime o resumo da vaga sem inventar experiencia.'],

- src/lib/agent/tools/pipeline.test.ts:1538 - `experiencia` -> `experiência`
  improvementSuggestions: ['Aproxime o resumo da vaga sem inventar experiencia.'],

- src/lib/agent/tools/validate-rewrite.test.ts:65 - `nao` -> `não`
  rationale: 'Existe evidencia contextual forte, mas nao literal.',

- src/lib/agent/tools/validate-rewrite.test.ts:408 - `experiencia` -> `experiência`
  summary: 'Profissional de dados com experiencia relacionada a Lean Six Sigma por meio de melhoria continua.',

- src/lib/agent/tools/validate-rewrite.test.ts:507 - `experiencia` -> `experiência`
  safeBridge: 'Mencione apenas como experiencia relacionada a grandes contas.',
