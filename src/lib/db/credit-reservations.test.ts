import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResumeGenerationType } from '@/types/agent'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import {
  finalizeCreditReservation,
  getCreditLedgerEntriesForIntent,
  listCreditLedgerEntriesForUser,
  listCreditReservationsForReconciliation,
  listCreditReservationsForUser,
  markCreditReservationReconciliation,
  releaseCreditReservation,
  reserveCreditForGenerationIntent,
  settleCreditReservationTransition,
} from './credit-reservations'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

type ReservationStatus = 'reserved' | 'finalized' | 'released' | 'needs_reconciliation'

function buildReservationRow(status: ReservationStatus) {
  return {
    id: 'reservation_123',
    user_id: 'usr_123',
    generation_intent_key: 'intent_123',
    job_id: 'job_123',
    session_id: 'session_123',
    resume_target_id: 'target_123',
    resume_generation_id: null,
    type: 'ATS_ENHANCEMENT' as ResumeGenerationType,
    status,
    credits_reserved: 1,
    failure_reason: status === 'needs_reconciliation' ? 'contradictory_transition' : null,
    reserved_at: '2026-04-20T00:00:00.000Z',
    finalized_at: status === 'finalized' ? '2026-04-20T00:02:00.000Z' : null,
    released_at: status === 'released' ? '2026-04-20T00:02:00.000Z' : null,
    reconciliation_status: status === 'needs_reconciliation' ? 'pending' : 'clean',
    metadata: { source: 'test' },
    created_at: '2026-04-20T00:00:00.000Z',
    updated_at: '2026-04-20T00:02:00.000Z',
  }
}

function buildReservationRowForUser(input: {
  userId: string
  generationIntentKey: string
  status: ReservationStatus
  createdAt: string
  sessionId?: string | null
  resumeTargetId?: string | null
}) {
  return {
    ...buildReservationRow(input.status),
    user_id: input.userId,
    generation_intent_key: input.generationIntentKey,
    session_id: input.sessionId ?? null,
    resume_target_id: input.resumeTargetId ?? null,
    created_at: input.createdAt,
    updated_at: input.createdAt,
  }
}

function buildLedgerRow(entryType: 'reservation_hold' | 'reservation_finalize' | 'reservation_release') {
  return {
    id: `${entryType}_123`,
    user_id: 'usr_123',
    reservation_id: 'reservation_123',
    generation_intent_key: 'intent_123',
    entry_type: entryType,
    credits_delta: entryType === 'reservation_release' ? 1 : -1,
    balance_after: entryType === 'reservation_hold' ? 4 : 4,
    job_id: 'job_123',
    session_id: 'session_123',
    resume_target_id: 'target_123',
    resume_generation_id: entryType === 'reservation_finalize' ? 'generation_123' : null,
    metadata: { evidence: entryType },
    created_at: '2026-04-20T00:03:00.000Z',
  }
}

function buildLedgerRowForUser(input: {
  userId: string
  generationIntentKey: string
  entryType: 'reservation_hold' | 'reservation_finalize' | 'reservation_release'
  createdAt: string
  sessionId?: string | null
  resumeTargetId?: string | null
}) {
  return {
    ...buildLedgerRow(input.entryType),
    user_id: input.userId,
    generation_intent_key: input.generationIntentKey,
    session_id: input.sessionId ?? null,
    resume_target_id: input.resumeTargetId ?? null,
    created_at: input.createdAt,
  }
}

