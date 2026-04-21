# ATS Readiness: produto vs diagnostico interno

## Regra principal

`ATS Readiness v2` e o unico contrato canonico de produto para score exibido em ATS enhancement.

Ele e o unico contrato que pode alimentar:
- UI principal
- payloads publicos de sessao e comparison
- badges `Final` e `Estimado`
- score exato ou `estimated_range`

## O que continua existindo internamente

O score heuristico bruto ainda existe para:
- diagnostico interno
- compatibilidade com consumidores legados
- auditoria e debugging

Esse score aparece com nomes como:
- `internalHeuristicAtsScore`
- `overallScore` em analisadores internos

Esses campos nao sao score oficial de produto.

## O que nunca deve acontecer

Nao usar raw heuristico como verdade de UI.

Nao tratar:
- `internalHeuristicAtsScore`
- `atsScore` legado
- `overallScore` interno

como equivalente a `ATS Readiness Score`.

## Compatibilidade legada

Os campos publicos legados abaixo ainda podem existir temporariamente:
- `SessionResponse.atsScore`
- `AgentDoneChunk.atsScore`

Eles sao compat-only.

Quando aparecerem:
- devem ser tratados como legado
- nao devem virar source of truth de produto
- o caminho principal deve continuar usando `atsReadiness`

## Sunset recomendado

1. Medir emissao dos compat fields.
2. Confirmar se ainda existem consumidores relevantes.
3. Fechar a comunicacao interna sobre `ATS Readiness v2`.
4. Remover adapters legados em uma phase curta futura.
