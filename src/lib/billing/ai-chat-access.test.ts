import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AI_CHAT_ACCESS_UNAVAILABLE_CODE,
  AI_CHAT_PRO_REQUIRED_CODE,
  AI_CHAT_UPGRADE_URL,
  resolveAiChatAccessFromBillingMetadata,
} from '@/lib/billing/ai-chat-access'
import { getAiChatAccess } from '@/lib/billing/ai-chat-access.server'
import { getUserBillingMetadata } from '@/lib/asaas/quota'

vi.mock('@/lib/asaas/quota', () => ({
  getUserBillingMetadata: vi.fn(),
}))

describe('ai chat access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows users with an active Pro subscription', () => {
    const decision = resolveAiChatAccessFromBillingMetadata({
      plan: 'pro',
      renewsAt: '2026-05-20T00:00:00.000Z',
      status: 'active',
      asaasSubscriptionId: 'sub_pro_123',
    }, {
      now: new Date('2026-04-25T00:00:00.000Z'),
    })

    expect(decision).toEqual({
      allowed: true,
      feature: 'ai_chat',
      reason: 'active_pro',
      plan: 'pro',
      status: 'active',
      renewsAt: '2026-05-20T00:00:00.000Z',
      asaasSubscriptionId: 'sub_pro_123',
    })
  })

  it('allows active Pro subscriptions even when renewsAt is missing', () => {
    const decision = resolveAiChatAccessFromBillingMetadata({
      plan: 'pro',
      renewsAt: null,
      status: 'active',
      asaasSubscriptionId: 'sub_pro_123',
    })

    expect(decision.allowed).toBe(true)
  })

  it('denies non-Pro plans and returns the upgrade path', () => {
    const decision = resolveAiChatAccessFromBillingMetadata({
      plan: 'monthly',
      renewsAt: '2026-05-20T00:00:00.000Z',
      status: 'active',
      asaasSubscriptionId: 'sub_monthly_123',
    })

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'plan_not_pro',
      code: AI_CHAT_PRO_REQUIRED_CODE,
      upgradeUrl: AI_CHAT_UPGRADE_URL,
      plan: 'monthly',
    })
  })

  it('denies inactive Pro subscriptions', () => {
    const decision = resolveAiChatAccessFromBillingMetadata({
      plan: 'pro',
      renewsAt: '2026-05-20T00:00:00.000Z',
      status: 'canceled',
      asaasSubscriptionId: 'sub_pro_123',
    })

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'subscription_inactive',
      code: AI_CHAT_PRO_REQUIRED_CODE,
    })
  })

  it('denies expired Pro subscriptions when renewsAt is in the past', () => {
    const decision = resolveAiChatAccessFromBillingMetadata({
      plan: 'pro',
      renewsAt: '2026-04-20T00:00:00.000Z',
      status: 'active',
      asaasSubscriptionId: 'sub_pro_123',
    }, {
      now: new Date('2026-04-25T00:00:00.000Z'),
    })

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'subscription_expired',
      code: AI_CHAT_PRO_REQUIRED_CODE,
    })
  })

  it('denies missing billing metadata by default', () => {
    const decision = resolveAiChatAccessFromBillingMetadata(null)

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'billing_missing',
      code: AI_CHAT_PRO_REQUIRED_CODE,
    })
  })

  it('denies access when the billing lookup fails', async () => {
    vi.mocked(getUserBillingMetadata).mockRejectedValue(new Error('lookup failed'))

    await expect(getAiChatAccess('usr_123')).resolves.toMatchObject({
      allowed: false,
      reason: 'billing_unavailable',
      code: AI_CHAT_ACCESS_UNAVAILABLE_CODE,
    })
  })
})
