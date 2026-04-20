# Quick Task 260419-wbo Plan

## Goal

Ajustar a tela `/dashboard/resumes/new` para fechar o modal ao iniciar importações, mostrar um preenchimento guiado em verde nas seções do editor e corrigir os toasts informativos para fundo preto com botão de fechar.

## Tasks

1. Atualizar o modal de importação para sinalizar início e fim do fluxo sem interromper o polling em background.
2. Conectar o `UserDataPage` e o `VisualResumeEditor` a um estado de importação guiada com progressão visual por seção.
3. Ajustar o toaster global e adicionar cobertura de testes focada nos novos comportamentos.
