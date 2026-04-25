import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PLANS } from '@/lib/plans'
import {
  finalizeCreditReservation as finalizeCreditReservationRecord,
  releaseCreditReservation as releaseCreditReservationRecord,
  reserveCreditForGenerationIntent as reserveCreditForGenerationIntentRecord,
} from '@/lib/db/credit-reservations'
import {
  checkUserQuota,
  consumeCredit,
  consumeCreditForGeneration,
  finalizeCreditReservation,
  getActiveRecurringSubscription,
  getUserBillingInfo,
  grantCredits,
  releaseCreditReservation,
  revokeSubscription,
  reserveCreditForGenerationIntent,
} from './quota'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { logWarn } from '@/lib/observability/structured-log'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/db/credit-reservations', () => ({
  reserveCreditForGenerationIntent: vi.fn(),
  finalizeCreditReservation: vi.fn(),
  releaseCreditReservation: vi.fn(),
}))

vi.mock('@/lib/observability/structured-log', () => ({
  logWarn: vi.fn(),
}))

const creditAccountUpsert = vi.fn()
const creditAccountSingle = vi.fn()
const creditAccountMaybeSingle = vi.fn()
const creditAccountUpdateSelect = vi.fn()
const userQuotaUpsert = vi.fn()
const userQuotaUpdateEq = vi.fn()
const userQuotaUpdate = vi.fn()
const userQuotaSingle = vi.fn()
const userQuotaMaybeSingle = vi.fn()
const userQuotaSelect = vi.fn()
const userQuotaEq = vi.fn()
const creditAccountEq = vi.fn()

