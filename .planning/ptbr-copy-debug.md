# PT-BR Copy Audit

- Files scanned for PT-BR review: 586
- Files scanned for mojibake: 586
- Mojibake issues: 144
- PT-BR copy review issues: 9

## Mojibake

- src/app/api/session/[id]/job-targeting/override/route.ts:106 - error: 'Este bloqueio nÃ£o pode ser liberado com override pago.',

- src/components/resume/user-data-page.test.tsx:748 - "O resumo otimizado menciona skill sem evidÃªncia no currÃ­culo original.",

- src/components/resume/user-data-page.test.tsx:749 - "O resumo targetizado passou a se apresentar diretamente como o cargo alvo sem evidÃªncia equivalente no currÃ­culo original.",

- src/components/resume/user-data-page.test.tsx:778 - expect.stringContaining("evidÃªncia"),

- src/components/resume/user-data-page.test.tsx:781 - expect.stringContaining("currÃ­culo"),

- src/components/resume/user-data-page.tsx:432 - .replaceAll("ÃƒÂª", "ê")

- src/components/resume/user-data-page.tsx:433 - .replaceAll("ÃƒÂ©", "é")

- src/components/resume/user-data-page.tsx:434 - .replaceAll("ÃƒÂ£", "ã")

- src/components/resume/user-data-page.tsx:435 - .replaceAll("ÃƒÂ¡", "á")

- src/components/resume/user-data-page.tsx:436 - .replaceAll("ÃƒÂ³", "ó")

- src/components/resume/user-data-page.tsx:437 - .replaceAll("ÃƒÂº", "ú")

- src/components/resume/user-data-page.tsx:438 - .replaceAll("ÃƒÂ§", "ç")

- src/components/resume/user-data-page.tsx:439 - .replaceAll("ÃƒÂ­", "í")

- src/components/resume/user-data-page.tsx:440 - .replaceAll("evidÃªncia", "evidência")

- src/components/resume/user-data-page.tsx:441 - .replaceAll("currÃ­culo", "currículo")

- src/components/resume/user-data-page.tsx:442 - .replaceAll("experiÃªncia", "experiência")

- src/components/resume/user-data-page.tsx:443 - .replaceAll("certificaÃ§Ã£o", "certificação")

- src/components/resume/user-data-page.tsx:444 - .replaceAll("inÃ­cio", "início")

- src/components/resume/user-data-page.tsx:445 - .replaceAll("tÃ©rmino", "término")

- src/components/resume/user-data-page.tsx:446 - .replaceAll("numÃ©rico", "numérico")

- src/components/resume/user-data-page.tsx:447 - .replaceAll("nÃ£o", "não")

- src/components/resume/user-data-page.tsx:448 - .replaceAll("versÃ£o", "versão")

- src/lib/agent/streaming-loop.test.ts:166 - { role: 'user', content: 'Quero uma anÃ¡lise', createdAt: new Date() },

- src/lib/agent/streaming-loop.test.ts:211 - mockTextStream('Aqui estÃ¡ uma resposta final Ãºtil.') as never,

- src/lib/agent/streaming-loop.test.ts:227 - expect(textEvents.map((event) => event.content).join('')).toContain('Aqui estÃ¡ uma resposta final Ãºtil.')

- src/lib/agent/streaming-loop.test.ts:237 - 'Aqui estÃ¡ uma resposta final Ãºtil.',

- src/lib/agent/streaming-loop.test.ts:388 - error: expect.stringContaining('nÃºmero mÃ¡ximo'),

- src/lib/agent/streaming-loop.test.ts:658 - .mockResolvedValueOnce(mockTextStream('Bom dia! Ã“timo iniciar. Pode me dizer qual vaga vocÃª estÃ¡ mirando?') as never)

- src/lib/agent/streaming-loop.test.ts:685 - 'Bom dia! Ã“timo iniciar. Pode me dizer qual vaga vocÃª estÃ¡ mirando?',

