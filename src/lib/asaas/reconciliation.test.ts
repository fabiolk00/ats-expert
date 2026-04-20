import { beforeEach, describe, expect, it, vi } from 'vitest'

import { reconcileCreditReservations } from './reconciliation'

const {
  mockListCreditReservationsForReconciliation,
  mockReleaseCreditReservation,
  mockFinalizeCreditReservation,
  mockMarkCreditReservationReconciliation,
  mockGetJob,
  mockGetSession,
  mockGetResumeTargetForSession,
} = vi.hoisted(() => ({
  mockListCreditReservationsForReconciliation: vi.fn(),
  mockReleaseCreditReservation: vi.fn(),
  mockFinalizeCreditReservation: vi.fn(),
  mockMarkCreditReservationReconciliation: vi.fn(),
  mockGetJob: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetResumeTargetForSession: vi.fn(),
}))

vi.mock('@/lib/db/credit-reservations', () => ({
  listCreditReservationsForReconciliation: mockListCreditReservationsForReconciliation,
  markCreditReservationReconciliation: mockMarkCreditReservationReconciliation,
}))

vi.mock('@/lib/asaas/quota', () => ({
  finalizeCreditReservation: mockFinalizeCreditReservation,
  releaseCreditReservation: mockReleaseCreditReservation,
}))

vi.mock('@/lib/jobs/repository', () => ({
  getJob: mockGetJob,
}))

vi.mock('@/lib/db/sessions', () => ({
  getSession: mockGetSession,
}))

vi.mock('@/lib/db/resume-targets', () => ({
  getResumeTargetForSession: mockGetResumeTargetForSession,
}))

function buildReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res_123',
    userId: 'usr_123',
    generationIntentKey: 'intent_123',
    jobId: 'job_123',
    sessionId: 'sess_123',
    resumeTargetId: undefined,
    resumeGenerationId: undefined,
    type: 'ATS_ENHANCEMENT',
    status: 'reserved',
    creditsReserved: 1,
    failureReason: undefined,
    reservedAt: new Date('2026-04-20T00:00:00.000Z'),
    finalizedAt: undefined,
    releasedAt: undefined,
    reconciliationStatus: 'pending',
    metadata: undefined,
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    ...overrides,
  }
}