const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn((table: string) => {
    if (table === 'credit_accounts') {
      return {
        upsert: creditAccountUpsert,
        select: vi.fn(() => ({
          eq: creditAccountEq,
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: creditAccountUpdateSelect,
            })),
          })),
        })),
      }
    }

    if (table === 'user_quotas') {
      return {
        upsert: userQuotaUpsert,
        update: userQuotaUpdate,
        select: userQuotaSelect,
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}

describe('quota credit source of truth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getSupabaseAdminClient>,
    )

    creditAccountUpsert.mockResolvedValue({ error: null })
    creditAccountSingle.mockResolvedValue({ data: { credits_remaining: 3 } })
    creditAccountMaybeSingle.mockResolvedValue({
      data: { credits_remaining: 12 },
      error: null,
    })
    creditAccountUpdateSelect.mockResolvedValue({ data: [{ credits_remaining: 2 }], error: null })
    userQuotaUpsert.mockResolvedValue({ error: null })
    userQuotaUpdateEq.mockResolvedValue({ error: null })
    userQuotaUpdate.mockReturnValue({
      eq: userQuotaUpdateEq,
    })
    creditAccountEq.mockReturnValue({
      single: creditAccountSingle,
      maybeSingle: creditAccountMaybeSingle,
    })
    userQuotaSingle.mockResolvedValue({ data: { user_id: 'usr_123' } })
    userQuotaMaybeSingle.mockResolvedValue({
      data: {
        plan: 'monthly',
        credits_remaining: 12,
        renews_at: '2026-04-30T00:00:00.000Z',
        status: 'active',
        asaas_subscription_id: 'sub_123',
      },
      error: null,
    })
    userQuotaSelect.mockReturnValue({
      eq: userQuotaEq,
    })
    userQuotaEq.mockReturnValue({
      returns: vi.fn().mockResolvedValue({ data: [{ user_id: 'usr_123' }], error: null }),
      single: userQuotaSingle,
      maybeSingle: userQuotaMaybeSingle,
    })
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
    vi.mocked(reserveCreditForGenerationIntentRecord).mockResolvedValue({
      wasCreated: true,
      reservation: {
        id: 'reservation_123',
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        type: 'ATS_ENHANCEMENT',
        status: 'reserved',
        creditsReserved: 1,
        reservedAt: new Date('2026-04-20T00:00:00.000Z'),
        reconciliationStatus: 'clean',
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        updatedAt: new Date('2026-04-20T00:00:00.000Z'),
      },
    })
    vi.mocked(finalizeCreditReservationRecord).mockResolvedValue({
      id: 'reservation_123',
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      type: 'ATS_ENHANCEMENT',
      status: 'finalized',
      creditsReserved: 1,
      reservedAt: new Date('2026-04-20T00:00:00.000Z'),
      finalizedAt: new Date('2026-04-20T00:01:00.000Z'),
      reconciliationStatus: 'clean',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:01:00.000Z'),
    })
    vi.mocked(releaseCreditReservationRecord).mockResolvedValue({
      id: 'reservation_123',
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      type: 'ATS_ENHANCEMENT',
      status: 'released',
      creditsReserved: 1,
      reservedAt: new Date('2026-04-20T00:00:00.000Z'),
      releasedAt: new Date('2026-04-20T00:01:00.000Z'),
      reconciliationStatus: 'clean',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:01:00.000Z'),
    })
  })

  it('grants credits through credit_accounts and stores matching display totals in user_quotas', async () => {
    await grantCredits('usr_123', 'monthly', 'sub_123')

    expect(creditAccountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cred_usr_123',
        user_id: 'usr_123',
        credits_remaining: PLANS.monthly.credits,
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' },
    )

    const [quotaPayload] = userQuotaUpsert.mock.calls[0]
    expect(quotaPayload).toMatchObject({
      user_id: 'usr_123',
      plan: 'monthly',
      credits_remaining: PLANS.monthly.credits,
      asaas_subscription_id: 'sub_123',
      status: 'active',
      updated_at: expect.any(String),
    })
  })

  it('checks quota from credit_accounts only', async () => {
    await expect(checkUserQuota('usr_123')).resolves.toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('credit_accounts')
  })

  it('marks subscriptions canceled without revoking remaining credits', async () => {
    await revokeSubscription('sub_123')

    expect(userQuotaUpdate).toHaveBeenCalledWith({
      renews_at: null,
      status: 'canceled',
      updated_at: expect.any(String),
    })
    expect(creditAccountUpsert).not.toHaveBeenCalled()
  })

  it('uses the atomic rpc result when available', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

    await expect(consumeCredit('usr_123')).resolves.toBe(true)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_credit_atomic', {
      p_user_id: 'usr_123',
    })
  })

  it('handles concurrent fallback consumption requests safely', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'function consume_credit_atomic does not exist' },
    })
    creditAccountSingle.mockResolvedValue({ data: { credits_remaining: 1 } })
    creditAccountUpdateSelect
      .mockResolvedValueOnce({ data: [{ credits_remaining: 0 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const results = await Promise.all(Array.from({ length: 5 }, () => consumeCredit('usr_123')))

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(creditAccountUpdateSelect).toHaveBeenCalledTimes(5)
  })

  it('falls back to generic credit consumption when generation rpc is unavailable', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'function consume_credit_for_generation does not exist' },
      })
      .mockResolvedValueOnce({ data: true, error: null })

    await expect(
      consumeCreditForGeneration('usr_123', 'gen_123', 'ATS_ENHANCEMENT'),
    ).resolves.toBe(true)

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'consume_credit_for_generation', {
      p_user_id: 'usr_123',
      p_resume_generation_id: 'gen_123',
      p_generation_type: 'ATS_ENHANCEMENT',
    })
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'consume_credit_atomic', {
      p_user_id: 'usr_123',
    })
  })

  it('falls back to generic credit consumption when generation billing tables are unavailable', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'relation "credit_consumptions" does not exist' },
      })
      .mockResolvedValueOnce({ data: true, error: null })

    await expect(
      consumeCreditForGeneration('usr_123', 'gen_123', 'ATS_ENHANCEMENT'),
    ).resolves.toBe(true)

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'consume_credit_atomic', {
      p_user_id: 'usr_123',
    })
  })

  it('falls back to generic credit consumption when resume_generations is unavailable', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'relation "resume_generations" does not exist' },
      })
      .mockResolvedValueOnce({ data: true, error: null })

    await expect(
      consumeCreditForGeneration('usr_123', 'gen_123', 'ATS_ENHANCEMENT'),
    ).resolves.toBe(true)

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'consume_credit_atomic', {
      p_user_id: 'usr_123',
    })
  })

  it('falls back to generic credit consumption when generation billing columns drift', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'column "resume_generation_id" does not exist' },
      })
      .mockResolvedValueOnce({ data: true, error: null })

    await expect(
      consumeCreditForGeneration('usr_123', 'gen_123', 'ATS_ENHANCEMENT'),
    ).resolves.toBe(true)

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'consume_credit_atomic', {
      p_user_id: 'usr_123',
    })
    expect(logWarn).toHaveBeenCalledWith(
      'billing.consume_credit_for_generation_fallback',
      expect.objectContaining({
        appUserId: 'usr_123',
        resumeGenerationId: 'gen_123',
        generationType: 'ATS_ENHANCEMENT',
        stage: 'billing',
      }),
    )
  })

  it('reserves credit through the reservation-backed billing seam', async () => {
    const reservation = await reserveCreditForGenerationIntent({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      generationType: 'ATS_ENHANCEMENT',
      jobId: 'job_123',
      sessionId: 'session_123',
    })

    expect(reservation.status).toBe('reserved')
    expect(reserveCreditForGenerationIntentRecord).toHaveBeenCalledWith({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      generationType: 'ATS_ENHANCEMENT',
      jobId: 'job_123',
      sessionId: 'session_123',
    })
  })

  it('finalizes an existing reservation without a second balance mutation in the wrapper layer', async () => {
    const reservation = await finalizeCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      resumeGenerationId: 'generation_123',
    })

    expect(reservation.status).toBe('finalized')
    expect(finalizeCreditReservationRecord).toHaveBeenCalledWith({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      resumeGenerationId: 'generation_123',
    })
  })

  it('releases an existing reservation through the shared billing seam', async () => {
    const reservation = await releaseCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
    })

    expect(reservation.status).toBe('released')
    expect(releaseCreditReservationRecord).toHaveBeenCalledWith({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
    })
  })

  it('fails closed when reservation infrastructure is unavailable', async () => {
    vi.mocked(reserveCreditForGenerationIntentRecord).mockRejectedValueOnce(
      new Error('Failed to reserve credit for generation intent: function reserve_credit_for_generation_intent does not exist'),
    )

    await expect(
      reserveCreditForGenerationIntent({
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        generationType: 'ATS_ENHANCEMENT',
      }),
    ).rejects.toThrow(
      'Failed to reserve credit for generation intent: function reserve_credit_for_generation_intent does not exist',
    )
  })

  it('returns the full billing view model when metadata and credits exist', async () => {
    await expect(getUserBillingInfo('usr_123')).resolves.toEqual({
      plan: 'monthly',
      creditsRemaining: 12,
      maxCredits: 12,
      renewsAt: '2026-04-30T00:00:00.000Z',
      status: 'active',
      asaasSubscriptionId: 'sub_123',
      hasActiveRecurringSubscription: true,
    })
  })

  it('uses the persisted display total when preserved credits exceed the base plan allowance', async () => {
    creditAccountMaybeSingle.mockResolvedValueOnce({
      data: { credits_remaining: 4 },
      error: null,
    })
    userQuotaMaybeSingle.mockResolvedValueOnce({
      data: {
        plan: 'unit',
        credits_remaining: 4,
        renews_at: null,
        status: 'active',
        asaas_subscription_id: null,
      },
      error: null,
    })
    userQuotaMaybeSingle.mockResolvedValueOnce({
      data: {
        credits_remaining: 4,
      },
      error: null,
    })
    await expect(getUserBillingInfo('usr_123')).resolves.toEqual({
      plan: 'unit',
      creditsRemaining: 4,
      maxCredits: 4,
      renewsAt: null,
      status: 'active',
      asaasSubscriptionId: null,
      hasActiveRecurringSubscription: false,
    })
  })

  it('returns null for canceled recurring subscriptions in the active recurring lookup', async () => {
    userQuotaMaybeSingle.mockResolvedValueOnce({
      data: {
        plan: 'monthly',
        renews_at: null,
        status: 'canceled',
        asaas_subscription_id: 'sub_123',
      },
      error: null,
    })

    await expect(getActiveRecurringSubscription('usr_123')).resolves.toBeNull()
  })

  it('throws when billing metadata cannot load the credit balance', async () => {
    creditAccountMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'credit lookup failed' },
    })

    await expect(getUserBillingInfo('usr_123')).rejects.toThrow(
      'Failed to load credit balance: credit lookup failed',
    )
  })
})
