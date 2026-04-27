## Validation

- [x] `npm run typecheck`
- [x] `npx vitest run src/components/dashboard/chat-interface.test.tsx src/lib/agent/streaming-loop.test.ts`
- [ ] `src/components/dashboard/chat-interface.route-stream.test.tsx`

## Notes

O teste `chat-interface.route-stream.test.tsx` expôs uma divergência funcional no caminho real de `weak-fit continue`, onde o fluxo retorna para guidance em vez de concluir a geração imediatamente. Isso foi tratado como achado fora do escopo da remoção do score no chat.