describe('reconcileCreditReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMarkCreditReservationReconciliation.mockImplementation(async (input) => ({
      ...buildReservation({ id: input.reservationId }),
      status: input.status,
      reconciliationStatus: input.reconciliationStatus,
      failureReason: input.failureReason,
    }))
  })

  it('releases a reserved hold exactly once when the linked job already failed', async () => {
    mockListCreditReservationsForReconciliation.mockResolvedValue([
      buildReservation({
        status: 'needs_reconciliation',
        reconciliationStatus: 'pending',
        failureReason: 'release rpc failed',
      }),
    ])
    mockGetJob.mockResolvedValue({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'intent_123',
      type: 'artifact_generation',
      status: 'failed',
      stage: 'release_credit',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:01:00.000Z',
      completedAt: '2026-04-20T00:01:00.000Z',
    })
    mockReleaseCreditReservation.mockResolvedValue(buildReservation({
      status: 'released',
      releasedAt: new Date('2026-04-20T00:02:00.000Z'),
    }))

    const result = await reconcileCreditReservations({ userId: 'usr_123' })

    expect(result).toEqual([
      expect.objectContaining({
        reservationId: 'res_123',
        action: 'released',
      }),
    ])
    expect(mockReleaseCreditReservation).toHaveBeenCalledTimes(1)
    expect(mockFinalizeCreditReservation).not.toHaveBeenCalled()
    expect(mockMarkCreditReservationReconciliation).toHaveBeenCalledWith(expect.objectContaining({
      reservationId: 'res_123',
      status: 'released',
      reconciliationStatus: 'repaired',
    }))
  })

  it('finalizes a reserved hold exactly once when artifact evidence exists for a completed job', async () => {
    mockListCreditReservationsForReconciliation.mockResolvedValue([
      buildReservation({
        status: 'needs_reconciliation',
        reconciliationStatus: 'pending',
        failureReason: 'finalize rpc failed',
        resumeGenerationId: 'gen_123',
      }),
    ])
    mockGetJob.mockResolvedValue({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'intent_123',
      type: 'artifact_generation',
      status: 'completed',
      stage: 'needs_reconciliation',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:01:00.000Z',
      completedAt: '2026-04-20T00:01:00.000Z',
    })
    mockGetSession.mockResolvedValue({
      id: 'sess_123',
      generatedOutput: {
        status: 'ready',
        pdfPath: 'usr_123/sess_123/resume.pdf',
      },
    })
    mockFinalizeCreditReservation.mockResolvedValue(buildReservation({
      status: 'finalized',
      resumeGenerationId: 'gen_123',
      finalizedAt: new Date('2026-04-20T00:02:00.000Z'),
    }))

    const result = await reconcileCreditReservations({ userId: 'usr_123' })

    expect(result).toEqual([
      expect.objectContaining({
        reservationId: 'res_123',
        action: 'finalized',
      }),
    ])
    expect(mockFinalizeCreditReservation).toHaveBeenCalledTimes(1)
    expect(mockReleaseCreditReservation).not.toHaveBeenCalled()
    expect(mockMarkCreditReservationReconciliation).toHaveBeenCalledWith(expect.objectContaining({
      reservationId: 'res_123',
      status: 'finalized',
      reconciliationStatus: 'repaired',
    }))
  })

  it('flags ambiguous evidence for manual review instead of mutating balances blindly', async () => {
    mockListCreditReservationsForReconciliation.mockResolvedValue([
      buildReservation({ jobId: undefined, sessionId: undefined }),
    ])
    mockGetJob.mockResolvedValue(null)
    mockGetSession.mockResolvedValue(null)

    const result = await reconcileCreditReservations({ userId: 'usr_123' })

    expect(result).toEqual([
      expect.objectContaining({
        reservationId: 'res_123',
        action: 'manual_review',
      }),
    ])
    expect(mockFinalizeCreditReservation).not.toHaveBeenCalled()
    expect(mockReleaseCreditReservation).not.toHaveBeenCalled()
    expect(mockMarkCreditReservationReconciliation).toHaveBeenCalledWith(expect.objectContaining({
      reservationId: 'res_123',
      status: 'needs_reconciliation',
      reconciliationStatus: 'manual_review',
    }))
  })

  it('remains idempotent when the same unresolved reservation is repaired more than once', async () => {
    mockListCreditReservationsForReconciliation
      .mockResolvedValueOnce([
        buildReservation({
          status: 'needs_reconciliation',
          reconciliationStatus: 'pending',
          failureReason: 'release rpc failed',
        }),
      ])
      .mockResolvedValueOnce([
        buildReservation({
          status: 'needs_reconciliation',
          reconciliationStatus: 'pending',
          failureReason: 'release rpc failed',
        }),
      ])
    mockGetJob.mockResolvedValue({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'intent_123',
      type: 'artifact_generation',
      status: 'failed',
      stage: 'release_credit',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:01:00.000Z',
      completedAt: '2026-04-20T00:01:00.000Z',
    })
    mockReleaseCreditReservation.mockResolvedValue(buildReservation({
      status: 'released',
      releasedAt: new Date('2026-04-20T00:02:00.000Z'),
    }))

    const firstResult = await reconcileCreditReservations({ userId: 'usr_123' })
    const secondResult = await reconcileCreditReservations({ userId: 'usr_123' })

    expect(firstResult[0]).toEqual(expect.objectContaining({
      reservationId: 'res_123',
      action: 'released',
    }))
    expect(secondResult[0]).toEqual(expect.objectContaining({
      reservationId: 'res_123',
      action: 'released',
    }))
    expect(mockReleaseCreditReservation).toHaveBeenCalledTimes(2)
    expect(mockMarkCreditReservationReconciliation).toHaveBeenCalledTimes(2)
  })
})
