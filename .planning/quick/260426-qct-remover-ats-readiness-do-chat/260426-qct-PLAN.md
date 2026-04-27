## Goal

Remover a exposição de ATS Readiness da superfície do chat, preservando o fluxo existente de aprovação/geração.

## Scope

- Remover o score do header do chat.
- Remover menções de score/faixa/diagnóstico ATS das mensagens automáticas do chat.
- Preservar o gatilho atual de `Aceito` no fluxo `dialog`.

## Validation

- `npm run typecheck`
- `npx vitest run src/components/dashboard/chat-interface.test.tsx src/lib/agent/streaming-loop.test.ts`
