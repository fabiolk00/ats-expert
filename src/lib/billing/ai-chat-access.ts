import { buildCheckoutOnboardingPath } from '@/lib/billing/checkout-navigation'
import type { PlanSlug } from '@/lib/plans'

export const AI_CHAT_FEATURE = 'ai_chat'
export const PLAN_PRO = 'pro' as const
export const SUBSCRIPTION_STATUS_ACTIVE = 'active' as const

export const AI_CHAT_PRO_REQUIRED_CODE = 'PRO_PLAN_REQUIRED'
export const AI_CHAT_ACCESS_UNAVAILABLE_CODE = 'AI_CHAT_ACCESS_UNAVAILABLE'

export const AI_CHAT_PRO_REQUIRED_TITLE = 'Chat com IA exclusivo do plano PRO'
export const AI_CHAT_PRO_REQUIRED_MESSAGE =
  'Este recurso está disponível apenas para usuários do plano PRO. Faça upgrade para acessar o chat com IA.'
export const AI_CHAT_ACCESS_UNAVAILABLE_TITLE = 'Não foi possível validar seu plano'
export const AI_CHAT_ACCESS_UNAVAILABLE_MESSAGE =
  'Não foi possível verificar seu acesso ao chat com IA agora. Atualize a página em instantes.'
export const AI_CHAT_UPGRADE_URL = buildCheckoutOnboardingPath(PLAN_PRO)

export type AiChatBillingStatus = 'active' | 'canceled' | 'past_due'

export type AiChatBillingMetadata = {
  plan: PlanSlug | null
  renewsAt: string | null
  status: AiChatBillingStatus | null
  asaasSubscriptionId: string | null
}

type ActiveAiChatAccessDecision = {
  allowed: true
  feature: typeof AI_CHAT_FEATURE
  reason: 'active_pro'
  plan: typeof PLAN_PRO
  status: typeof SUBSCRIPTION_STATUS_ACTIVE
  renewsAt: string | null
  asaasSubscriptionId: string
}

type DeniedAiChatAccessReason =
  | 'billing_unavailable'
  | 'billing_missing'
  | 'plan_not_pro'
  | 'subscription_inactive'
  | 'subscription_expired'
  | 'missing_subscription_reference'

type DeniedAiChatAccessDecision = {
  allowed: false
  feature: typeof AI_CHAT_FEATURE
  reason: DeniedAiChatAccessReason
  plan: PlanSlug | null
  status: AiChatBillingStatus | null
  renewsAt: string | null
  asaasSubscriptionId: string | null
  code: typeof AI_CHAT_PRO_REQUIRED_CODE | typeof AI_CHAT_ACCESS_UNAVAILABLE_CODE
  title: string
  message: string
  upgradeUrl?: string
}

export type AiChatAccessDecision =
  | ActiveAiChatAccessDecision
  | DeniedAiChatAccessDecision

function hasExpiredRenewal(renewsAt: string | null, now: Date): boolean {
  if (!renewsAt) {
    return false
  }

  const renewalTime = Date.parse(renewsAt)
  if (Number.isNaN(renewalTime)) {
    return true
  }

  return renewalTime <= now.getTime()
}

function buildDeniedDecision(
  reason: DeniedAiChatAccessReason,
  metadata: AiChatBillingMetadata | null,
): DeniedAiChatAccessDecision {
  if (reason === 'billing_unavailable') {
    return {
      allowed: false,
      feature: AI_CHAT_FEATURE,
      reason,
      plan: metadata?.plan ?? null,
      status: metadata?.status ?? null,
      renewsAt: metadata?.renewsAt ?? null,
      asaasSubscriptionId: metadata?.asaasSubscriptionId ?? null,
      code: AI_CHAT_ACCESS_UNAVAILABLE_CODE,
      title: AI_CHAT_ACCESS_UNAVAILABLE_TITLE,
      message: AI_CHAT_ACCESS_UNAVAILABLE_MESSAGE,
    }
  }

  return {
    allowed: false,
    feature: AI_CHAT_FEATURE,
    reason,
    plan: metadata?.plan ?? null,
    status: metadata?.status ?? null,
    renewsAt: metadata?.renewsAt ?? null,
    asaasSubscriptionId: metadata?.asaasSubscriptionId ?? null,
    code: AI_CHAT_PRO_REQUIRED_CODE,
    title: AI_CHAT_PRO_REQUIRED_TITLE,
    message: AI_CHAT_PRO_REQUIRED_MESSAGE,
    upgradeUrl: AI_CHAT_UPGRADE_URL,
  }
}

export function resolveAiChatAccessFromBillingMetadata(
  metadata: AiChatBillingMetadata | null,
  options?: {
    billingMetadataUnavailable?: boolean
    now?: Date
  },
): AiChatAccessDecision {
  if (options?.billingMetadataUnavailable) {
    return buildDeniedDecision('billing_unavailable', metadata)
  }

  if (!metadata) {
    return buildDeniedDecision('billing_missing', null)
  }

  if (metadata.plan !== PLAN_PRO) {
    return buildDeniedDecision('plan_not_pro', metadata)
  }

  if (metadata.status !== SUBSCRIPTION_STATUS_ACTIVE) {
    return buildDeniedDecision('subscription_inactive', metadata)
  }

  if (!metadata.asaasSubscriptionId) {
    return buildDeniedDecision('missing_subscription_reference', metadata)
  }

  if (hasExpiredRenewal(metadata.renewsAt, options?.now ?? new Date())) {
    return buildDeniedDecision('subscription_expired', metadata)
  }

  return {
    allowed: true,
    feature: AI_CHAT_FEATURE,
    reason: 'active_pro',
    plan: PLAN_PRO,
    status: SUBSCRIPTION_STATUS_ACTIVE,
    renewsAt: metadata.renewsAt,
    asaasSubscriptionId: metadata.asaasSubscriptionId,
  }
}
