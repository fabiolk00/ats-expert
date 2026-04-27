## Delivered

- Chat header não mostra mais `ATS Readiness Score`.
- Mensagens finais e determinísticas do chat não expõem mais score ATS, faixa estimada ou diagnóstico heurístico.
- O estado interno de `atsReadiness` foi mantido apenas para o gate atual de aprovação no fluxo `dialog`.

## Notes

- A surface de comparação já tinha sido limpa antes desta quick task.
- Um teste de integração real do fluxo `weak-fit continue` mostrou um comportamento funcional separado do escopo desta remoção.
