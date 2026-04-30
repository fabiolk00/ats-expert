# Compatibility probable dashboard

Painel recomendado para comparar o comportamento antigo vs novo usando `metric.counter` e eventos `agent.job_targeting.*`.

## Bloco 1 — taxa de bloqueio anterior vs nova

- **Anterior (baseline):** `% de sessions com `agent.job_targeting.pre_rewrite_low_fit_blocked``
- **Nova (com override):** `% de sessions com `compatibility.probable_proceeded` entre sessions com `compatibility.probable_detected``

Sugestão SQL (Postgres/log sink):

```sql
with base as (
  select
    date_trunc('day', created_at) as day,
    count(distinct case when event = 'agent.job_targeting.pre_rewrite_low_fit_blocked' then session_id end) as blocked_sessions,
    count(distinct case when event = 'metric.counter' and payload->>'metric' = 'compatibility.probable_detected' then payload->>'sessionId' end) as probable_detected_sessions,
    count(distinct case when event = 'metric.counter' and payload->>'metric' = 'compatibility.probable_proceeded' then payload->>'sessionId' end) as probable_proceeded_sessions
  from structured_logs
  group by 1
)
select
  day,
  blocked_sessions,
  probable_detected_sessions,
  probable_proceeded_sessions,
  case when probable_detected_sessions = 0 then 0 else probable_proceeded_sessions::numeric / probable_detected_sessions end as new_unblock_rate
from base
order by day desc;
```

## Bloco 2 — taxa de geração bem-sucedida

- Numerador: `agent.job_targeting.completed`
- Denominador: `agent.job_targeting.started`
- Corte adicional: comparar sessões com e sem `compatibility.probable_detected`.

## Bloco 3 — impacto em reclamações de “não match”

- Proxy operacional: taxa de `compatibility.board_fallback_rendered` e repetição de `agent.job_targeting.validation_modal_shown` por usuário em 7 dias.
- Canal de suporte: taggear tickets com label `nao-match` e cruzar por `sessionId` (quando disponível).

## Campos de decisão adicionados

Nos logs de decisão (`agent.job_targeting.plan_built` e `agent.job_targeting.low_fit_gate.evaluated`):

- `explicitSkillCount`
- `inferredSkillCount`
- `missingEvidenceCount`
