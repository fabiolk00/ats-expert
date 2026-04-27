# Phase 110 Plan Review

## Verdict

**BLOCK**

O plano tem uma base boa no seam principal do pipeline, mas ainda nao prova que o novo fallback de low-fit continua compativel com o override recoverable da Phase 109. Alem disso, o pacote obrigatorio de validacao da fase ainda esta incompleto.

## PASS

### PASS 1 - O seam do low-fit gate esta planejado no lugar certo

O plano coloca o gate em `runJobTargetingPipeline()` antes da persistencia automatica e antes do handoff para artifact generation, o que bate com a ordem real do runtime em [110-01-PLAN.md](/C:/CurrIA/.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-01-PLAN.md), [decision.ts](/C:/CurrIA/src/lib/routes/smart-generation/decision.ts) e [job-targeting-pipeline.ts](/C:/CurrIA/src/lib/agent/job-targeting-pipeline.ts). Hoje o `dispatchSmartGenerationArtifact(...)` so roda depois de `pipeline.success`, e o `createCvVersion(...)` automatico acontece no fim do pipeline. Entao o ponto de interceptacao escolhido esta correto para impedir `createCvVersion`, `generate_file` e reserva automatica.

### PASS 2 - O plano tenta preservar o contrato recoverable da Phase 109

Task 3 reaproveita o modal e o CTA credit-aware existentes em vez de criar uma segunda UX ou uma segunda rota, alinhado com [110-CONTEXT.md](/C:/CurrIA/.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-CONTEXT.md) e com o comportamento ja entregue em [109-01-SUMMARY.md](/C:/CurrIA/.planning/phases/CURRIA-109-recoverable-job-targeting-validation-user-modal-summary-retr/109-01-SUMMARY.md). Isso tambem combina com o helper compartilhado em [validation-override-cta.ts](/C:/CurrIA/src/lib/dashboard/validation-override-cta.ts), que ja alterna entre `Gerar mesmo assim (1 credito)` e `Adicionar creditos`.

### PASS 3 - A promocao de warnings esta narrow por default

Task 2 restringe a promocao a `target_role_overclaim`, `summary_skill_without_evidence` e `unsupported_claim`, e so quando `lowFitWarningGate.triggered === true`. Isso esta alinhado ao foco da fase e evita um hardening amplo demais no `validateRewrite(...)`.

### PASS 4 - A cobertura proposta e bem distribuida entre builder, pipeline, rota e UI

O plano nao concentra tudo em um unico teste. Ele distribui verificacao entre [build-targeting-plan.test.ts](/C:/CurrIA/src/lib/agent/tools/build-targeting-plan.test.ts), [pipeline.test.ts](/C:/CurrIA/src/lib/agent/tools/pipeline.test.ts), [route.test.ts](/C:/CurrIA/src/app/api/profile/smart-generation/route.test.ts), [override route tests](/C:/CurrIA/src/app/api/session/[id]/job-targeting/override/route.test.ts) e os dois consumidores de UI. Isso cobre bem os cenarios off-target, partial-fit e CTA credit-aware.

## BLOCK

### BLOCK 1 - O fallback "gate disparou sem warnings promoviveis" nao esta amarrado ao contrato recoverable da Phase 109

O maior risco do plano esta em Task 2. Ela manda "sintetizar um unico issue recoverable" quando o low-fit gate dispara sem warnings promoviveis, mas nao especifica como esse issue vai continuar elegivel ao override pago.

Hoje isso nao e livre:

- [recoverable-validation.ts](/C:/CurrIA/src/lib/agent/job-targeting/recoverable-validation.ts) usa um allowlist fechado em `RECOVERABLE_VALIDATION_ISSUE_TYPES`
- [override route](/C:/CurrIA/src/app/api/session/[id]/job-targeting/override/route.ts) revalida esse contrato com `isRecoverableValidationBlock(...)`

Se o plano sintetizar um issue novo de low-fit sem mapear explicitamente para esse allowlist, o sistema pode cair no pior estado possivel:

- o modal aparece
- o usuario clica em override
- a rota responde `409` porque o bloqueio deixou de ser recoverable para a Phase 109

Isso viola diretamente o objetivo da fase e o requisito de preservar o override existente.

**Ajuste necessario:** o plano precisa dizer explicitamente uma destas duas coisas:

1. o fallback sintetico reaproveita um `issueType` ja permitido pelo allowlist atual; ou
2. o plano atualiza `RECOVERABLE_VALIDATION_ISSUE_TYPES` e cobre a rota de override para o novo shape de low-fit

Tambem falta um teste explicito para este caso:

- `lowFitWarningGate.triggered === true`
- zero warnings promoviveis
- modal recoverable aparece
- override continua funcionando

Sem isso, a preservacao da semantica da Phase 109 fica incompleta.

### BLOCK 2 - Falta o `VALIDATION.md` exigido pelo Nyquist

O projeto esta com `workflow.nyquist_validation = true` em [.planning/config.json](/C:/CurrIA/.planning/config.json), o [110-RESEARCH.md](/C:/CurrIA/.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-RESEARCH.md) tem secao de Validation Architecture, e a pasta da fase nao tem nenhum `*-VALIDATION.md`.

Pelo gate definido, isso bloqueia a fase antes da execucao.

