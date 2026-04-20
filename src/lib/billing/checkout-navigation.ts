import type { PlanSlug } from '@/lib/plans'
import { buildCheckoutPathWithPlan, buildPricingPathWithPlan } from '@/lib/routes/public'

export type PaidPlanSlug = Exclude<PlanSlug, 'free'>
const DEFAULT_CHECKOUT_ONBOARDING_PLAN: PaidPlanSlug = 'monthly'

export function isPaidPlanSlug(value: string | null | undefined): value is PaidPlanSlug {
  return value === 'unit' || value === 'monthly' || value === 'pro'
}

export function buildCheckoutResumePath(plan: PaidPlanSlug): string {
  return buildPricingPathWithPlan(plan)
}

export function buildCheckoutOnboardingPath(plan: PaidPlanSlug): string {
  return buildCheckoutPathWithPlan(plan)
}

export function buildDefaultCheckoutOnboardingPath(): string {
  return buildCheckoutOnboardingPath(DEFAULT_CHECKOUT_ONBOARDING_PLAN)
}
