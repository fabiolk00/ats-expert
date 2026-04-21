export const RESUME_REWRITE_GUARDRAILS = [
  'Sua missão principal é melhorar o currículo SEM NUNCA piorá-lo ou perder informação relevante. Preservar conteúdo, especificidade técnica e impacto tem prioridade absoluta sobre deixar o texto mais curto ou "limpo".',
  'Preserve todos os detalhes técnicos, ferramentas específicas, responsabilidades, escopo de projetos, contexto de negócio, senioridade e conquistas do currículo original. Nunca remova ou generalize informação significativa apenas para reduzir tamanho.',
  'Mantenha TODAS as métricas reais (percentuais, quantidades, valores, escalas, tempos, impactos). Nunca omita, suavize ou generalize números suportados pelo original. Torne o impacto mais claro quando possível, mas sem inventar.',
  'Trate bullets quantificados como ativos premium. Nunca substitua um bullet com métrica real por outro mais genérico sem preservar ou melhorar o mesmo impacto factual.',
  'Não encurte bullets ou seções se isso resultar em perda de especificidade técnica, métrica, sinal de senioridade ou contexto relevante para recrutadores. Prefira clareza com densidade a brevidade excessiva.',
  'Se a versão reescrita ficar menos detalhada, menos precisa, menos técnica ou menos impactante que a original em qualquer aspecto relevante, revise até que ela fique pelo menos tão forte quanto a original, mantendo total fidelidade aos fatos.',
  'Mantenha senso crítico: melhore redação, estrutura e priorização sem exagerar aderência à vaga, inflar conquistas ou esconder gaps reais. Não invente informações.',
  'Exija verbos de ação fortes no início de cada bullet de experiência (Desenvolvi, Otimizei, Liderei, Implementei, Gerenciei, Projetei, Elaborei, etc.).',
  'Prefira a estrutura de bullet: Verbo forte + o que foi feito (com ferramentas e escopo) + resultado, impacto ou propósito de negócio (quando disponível).',
  'Mantenha estrutura linear e 100% ATS-friendly: Nome completo, contato, Resumo Profissional (4-6 linhas), Experiência Profissional, Habilidades Técnicas, Formação Acadêmica e Certificações.',
  'Em Habilidades Técnicas, preserve amplitude e todas as ferramentas concretas. Nunca substitua tecnologias específicas por rótulos vagos ou genéricos.',
  'Resumo Profissional deve ter entre 4 e 6 linhas, destacando o perfil real e senioridade sem cair em afirmações genéricas ou buzzwords vazios.',
  'Use português brasileiro profissional, objetivo e confiante. Evite linguagem de marketing inflada e buzzwords vazios.',
] as const

export function formatResumeRewriteGuardrails(): string {
  return RESUME_REWRITE_GUARDRAILS.map((item) => `- ${item}`).join('\n')
}
