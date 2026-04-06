import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { PLANS } from '@/lib/plans'

import {
  getPersistedPlan,
  getPersistedSubscriptionMetadata,
  grantCreditsForEvent,
  updateSubscriptionMetadataForEvent,
} from './credit-grants'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

const rpc = vi.fn()
const maybeSingle = vi.fn()

const mockSupabase = {
  rpc,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle,
      })),
    })),
  })),
}

describe('billing credit grants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getSupabaseAdminClient>,
    )
    rpc.mockResolvedValue({ data: 'processed', error: null })
    maybeSingle.mockResolvedValue({ data: { plan: 'monthly' }, error: null })
  })

  it('grants credits through the billing rpc using checkout trust anchors', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_123',
        externalReference: 'curria:v1:c:chk_123',
        subscription: null,
        value: 19.9,
      },
    }

    await grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_123',
      eventPayload: event,
      billingEventType: 'PAYMENT_SETTLED',
      plan: 'unit',
      amountMinor: 1900,
      checkoutReference: 'chk_123',
      isRenewal: false,
      reason: 'payment_received',
    })

    expect(rpc).toHaveBeenCalledWith('apply_billing_credit_grant_event', {
      p_app_user_id: 'usr_123',
      p_plan: 'unit',
      p_credits: PLANS.unit.credits,
      p_amount_minor: 1900,
      p_checkout_reference: 'chk_123',
      p_asaas_subscription_id: null,
      p_renews_at: null,
      p_status: 'active',
      p_event_fingerprint: 'fp_123',
      p_event_type: 'PAYMENT_SETTLED',
      p_event_payload: event,
      p_is_renewal: false,
    })
  })

  it('updates subscription metadata without touching runtime credit storage directly', async () => {
    const event = {
      event: 'SUBSCRIPTION_INACTIVATED' as const,
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123',
      },
    }

    await updateSubscriptionMetadataForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_456',
      eventPayload: event,
      billingEventType: 'SUBSCRIPTION_CANCELED',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_123',
      renewsAt: null,
      status: 'canceled',
      reason: 'subscription_inactivated',
    })

    expect(rpc).toHaveBeenCalledWith('apply_billing_subscription_metadata_event', {
      p_app_user_id: 'usr_123',
      p_plan: 'monthly',
      p_checkout_reference: null,
      p_asaas_subscription_id: 'sub_123',
      p_renews_at: null,
      p_status: 'canceled',
      p_event_fingerprint: 'fp_456',
      p_event_type: 'SUBSCRIPTION_CANCELED',
      p_event_payload: event,
    })
  })

  it('reads the persisted plan slug from user_quotas metadata', async () => {
    await expect(getPersistedPlan('usr_123')).resolves.toBe('monthly')
  })

  it('reads persisted subscription metadata by subscription id', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        user_id: 'usr_123',
        plan: 'monthly',
        asaas_subscription_id: 'sub_123',
        renews_at: '2026-04-29T00:00:00.000Z',
        status: 'active',
      },
      error: null,
    })

    await expect(getPersistedSubscriptionMetadata('sub_123')).resolves.toEqual({
      appUserId: 'usr_123',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_123',
      renewsAt: '2026-04-29T00:00:00.000Z',
      status: 'active',
    })
  })

  it('rejects unknown plans before calling the rpc', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_123',
        externalReference: 'curria:v1:c:chk_123',
      },
    }

    await expect(grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_789',
      eventPayload: event,
      billingEventType: 'PAYMENT_SETTLED',
      plan: 'invalid' as 'unit',
      reason: 'payment_received',
    })).rejects.toThrow('Plan not found: invalid')

    expect(rpc).not.toHaveBeenCalled()
  })

  it('surfaces rpc overflow rejections for credit grants', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_renewal',
        externalReference: 'curria:v1:c:chk_monthly',
        subscription: 'sub_123',
        value: 39.9,
        dueDate: '2026-05-29',
      },
    }

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Credit grant would exceed max balance.' },
    })

    await expect(grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_overflow',
      eventPayload: event,
      billingEventType: 'SUBSCRIPTION_RENEWED',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_123',
      renewsAt: '2026-06-29T00:00:00.000Z',
      isRenewal: true,
      reason: 'subscription_renewed',
    })).rejects.toThrow('Failed to grant credits: Credit grant would exceed max balance.')
  })

  it('surfaces rpc negative-balance rejections for credit grants', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_renewal',
        externalReference: 'curria:v1:c:chk_monthly',
        subscription: 'sub_123',
        value: 39.9,
        dueDate: '2026-05-29',
      },
    }

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Negative existing balance detected for user usr_123' },
    })

    await expect(grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_negative',
      eventPayload: event,
      billingEventType: 'SUBSCRIPTION_RENEWED',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_123',
      renewsAt: '2026-06-29T00:00:00.000Z',
      isRenewal: true,
      reason: 'subscription_renewed',
    })).rejects.toThrow('Failed to grant credits: Negative existing balance detected for user usr_123')
  })

  it('surfaces rpc invalid checkout trust-anchor rejections for initial events', async () => {
    const event = {
      event: 'PAYMENT_CONFIRMED' as const,
      payment: {
        id: 'pay_123',
        externalReference: 'curria:v1:c:chk_missing',
        subscription: null,
        value: 19.9,
      },
    }

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Checkout record not found: chk_missing' },
    })

    await expect(grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_missing_checkout',
      eventPayload: event,
      billingEventType: 'PAYMENT_SETTLED',
      plan: 'unit',
      amountMinor: 1900,
      checkoutReference: 'chk_missing',
      isRenewal: false,
      reason: 'payment_confirmed',
    })).rejects.toThrow('Failed to grant credits: Checkout record not found: chk_missing')
  })

  it('surfaces rpc invalid subscription trust-anchor rejections for recurring events', async () => {
    const event = {
      event: 'SUBSCRIPTION_DELETED' as const,
      subscription: {
        id: 'sub_missing',
        externalReference: 'usr_123',
      },
    }

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'User quota record not found for subscription sub_missing' },
    })

    await expect(updateSubscriptionMetadataForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_missing_subscription',
      eventPayload: event,
      billingEventType: 'SUBSCRIPTION_CANCELED',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_missing',
      renewsAt: null,
      status: 'canceled',
      reason: 'subscription_deleted',
    })).rejects.toThrow(
      'Failed to update subscription metadata: User quota record not found for subscription sub_missing',
    )
  })

  it('carries over remaining credits when upgrading plans', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_upgrade',
        externalReference: 'curria:v1:c:chk_upgrade',
        subscription: null,
        value: 39.9,
      },
    }

    await grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_upgrade',
      eventPayload: event,
      billingEventType: 'PAYMENT_SETTLED',
      plan: 'monthly',
      amountMinor: 3990,
      checkoutReference: 'chk_upgrade',
      isRenewal: false,
      reason: 'payment_received',
    })

    expect(rpc).toHaveBeenCalledWith('apply_billing_credit_grant_event', expect.objectContaining({
      p_is_renewal: false,
      p_plan: 'monthly',
      p_credits: PLANS.monthly.credits,
    }))
  })

  it('replaces credits on subscription renewal', async () => {
    const event = {
      event: 'PAYMENT_RECEIVED' as const,
      payment: {
        id: 'pay_renewal',
        externalReference: 'curria:v1:c:chk_monthly',
        subscription: 'sub_123',
        value: 39.9,
        dueDate: '2026-05-29',
      },
    }

    await grantCreditsForEvent({
      appUserId: 'usr_123',
      eventFingerprint: 'fp_renewal',
      eventPayload: event,
      billingEventType: 'SUBSCRIPTION_RENEWED',
      plan: 'monthly',
      asaasSubscriptionId: 'sub_123',
      renewsAt: '2026-06-29T00:00:00.000Z',
      isRenewal: true,
      reason: 'subscription_renewed',
    })

    expect(rpc).toHaveBeenCalledWith('apply_billing_credit_grant_event', expect.objectContaining({
      p_is_renewal: true,
      p_plan: 'monthly',
      p_credits: PLANS.monthly.credits,
    }))
  })
})