- src/lib/agent/streaming-loop.test.ts:746 - content: 'Recebi a vaga e ela jÃ¡ ficou salva como referÃªncia para o seu currÃ­culo.',

- src/lib/agent/streaming-loop.test.ts:776 - content: 'Posso reescrever agora seu resumo profissional. JÃ¡ tenho seu currÃ­culo e a vaga como referÃªncia.',

- src/lib/agent/streaming-loop.test.ts:819 - 'Posso seguir, sim. JÃ¡ tenho seu currÃ­culo e a vaga como referÃªncia. Vou continuar pelo trecho com maior impacto para essa vaga: seu resumo profissional.',

- src/lib/agent/streaming-loop.test.ts:904 - userMessage: 'Compare meu currÃ­culo com a vaga jÃ¡ salva',

- src/lib/agent/streaming-loop.test.ts:984 - expect(finalText).toContain('currÃ­culo')

- src/lib/agent/streaming-loop.test.ts:985 - expect(finalText).not.toContain('NÃ£o consegui concluir a resposta completa desta vez')

- src/lib/agent/streaming-loop.test.ts:1052 - userMessage: 'Reescreva meu currÃ­culo para essa vaga',

- src/lib/agent/streaming-loop.test.ts:1066 - expect(finalText).toContain('AderÃªncia inicial: parcial.')

- src/lib/agent/streaming-loop.test.ts:1115 - expect(finalText).not.toContain('Recebi a vaga e ela jÃ¡ ficou salva como referÃªncia para o seu currÃ­culo.')

- src/lib/agent/streaming-loop.test.ts:1140 - rewritten_content: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1141 - section_data: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1147 - rewritten_content: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1148 - section_data: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1154 - summary: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1159 - rewrittenContent: 'Analista de BI com experiÃªncia em Power BI, SQL e ETL, focado em dashboards executivos, traduÃ§Ã£o de necessidades do negÃ³cio e melhoria da tomada de decisÃ£o.',

- src/lib/agent/streaming-loop.test.ts:1187 - expect(finalText).toContain('Aqui estÃ¡ uma versÃ£o reescrita do seu resumo profissional:')

- src/lib/agent/streaming-loop.test.ts:1188 - expect(finalText).toContain('Analista de BI com experiÃªncia em Power BI, SQL e ETL')

- src/lib/agent/streaming-loop.test.ts:1194 - expect.stringContaining('Aqui estÃ¡ uma versÃ£o reescrita do seu resumo profissional:'),

- src/lib/agent/streaming-loop.test.ts:1222 - rewritten_content: 'Resumo final reescrito a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1223 - section_data: 'Resumo final reescrito a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1229 - rewritten_content: 'Resumo final reescrito a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1230 - section_data: 'Resumo final reescrito a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1236 - summary: 'Resumo final reescrito a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1293 - sourceResumeText: 'Fabio Silva\nExperiÃªncia antiga.',

- src/lib/agent/streaming-loop.test.ts:1305 - rewritten_content: 'ExperiÃªncia reescrita a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1308 - changes_made: ['ExperiÃªncia atualizada'],

- src/lib/agent/streaming-loop.test.ts:1312 - rewritten_content: 'ExperiÃªncia reescrita a partir da versÃ£o otimizada.',

- src/lib/agent/streaming-loop.test.ts:1315 - changes_made: ['ExperiÃªncia atualizada'],

- src/lib/agent/streaming-loop.test.ts:1326 - userMessage: 'reescreva minha experiÃªncia',

- src/lib/agent/streaming-loop.test.ts:1453 - 'SQL avanÃ§ado, ETL, comunicaÃ§Ã£o com Ã¡reas nÃ£o tÃ©cnicas e Power BI.',

- src/lib/agent/streaming-loop.test.ts:1483 - expect(finalText).not.toContain('Diga qual trecho vocÃª quer ajustar primeiro')

