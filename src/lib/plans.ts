/**
 * SINGLE SOURCE OF TRUTH for all pricing and plan data.
 * Every component, API route, and config file MUST import from here.
 * Never hardcode plan values elsewhere.
 */

export const PLANS = {
  free: {
    name: "Gratis",
    slug: "free",
    price: 0,
    credits: 1,
    billing: "once" as const,
    description: "Experimente sem compromisso",
    features: [
      "1 analise de curriculo gratis",
      "Score ATS basico",
      "Lista de palavras-chave",
      "Sugestoes de melhoria",
    ],
    highlighted: false,
  },
  unit: {
    name: "Unitario",
    slug: "unit",
    price: 1990,
    credits: 3,
    billing: "once" as const,
    description: "Para analises pontuais",
    features: [
      "3 analises ATS completas",
      "3 arquivos DOCX + PDF",
      "Download imediato",
      "Chat com IA",
    ],
    highlighted: false,
  },
  monthly: {
    name: "Mensal",
    slug: "monthly",
    price: 3990,
    credits: 20,
    billing: "monthly" as const,
    description: "Ideal para busca ativa de emprego",
    features: [
      "20 curriculos por mes",
      "Chat iterativo com IA",
      "Historico de curriculos",
      "Match com vagas",
    ],
    highlighted: true,
  },
  pro: {
    name: "Pro",
    slug: "pro",
    price: 6990,
    credits: 50,
    billing: "monthly" as const,
    description: "Para profissionais e recrutadores",
    features: [
      "50 curriculos por mes",
      "Tudo do plano Mensal",
      "Suporte prioritario",
      "Acesso antecipado a recursos",
    ],
    highlighted: false,
  },
} as const

export type PlanSlug = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanSlug]

/**
 * Helper to format price for display
 */
export function formatPrice(cents: number, period?: string): string {
  if (cents === 0) return "R$ 0"
  const reais = cents / 100
  const formatted = `R$ ${reais.toFixed(2).replace(/\.00$/, "")}`
  return period ? `${formatted}${period}` : formatted
}

/**
 * Helper to get plan by slug with type safety
 */
export function getPlan(slug: string): Plan | null {
  return PLANS[slug as PlanSlug] ?? null
}
