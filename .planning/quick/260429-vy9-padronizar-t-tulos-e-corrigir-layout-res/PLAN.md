# Quick Task: Padronizar títulos e corrigir layout responsivo da comparação

## Objetivo

Refinar a tela de comparação de Job Targeting após a troca do layout de revisão:

- padronizar o tamanho dos títulos entre "Compatibilidade com a vaga" e "Pontos para revisar";
- fazer o currículo abrir completo no desktop, sem scroll interno no frame;
- remover a feature de colapsar currículo em mobile/tablet;
- em mobile/tablet, ordenar a tela como: compatibilidade, currículo, pontos para revisar.

## Plano

1. Ajustar o título de `ReviewWarningPanel` para o mesmo padrão visual do título do score.
2. Remover `max-height` e `overflow-y-auto` do frame aberto do currículo.
3. Manter colapso apenas em `lg+`; em telas menores, o botão fica escondido e o currículo permanece completo.
4. Reordenar os blocos no DOM/CSS para que mobile/tablet tenha score primeiro, currículo segundo e revisão terceiro.
5. Atualizar testes focados e rodar validações.