- src/lib/agent/streaming-loop.test.ts:1640 - expect.stringContaining('Recebi a vaga e comparei com seu currÃ­culo com foco em aderÃªncia ATS.'),

- src/lib/agent/streaming-loop.test.ts:1811 - expect.stringContaining('Seu currÃ­culo ATS-otimizado em PDF estÃ¡ pronto.'),

- src/lib/agent/streaming-loop.test.ts:1856 - expect(finalText).toBe('Quando fizer sentido, clique em "Aceito" para gerar seu currÃ­culo.')

- src/lib/agent/streaming-loop.test.ts:1891 - summary: 'O perfil atual parece pouco alinhado com a vaga-alvo neste momento, com lacunas relevantes que uma reescrita de currÃ­culo sozinha nÃ£o resolve.',

- src/lib/agent/streaming-loop.test.ts:2115 - reasons: ['ExperiÃªncia analÃ­tica aproveitÃ¡vel, mas com lacunas em growth e CRM.'],

- src/lib/agent/streaming-loop.test.ts:2128 - summary: 'O perfil atual parece pouco alinhado com a vaga-alvo neste momento, com lacunas relevantes que uma reescrita de currÃ­culo sozinha nÃ£o resolve.',

- src/lib/agent/streaming-loop.test.ts:2505 - summary: 'O perfil atual parece pouco alinhado com a vaga-alvo neste momento, com lacunas relevantes que uma reescrita de currÃ­culo sozinha nÃ£o resolve.',

- src/lib/agent/streaming-loop.test.ts:2628 - summary: 'Profissional de dados em transiÃ§Ã£o para infraestrutura com estudos em Kubernetes, Go e Terraform.',

- src/lib/agent/streaming-loop.test.ts:2712 - expect(finalText).toContain('Seu currÃ­culo ATS-otimizado em PDF estÃ¡ pronto.')

- src/lib/agent/streaming-loop.test.ts:2924 - expect.stringContaining('Seu currÃ­culo ATS-otimizado em PDF estÃ¡ pronto.'),

- src/lib/agent/streaming-loop.test.ts:3015 - expect(finalText).toContain('jÃ¡ estÃ¡ em andamento')

- src/lib/agent/streaming-loop.test.ts:3016 - expect(finalText).toContain('sem consumir outro crÃ©dito')

- src/lib/agent/streaming-loop.test.ts:3185 - error: 'Falta a descriÃ§Ã£o da sua segunda experiÃªncia - Case New Holland. Adicione pelo menos um resultado, responsabilidade ou entrega dessa funÃ§Ã£o.',

- src/lib/agent/streaming-loop.test.ts:3190 - error: 'Falta a descriÃ§Ã£o da sua segunda experiÃªncia - Case New Holland. Adicione pelo menos um resultado, responsabilidade ou entrega dessa funÃ§Ã£o.',

- src/lib/agent/streaming-loop.test.ts:3195 - error: 'Falta a descriÃ§Ã£o da sua segunda experiÃªncia - Case New Holland. Adicione pelo menos um resultado, responsabilidade ou entrega dessa funÃ§Ã£o.',

- src/lib/agent/streaming-loop.test.ts:3200 - error: 'Falta a descriÃ§Ã£o da sua segunda experiÃªncia - Case New Holland. Adicione pelo menos um resultado, responsabilidade ou entrega dessa funÃ§Ã£o.',

- src/lib/agent/streaming-loop.test.ts:3226 - expect(finalText).toContain('NÃ£o consegui gerar os arquivos agora.')

- src/lib/agent/streaming-loop.test.ts:3227 - expect(finalText).toContain('Falta a descriÃ§Ã£o da sua segunda experiÃªncia - Case New Holland.')

- src/lib/agent/tools/detect-cv-highlights.ts:239 - 'Bullet: "Otimizei pipelines com salting e repartitioning, reduzindo em atÃ© 40% o tempo de processamento."',

