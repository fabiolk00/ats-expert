import type { PlanSlug } from "@/lib/plans"

type PaidPlanSlug = Exclude<PlanSlug, "free">

export const PUBLIC_ROUTES = {
  home: "/",
  login: "/entrar",
  signup: "/criar-conta",
  pricing: "/precos",
  atsGuide: "/o-que-e-ats",
  privacy: "/privacidade",
  terms: "/termos",
  checkout: "/finalizar-compra",
} as const

export function buildPricingPathWithPlan(plan: PaidPlanSlug): string {
  return `${PUBLIC_ROUTES.pricing}?checkoutPlan=${plan}`
}

export function buildCheckoutPathWithPlan(plan: PaidPlanSlug): string {
  return `${PUBLIC_ROUTES.checkout}?plan=${plan}`
}