describe('credit reservation repository', () => {
  const reservationMaybeSingle = vi.fn()
  const reservationSelect = vi.fn()
  const reservationEqUser = vi.fn()
  const reservationEqIntent = vi.fn()
  const reservationOrder = vi.fn()
  const reservationLimit = vi.fn()
  const reservationIn = vi.fn()
  const reservationReconEqUser = vi.fn()
  const reservationReconOrder = vi.fn()
  const reservationReconLimit = vi.fn()
  const reservationUpdate = vi.fn()
  const reservationUpdateEqId = vi.fn()
  const reservationUpdateSelect = vi.fn()
  const reservationUpdateSingle = vi.fn()
  const ledgerSelect = vi.fn()
  const ledgerEqUser = vi.fn()
  const ledgerEqIntent = vi.fn()
  const ledgerOrder = vi.fn()
  const ledgerLimit = vi.fn()

  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === 'credit_reservations') {
        return {
          select: reservationSelect,
          update: reservationUpdate,
        }
      }

      if (table === 'credit_ledger_entries') {
        return {
          select: ledgerSelect,
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getSupabaseAdminClient>,
    )

    reservationSelect.mockReturnValue({
      eq: reservationEqUser,
      in: reservationIn,
    })
    reservationEqUser.mockReturnValue({
      eq: reservationEqIntent,
      order: reservationOrder,
    })
    reservationEqIntent.mockReturnValue({
      maybeSingle: reservationMaybeSingle,
    })
    reservationOrder.mockReturnValue({
      limit: reservationLimit,
    })
    reservationLimit.mockResolvedValue({ data: [], error: null })
    reservationIn.mockReturnValue({
      eq: reservationReconEqUser,
      order: reservationReconOrder,
    })
    reservationReconEqUser.mockReturnValue({
      order: reservationReconOrder,
    })
    reservationReconOrder.mockReturnValue({
      limit: reservationReconLimit,
    })
    reservationReconLimit.mockResolvedValue({ data: [], error: null })
    reservationUpdate.mockReturnValue({
      eq: reservationUpdateEqId,
    })
    reservationUpdateEqId.mockReturnValue({
      select: reservationUpdateSelect,
    })
    reservationUpdateSelect.mockReturnValue({
      single: reservationUpdateSingle,
    })
    reservationUpdateSingle.mockResolvedValue({ data: buildReservationRow('released'), error: null })
    ledgerSelect.mockReturnValue({
      eq: ledgerEqUser,
    })
    ledgerEqUser.mockReturnValue({
      eq: ledgerEqIntent,
      order: ledgerOrder,
    })
    ledgerEqIntent.mockReturnValue({
      order: ledgerOrder,
    })
    ledgerOrder.mockReturnValue({
      limit: ledgerLimit,
    })
    ledgerLimit.mockResolvedValue({ data: [], error: null })
  })

  it('returns the existing reservation when the same generation intent is reserved twice', async () => {
    const existingRow = buildReservationRow('reserved')
    reservationMaybeSingle.mockResolvedValueOnce({ data: existingRow, error: null })

    const result = await reserveCreditForGenerationIntent({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      generationType: 'ATS_ENHANCEMENT',
      jobId: 'job_123',
      sessionId: 'session_123',
      resumeTargetId: 'target_123',
      metadata: { source: 'test' },
    })

    expect(result.wasCreated).toBe(false)
    expect(result.reservation.status).toBe('reserved')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('reserves a new intent through the atomic rpc and leaves balance mutation to the database transition', async () => {
    reservationMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: buildReservationRow('reserved'), error: null })

    const result = await reserveCreditForGenerationIntent({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      generationType: 'ATS_ENHANCEMENT',
      jobId: 'job_123',
      sessionId: 'session_123',
      resumeTargetId: 'target_123',
      metadata: { source: 'test' },
    })

    expect(result.wasCreated).toBe(true)
    expect(result.reservation.status).toBe('reserved')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('reserve_credit_for_generation_intent', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_generation_type: 'ATS_ENHANCEMENT',
      p_job_id: 'job_123',
      p_session_id: 'session_123',
      p_resume_target_id: 'target_123',
      p_resume_generation_id: null,
      p_metadata: { source: 'test' },
    })
  })

  it('collapses simultaneous reserve attempts for the same generation intent into one hold', async () => {
    reservationMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: buildReservationRow('reserved'), error: null })
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: buildReservationRow('reserved'), error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })

    const [firstResult, secondResult] = await Promise.all([
      reserveCreditForGenerationIntent({
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        generationType: 'ATS_ENHANCEMENT',
        jobId: 'job_123',
        sessionId: 'session_123',
      }),
      reserveCreditForGenerationIntent({
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        generationType: 'ATS_ENHANCEMENT',
        jobId: 'job_123',
        sessionId: 'session_123',
      }),
    ])

    expect(firstResult.reservation.id).toBe('reservation_123')
    expect(secondResult.reservation.id).toBe('reservation_123')
    expect([firstResult.wasCreated, secondResult.wasCreated].sort()).toEqual([false, true])
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2)
  })

  it('surfaces contradictory terminal transitions for reconciliation instead of mutating silently', async () => {
    reservationMaybeSingle.mockResolvedValueOnce({ data: buildReservationRow('released'), error: null })

    await expect(
      settleCreditReservationTransition({
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        action: 'finalize',
        resumeGenerationId: 'generation_123',
      }),
    ).rejects.toThrow('Cannot finalize credit reservation from released state')
  })

  it('finalizes and releases via dedicated rpc transitions without silently double-adjusting state', async () => {
    reservationMaybeSingle
      .mockResolvedValueOnce({ data: buildReservationRow('reserved'), error: null })
      .mockResolvedValueOnce({ data: buildReservationRow('reserved'), error: null })
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: buildReservationRow('finalized'), error: null })
      .mockResolvedValueOnce({ data: buildReservationRow('released'), error: null })

    const finalized = await finalizeCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      resumeGenerationId: 'generation_123',
    })
    const released = await releaseCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
    })

    expect(finalized.status).toBe('finalized')
    expect(released.status).toBe('released')
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'finalize_credit_reservation', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_resume_generation_id: 'generation_123',
      p_metadata: null,
    })
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'release_credit_reservation', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_resume_generation_id: null,
      p_metadata: null,
    })
  })

  it('settles a freshly reserved reservation without reloading by generation intent', async () => {
    const reserved = buildReservationRow('reserved')
    mockSupabase.rpc.mockResolvedValueOnce({ data: buildReservationRow('finalized'), error: null })

    const finalized = await finalizeCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      resumeGenerationId: 'generation_123',
      reservation: {
        id: reserved.id,
        userId: reserved.user_id,
        generationIntentKey: reserved.generation_intent_key,
        jobId: reserved.job_id ?? undefined,
        sessionId: reserved.session_id ?? undefined,
        resumeTargetId: reserved.resume_target_id ?? undefined,
        resumeGenerationId: reserved.resume_generation_id ?? undefined,
        type: reserved.type,
        status: reserved.status,
        creditsReserved: reserved.credits_reserved,
        failureReason: reserved.failure_reason ?? undefined,
        reservedAt: new Date(reserved.reserved_at),
        finalizedAt: undefined,
        releasedAt: undefined,
        reconciliationStatus: reserved.reconciliation_status as never,
        metadata: reserved.metadata ?? undefined,
        createdAt: new Date(reserved.created_at),
        updatedAt: new Date(reserved.updated_at),
      },
    })

    expect(finalized.status).toBe('finalized')
    expect(reservationMaybeSingle).not.toHaveBeenCalled()
    expect(mockSupabase.rpc).toHaveBeenCalledWith('finalize_credit_reservation', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_resume_generation_id: 'generation_123',
      p_metadata: null,
    })
  })

  it('allows reconciliation repairs to settle reservations already marked needs_reconciliation', async () => {
    reservationMaybeSingle
      .mockResolvedValueOnce({ data: buildReservationRow('needs_reconciliation'), error: null })
      .mockResolvedValueOnce({ data: buildReservationRow('needs_reconciliation'), error: null })
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: buildReservationRow('finalized'), error: null })
      .mockResolvedValueOnce({ data: buildReservationRow('released'), error: null })

    const finalized = await finalizeCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      resumeGenerationId: 'generation_123',
      metadata: { source: 'reconciliation' },
    })
    const released = await releaseCreditReservation({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
      metadata: { source: 'reconciliation' },
    })

    expect(finalized.status).toBe('finalized')
    expect(released.status).toBe('released')
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'finalize_credit_reservation', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_resume_generation_id: 'generation_123',
      p_metadata: { source: 'reconciliation' },
    })
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'release_credit_reservation', {
      p_user_id: 'usr_123',
      p_generation_intent_key: 'intent_123',
      p_resume_generation_id: null,
      p_metadata: { source: 'reconciliation' },
    })
  })

  it('maps append-only hold, finalize, and release ledger entries with optional evidence links', async () => {
    ledgerOrder.mockResolvedValueOnce({
      data: [
        buildLedgerRow('reservation_hold'),
        buildLedgerRow('reservation_finalize'),
        buildLedgerRow('reservation_release'),
      ],
      error: null,
    })

    const entries = await getCreditLedgerEntriesForIntent({
      userId: 'usr_123',
      generationIntentKey: 'intent_123',
    })

    expect(entries.map((entry) => entry.entryType)).toEqual([
      'reservation_hold',
      'reservation_finalize',
      'reservation_release',
    ])
    expect(entries[1]).toMatchObject({
      resumeGenerationId: 'generation_123',
      jobId: 'job_123',
      sessionId: 'session_123',
      resumeTargetId: 'target_123',
    })
  })

  it('lists recent ledger entries for one user ordered newest-first without leaking other users', async () => {
    ledgerLimit.mockResolvedValueOnce({
      data: [
        buildLedgerRowForUser({
          userId: 'usr_123',
          generationIntentKey: 'intent_newest',
          entryType: 'reservation_finalize',
          createdAt: '2026-04-20T00:05:00.000Z',
          sessionId: 'session_newest',
        }),
        buildLedgerRowForUser({
          userId: 'usr_123',
          generationIntentKey: 'intent_older',
          entryType: 'reservation_hold',
          createdAt: '2026-04-20T00:01:00.000Z',
          resumeTargetId: 'target_older',
        }),
      ],
      error: null,
    })

    const entries = await listCreditLedgerEntriesForUser({
      userId: 'usr_123',
      limit: 2,
    })

    expect(entries).toHaveLength(2)
    expect(entries.map((entry) => entry.generationIntentKey)).toEqual([
      'intent_newest',
      'intent_older',
    ])
    expect(ledgerEqUser).toHaveBeenCalledWith('user_id', 'usr_123')
    expect(ledgerOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(ledgerLimit).toHaveBeenCalledWith(2)
  })

  it('lists recent reservations for one user ordered newest-first with session and target evidence intact', async () => {
    reservationLimit.mockResolvedValueOnce({
      data: [
        buildReservationRowForUser({
          userId: 'usr_123',
          generationIntentKey: 'intent_newest',
          status: 'finalized',
          createdAt: '2026-04-20T00:05:00.000Z',
          sessionId: 'session_newest',
        }),
        buildReservationRowForUser({
          userId: 'usr_123',
          generationIntentKey: 'intent_older',
          status: 'released',
          createdAt: '2026-04-20T00:01:00.000Z',
          resumeTargetId: 'target_older',
        }),
      ],
      error: null,
    })

    const reservations = await listCreditReservationsForUser({
      userId: 'usr_123',
      limit: 2,
    })

    expect(reservations).toHaveLength(2)
    expect(reservations[0]).toMatchObject({
      generationIntentKey: 'intent_newest',
      status: 'finalized',
      sessionId: 'session_newest',
    })
    expect(reservations[1]).toMatchObject({
      generationIntentKey: 'intent_older',
      status: 'released',
      resumeTargetId: 'target_older',
    })
    expect(reservationEqUser).toHaveBeenCalledWith('user_id', 'usr_123')
    expect(reservationOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(reservationLimit).toHaveBeenCalledWith(2)
  })

  it('lists reconciliation candidates oldest-first and can mark a reservation without mutating balance state', async () => {
    reservationReconLimit.mockResolvedValueOnce({
      data: [
        buildReservationRowForUser({
          userId: 'usr_123',
          generationIntentKey: 'intent_stale',
          status: 'needs_reconciliation',
          createdAt: '2026-04-19T23:59:00.000Z',
        }),
      ],
      error: null,
    })
    reservationUpdateSingle.mockResolvedValueOnce({
      data: {
        ...buildReservationRow('needs_reconciliation'),
        id: 'reservation_stale',
        status: 'needs_reconciliation',
        reconciliation_status: 'manual_review',
        failure_reason: 'stale_reconciliation',
      },
      error: null,
    })

    const reservations = await listCreditReservationsForReconciliation({
      userId: 'usr_123',
      limit: 1,
    })
    const updated = await markCreditReservationReconciliation({
      reservationId: 'reservation_stale',
      status: 'needs_reconciliation',
      reconciliationStatus: 'manual_review',
      failureReason: 'stale_reconciliation',
      metadata: { source: 'test' },
    })

    expect(reservations).toHaveLength(1)
    expect(reservationIn).toHaveBeenCalledWith('status', ['reserved', 'needs_reconciliation'])
    expect(reservationReconEqUser).toHaveBeenCalledWith('user_id', 'usr_123')
    expect(reservationReconOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(updated).toMatchObject({
      id: 'reservation_stale',
      reconciliationStatus: 'manual_review',
      failureReason: 'stale_reconciliation',
    })
  })

  it('fails closed when the reservation rpc infrastructure is missing', async () => {
    reservationMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'function reserve_credit_for_generation_intent does not exist' },
    })

    await expect(
      reserveCreditForGenerationIntent({
        userId: 'usr_123',
        generationIntentKey: 'intent_123',
        generationType: 'ATS_ENHANCEMENT',
      }),
    ).rejects.toThrow('Failed to reserve credit for generation intent: function reserve_credit_for_generation_intent does not exist')
  })
})