- src/lib/agent/tools/detect-cv-highlights.ts:240 - 'Invalid fragment: "Otimizei pipelines com salting e repartitioning, reduzindo em atÃ© 40%".',

- src/lib/agent/tools/detect-cv-highlights.ts:241 - 'Valid fragment: "reduzindo em atÃ© 40% o tempo de processamento".',

- src/lib/agent/tools/pipeline.test.ts:215 - summary: ['Aproxime o posicionamento da vaga sem inventar experiÃƒÆ’Ã‚Âªncia.'],

- src/lib/agent/tools/pipeline.test.ts:847 - expect(summaryCall?.instructions).toContain('Sua missÃƒÆ’Ã‚Â£o principal ÃƒÆ’Ã‚Â© melhorar o currÃƒÆ’Ã‚Â­culo SEM NUNCA piorÃƒÆ’Ã‚Â¡-lo')

- src/lib/agent/tools/pipeline.test.ts:1039 - { severity: 'medium', message: 'A lista de skills otimizada introduziu habilidade ou ferramenta sem base no currÃƒÆ’Ã‚Â­culo original.', section: 'skills' },

- src/lib/agent/tools/pipeline.test.ts:1040 - { severity: 'medium', message: 'O resumo otimizado menciona skill sem evidÃƒÆ’Ã‚Âªncia no currÃƒÆ’Ã‚Â­culo original.', section: 'summary' },

- src/lib/agent/tools/pipeline.test.ts:1121 - message: 'O resumo otimizado ainda exige reparo factual antes da validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o final.',

- src/lib/agent/tools/pipeline.test.ts:1197 - message: 'O resumo permanece inconsistente com a experiÃƒÆ’Ã‚Âªncia comprovada.',

- src/lib/agent/tools/pipeline.test.ts:1212 - 'Falha na validaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o ATS; a plataforma entregou a base original para evitar bloqueio da geraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.',

- src/lib/agent/tools/pipeline.test.ts:1300 - bullets: ['Aumentei em 15% os indicadores de qualidade de produÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o na LATAM com dashboards e governanÃƒÆ’Ã‚Â§a analÃƒÆ’Ã‚Â­tica.'],

- src/lib/agent/tools/pipeline.test.ts:1321 - rewritten_content: 'ExperiÃƒÆ’Ã‚Âªncia reestruturada.',

- src/lib/agent/tools/pipeline.test.ts:1327 - bullets: ['Atuei em dashboards estratÃƒÆ’Ã‚Â©gicos para qualidade e acompanhamento operacional.'],

- src/lib/agent/tools/pipeline.test.ts:1330 - changes_made: ['Bullets alinhados ÃƒÆ’Ã‚Â  vaga'],

- src/lib/agent/tools/pipeline.test.ts:1360 - bullets: ['Atuei em dashboards estratÃƒÆ’Ã‚Â©gicos para qualidade e acompanhamento operacional.'],

- src/lib/agent/tools/pipeline.test.ts:2061 - 'Buscamos profissionais com forte experiÃƒÆ’Ã‚Âªncia em Power BI e anÃƒÆ’Ã‚Â¡lise de dados.',

- src/lib/agent/tools/pipeline.test.ts:2604 - message: 'O resumo targetizado passou a se apresentar diretamente como o cargo alvo sem evidÃƒÆ’Ã‚Âªncia equivalente no currÃƒÆ’Ã‚Â­culo original.',

- src/lib/agent/tools/pipeline.test.ts:2609 - message: 'O resumo targetizado passou a se apresentar diretamente como o cargo alvo sem evidÃƒÆ’Ã‚Âªncia equivalente no currÃƒÆ’Ã‚Â­culo original.',

- src/lib/agent/tools/pipeline.test.ts:2741 - 'Buscamos profissionais com forte experiÃƒÆ’Ã‚Âªncia em Power BI e anÃƒÆ’Ã‚Â¡lise de dados.',