**Ajuste necessario:** gerar e commitar o `110-VALIDATION.md` antes de executar, ou refazer `/gsd-plan-phase 110 --research` para reconstruir o pacote da fase com o artefato faltante.

### BLOCK 3 - O RESEARCH ainda tem Open Questions nao resolvidas

O [110-RESEARCH.md](/C:/CurrIA/.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-RESEARCH.md) ainda traz `## Open Questions` sem marcador `(RESOLVED)`. As duas abertas afetam contrato real:

- onde os metadados de promocao vivem: so em trace/log ou tambem em `rewriteValidation`
- como `strong_contextual_inference` entra ou nao entra no `coreRequirementCoverage`

Essas nao sao duvidas cosmeticas. Elas influenciam payload, threshold e legibilidade do gate.

**Ajuste necessario:** resolver e marcar a secao como `## Open Questions (RESOLVED)`, ou transformar essas decisoes em checkpoints explicitamente planejados.

### BLOCK 4 - O escopo de um unico plano esta grande demais para um seam compartilhado

O plano modifica 18 arquivos listados em `files_modified` em [110-01-PLAN.md](/C:/CurrIA/.planning/phases/CURRIA-110-hardening-low-fit-warning-gate-and-safer-bridge-emphasis-for/110-01-PLAN.md). Isso cruza types compartilhados, prompting, validator, pipeline, trace, rota e testes de duas UIs.

Para um hardening em brownfield que toca `validate-rewrite.ts`, `rewrite-resume-full.ts` e `job-targeting-pipeline.ts`, isso aumenta o risco de regressao e de perda de nitidez na execucao.

**Ajuste necessario:** dividir pelo menos em:

1. plano de fundacao: emphasis + core coverage + low-fit gate + trace
2. plano de reuso recoverable/UI: copy, compatibilidade do override e prova credit-aware

## FLAG

### FLAG 1 - O frontmatter explicita o stop antes de `createCvVersion`, mas nao explicita o link ate o handoff de artifact

O texto das tasks cobre bem o bloqueio antes de `generate_file`, mas `must_haves.key_links` so destaca o stop antes de `createCvVersion`. Como o foco da fase e justamente o corte antes do artifact handoff, vale deixar isso nomeado tambem no frontmatter para reduzir ambiguidade de execucao.

### FLAG 2 - A copy humana esta coberta, mas falta nomear o caso "vaga distante com pouca prova do core" como fixture obrigatoria de UI

Task 3 cobre copy PT-BR e CTA credit-aware, o que e bom. Ainda assim, eu adicionaria explicitamente um fixture de UI para o texto de low-fit distante, porque a fase muda o framing do modal sem mudar o shell. Isso reduz o risco de o executor validar so o CTA e esquecer o enquadramento humano pedido no PRD.

## Summary

O plano esta conceitualmente certo no ponto mais importante: o gate deve acontecer dentro do `job_targeting` pipeline, antes do sucesso automatico que hoje destrava `createCvVersion` e depois o handoff para `generate_file`. Tambem esta certo em reaproveitar o modal e o billing-safe override da Phase 109, em vez de inventar um segundo caminho.

O bloqueio principal e a lacuna do fallback recoverable quando o gate dispara sem warnings promoviveis. Hoje esse caso ainda nao esta amarrado ao allowlist que autoriza o override pago. Somado a isso, o pacote da fase esta incompleto sem `VALIDATION.md`, e o `RESEARCH.md` ainda nao fechou duas decisoes que impactam contrato.

## Final Verdict

**BLOCK**

O plano deve voltar ao planner antes da execucao. Prioridade de revisao:

1. amarrar explicitamente o fallback low-fit ao contrato recoverable da Phase 109 e adicionar teste para esse edge case
2. gerar `110-VALIDATION.md`
3. resolver as Open Questions do `110-RESEARCH.md`
4. idealmente dividir o plano para reduzir o escopo de 18 arquivos

## Follow-up Review 2026-04-27

### PASS

- O antigo BLOCK 1 foi resolvido. O plano agora amarra explicitamente o fallback sintetico de low-fit ao contrato recoverable da Phase 109: a Task 2 restringe o edge case a `issueType` ja aceito pelo allowlist atual, priorizando `target_role_overclaim` ou `unsupported_claim`, e a verificacao inclui cobertura explicita de override para esse caso.
- O antigo BLOCK 2 foi resolvido. O arquivo `110-VALIDATION.md` existe e cobre matriz de cenarios, checks automatizados e gate de aceitacao para o low-fit recoverable flow.
- O antigo BLOCK 3 foi resolvido. O `110-RESEARCH.md` agora traz `## Open Questions (RESOLVED)` e fecha as duas decisoes que antes ainda estavam em aberto.

### BLOCK

- O antigo BLOCK 4 continua aberto. O `110-01-PLAN.md` ainda concentra 19 arquivos em um unico plano, acima do threshold de blocker para `files/plan` (15+). Como o pacote cruza tipos compartilhados, builder, prompt, validator, pipeline, rota e dois consumidores de UI, o risco de degradacao de execucao continua alto demais para liberar sem split.

## Follow-up Final Verdict

**BLOCK**

Tres BLOCKs anteriores foram corrigidos, mas o bloqueio de escopo permanece. O plano ainda precisa ser dividido ou reduzido antes da execucao.
