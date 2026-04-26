import type { PlanSlug } from "@/lib/plans"

type PaidPlanSlug = Exclude<PlanSlug, "free">

export const PUBLIC_ROUTES = {
  home: "/",
  login: "/entrar",
  signup: "/criar-conta",
  atsGuide: "/o-que-e-ats",
  privacy: "/privacidade",
  terms: "/termos",
  checkout: "/finalizar-compra",
} as const

export const PUBLIC_SECTION_ROUTES = {
  pricing: "/#pricing",
} as const

export function buildCheckoutPathWithPlan(plan: PaidPlanSlug): string {
  return `${PUBLIC_ROUTES.checkout}?plan=${plan}`
}