- src/lib/agent/tools/validate-rewrite.test.ts:92 - summary: 'Profissional de dados com foco em BI e SQL. Requisitos obrigatÃƒÆ’Ã‚Â³rios atendidos com base na experiÃƒÆ’Ã‚Âªncia.',

- src/lib/agent/tools/validate-rewrite.test.ts:198 - expect(result.issues.some((issue) => issue.message.includes('skill sem evidÃƒÆ’Ã‚Âªncia no currÃƒÆ’Ã‚Â­culo original'))).toBe(false)

- src/lib/agent/tools/validate-rewrite.test.ts:221 - expect(result.issues.some((issue) => issue.message.includes('skill sem evidÃƒÆ’Ã‚Âªncia no currÃƒÆ’Ã‚Â­culo original'))).toBe(false)

- src/lib/agent/tools/validate-rewrite.test.ts:246 - message: 'O resumo otimizado menciona skill sem evidÃƒÆ’Ã‚Âªncia no currÃƒÆ’Ã‚Â­culo original.',

- src/lib/agent/tools/validate-rewrite.test.ts:521 - message: expect.stringContaining('senioridade ou domÃƒÆ’Ã‚Â­nio nÃƒÆ’Ã‚Â£o comprovado'),

- src/lib/agent/tools/validate-rewrite.ts:92 - .replaceAll('Ãª', 'ê')

- src/lib/agent/tools/validate-rewrite.ts:93 - .replaceAll('Ã©', 'é')

- src/lib/agent/tools/validate-rewrite.ts:94 - .replaceAll('Ã£', 'ã')

- src/lib/agent/tools/validate-rewrite.ts:95 - .replaceAll('Ã¡', 'á')

- src/lib/agent/tools/validate-rewrite.ts:96 - .replaceAll('Ã³', 'ó')

- src/lib/agent/tools/validate-rewrite.ts:97 - .replaceAll('Ãº', 'ú')

- src/lib/agent/tools/validate-rewrite.ts:98 - .replaceAll('Ã§', 'ç')

- src/lib/agent/tools/validate-rewrite.ts:99 - .replaceAll('Ã­', 'í')

- src/lib/agent/tools/validate-rewrite.ts:100 - .replaceAll('currÃ­culo', 'currículo')

- src/lib/agent/tools/validate-rewrite.ts:101 - .replaceAll('experiÃªncia', 'experiência')

- src/lib/agent/tools/validate-rewrite.ts:102 - .replaceAll('certificaÃ§Ã£o', 'certificação')

- src/lib/agent/tools/validate-rewrite.ts:103 - .replaceAll('inÃ­cio', 'início')

- src/lib/agent/tools/validate-rewrite.ts:104 - .replaceAll('tÃ©rmino', 'término')

- src/lib/agent/tools/validate-rewrite.ts:105 - .replaceAll('nÃºmerico', 'numérico')

- src/lib/agent/tools/validate-rewrite.ts:106 - .replaceAll('nÃ£o', 'não')

- src/lib/agent/tools/validate-rewrite.ts:107 - .replaceAll('versÃ£o', 'versão')

- src/lib/agent/tools/validate-rewrite.ts:112 - .replaceAll('evidÃªncia', 'evidência')

- src/lib/agent/tools/validate-rewrite.ts:113 - .replaceAll('currÃ­culo', 'currículo')

- src/lib/agent/tools/validate-rewrite.ts:114 - .replaceAll('experiÃªncia', 'experiência')

- src/lib/agent/tools/validate-rewrite.ts:115 - .replaceAll('certificaÃ§Ã£o', 'certificação')

- src/lib/agent/tools/validate-rewrite.ts:116 - .replaceAll('inÃ­cio', 'início')

- src/lib/agent/tools/validate-rewrite.ts:117 - .replaceAll('tÃ©rmino', 'término')

- src/lib/agent/tools/validate-rewrite.ts:118 - .replaceAll('numÃ©rico', 'numérico')

- src/lib/agent/tools/validate-rewrite.ts:119 - .replaceAll('nÃ£o', 'não')

- src/lib/agent/tools/validate-rewrite.ts:120 - .replaceAll('versÃ£o', 'versão')

- src/lib/agent/tools/validate-rewrite.ts:404 - message: 'O resumo targetizado passou a se apresentar diretamente como o cargo alvo sem evidÃªncia equivalente no currÃ­culo original.',

- src/lib/resume/cv-highlight-artifact.ts:65 - const HIGHLIGHT_STRONG_CLAUSE_START_PATTERN = /^(?:and|but|while|however|whereas|mas|por(?:e|Ã©)m|enquanto|because|porque)\b/i

- src/lib/resume/cv-highlight-artifact.ts:67 - const HIGHLIGHT_GERUND_CONTINUATION_PATTERN = /^(?:contributing|reinforcing|ensuring|supporting|maintaining|reducing|increasing|driving|improving|enabling|closing|strengthening|contribuindo|reforcando|reforÃ§ando|garantindo|apoiando|mantendo|reduzindo|aumentando|impulsionando|melhorando|viabilizando|fortalecendo)\b/i

- src/lib/resume/cv-highlight-artifact.ts:68 - const HIGHLIGHT_COORDINATED_CONTINUATION_PATTERN = /^(?:and|e)\s+(?:with|for|in|on|during|com|para|em|no|na|nos|nas|ao|aos|a|Ã |support|supporting|apoio|apoiando|atendimento|rotinas|processo|processos|disponibilidade|estabilidade|satisfacao|satisfaÃ§Ã£o)\b/i

- src/lib/resume/cv-highlight-artifact.ts:69 - const HIGHLIGHT_DIRECT_CLOSURE_PREPOSITION_PATTERN = /^(?:during|in|on|to|com|para|em|no|na|nos|nas|durante|ao|aos|a|Ã |as|Ã s)\b/i

- src/lib/resume/cv-highlight-artifact.ts:70 - const HIGHLIGHT_SEMANTIC_DESCRIPTOR_HINT_PATTERN = /\b(?:focused|specialized|oriented|dedicated|responsible|experienced|especializado|focado|orientado|dedicado|responsavel|responsÃ¡vel|experiente)\b/i

- src/lib/resume/cv-highlight-artifact.ts:523 - return /^(?:and|or|but|e|ou|mas|para|com|de|do|da|dos|das|em|no|na|nos|nas|ao|aos|a|Ã )\b/i.test(value.trim())

- src/lib/resume/cv-highlight-artifact.ts:587 - return /^(?:para|com|no|na|nos|nas|ao|aos|a|Ã |em|focused on|specialized in|oriented to|dedicated to|responsible for)\b/i.test(normalized)

- src/lib/resume/cv-highlight-artifact.ts:27 - 'â€“',

- src/lib/resume/cv-highlight-artifact.ts:28 - 'â€”',

- src/lib/resume/cv-highlight-artifact.ts:40 - 'â€“',

- src/lib/resume/cv-highlight-artifact.ts:41 - 'â€”',

- src/lib/resume/cv-highlight-artifact.ts:53 - 'â€“',

- src/lib/resume/cv-highlight-artifact.ts:54 - 'â€”',

- src/lib/resume/cv-highlight-artifact.ts:61 - 'â€“',

- src/lib/resume/cv-highlight-artifact.ts:62 - 'â€”',

- src/lib/resume/cv-highlight-artifact.ts:75 - const HIGHLIGHT_REENTRY_BOUNDARY_CHARS = new Set([',', ';', ':', '-', 'â€“', 'â€”'])

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

- src/lib/agent/tools/validate-rewrite.test.ts:65 - `nao` -> `não`
  rationale: 'Existe evidencia contextual forte, mas nao literal.',
