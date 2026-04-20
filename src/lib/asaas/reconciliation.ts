import { finalizeCreditReservation, releaseCreditReservation } from '@/lib/asaas/quota'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import {
  listCreditReservationsForReconciliation,
  markCreditReservationReconciliation,
  type CreditReservation,
} from '@/lib/db/credit-reservations'
import { getJob } from '@/lib/jobs/repository'
import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo, logWarn } from '@/lib/observability/structured-log'
import { withTimedOperation } from '@/lib/observability/timed-operation'

type ReconciliationAction = 'finalized' | 'released' | 'manual_review'

export type CreditReservationReconciliationResult = {
  reservationId: string
  generationIntentKey: string
  action: ReconciliationAction
  reason: string
}

function hasArtifactEvidence(input: {
  session?: { generatedOutput?: { status?: string; pdfPath?: string } } | null
  target?: { generatedOutput?: { status?: string; pdfPath?: string } } | null
}): boolean {
  const generatedOutput = input.target?.generatedOutput ?? input.session?.generatedOutput
  return generatedOutput?.status === 'ready' && Boolean(generatedOutput.pdfPath)
}

async function classifyReservation(
  reservation: CreditReservation,
): Promise<{ action: ReconciliationAction; reason: string }> {
  const job = reservation.jobId
    ? await getJob(reservation.jobId, reservation.userId)
    : null

  const session = reservation.sessionId
    ? await getSession(reservation.sessionId, reservation.userId)
    : null
  const target = reservation.sessionId && reservation.resumeTargetId
    ? await getResumeTargetForSession(reservation.sessionId, reservation.resumeTargetId)
    : null

  if (job?.status === 'failed' || job?.status === 'cancelled') {
    return { action: 'released', reason: `job_${job.status}` }
  }

  if (job?.status === 'completed' && hasArtifactEvidence({ session, target })) {
    return { action: 'finalized', reason: 'artifact_ready' }
  }

  if (hasArtifactEvidence({ session, target })) {
    return { action: 'finalized', reason: 'artifact_ready_without_terminal_job' }
  }

  return { action: 'manual_review', reason: 'insufficient_evidence' }
}

export async function reconcileCreditReservations(input: {
  userId?: string
  limit?: number
} = {}): Promise<CreditReservationReconciliationResult[]> {
  const reservations = await withTimedOperation({
    operation: 'reconcileCreditReservations',
    appUserId: input.userId ?? 'system',
    run: () => listCreditReservationsForReconciliation(input),
    onFailure: () => ({
      errorCategory: 'reconciliation',
      errorCode: 'reconciliation_scan_failed',
    }),
  })
  const results: CreditReservationReconciliationResult[] = []

  for (const reservation of reservations) {
    const classification = await classifyReservation(reservation)

    if (classification.action === 'released') {
      await withTimedOperation({
        operation: 'releaseCreditReservation',
        generationIntentKey: reservation.generationIntentKey,
        appUserId: reservation.userId,
        run: () => releaseCreditReservation({
          userId: reservation.userId,
          generationIntentKey: reservation.generationIntentKey,
          resumeGenerationId: reservation.resumeGenerationId,
          metadata: {
            source: 'reconciliation',
            reason: classification.reason,
          },
        }),
      })
      await markCreditReservationReconciliation({
        reservationId: reservation.id,
        status: 'released',
        reconciliationStatus: 'repaired',
        metadata: {
          source: 'reconciliation',
          action: 'released',
        },
      })
      logInfo('billing.credit_reconciliation_released', {
        reservationId: reservation.id,
        generationIntentKey: reservation.generationIntentKey,
        userId: reservation.userId,
        stage: 'reconciliation',
        reason: classification.reason,
      })
      recordMetricCounter('billing.reconciliation.auto_released', {
        appUserId: reservation.userId,
        generationIntentKey: reservation.generationIntentKey,
      })
    } else if (classification.action === 'finalized') {
      await withTimedOperation({
        operation: 'finalizeCreditReservation',
        generationIntentKey: reservation.generationIntentKey,
        appUserId: reservation.userId,
        run: () => finalizeCreditReservation({
          userId: reservation.userId,
          generationIntentKey: reservation.generationIntentKey,
          resumeGenerationId: reservation.resumeGenerationId,
          metadata: {
            source: 'reconciliation',
            reason: classification.reason,
          },
        }),
      })
      await markCreditReservationReconciliation({
        reservationId: reservation.id,
        status: 'finalized',
        reconciliationStatus: 'repaired',
        metadata: {
          source: 'reconciliation',
          action: 'finalized',
        },
      })
      logInfo('billing.credit_reconciliation_finalized', {
        reservationId: reservation.id,
        generationIntentKey: reservation.generationIntentKey,
        userId: reservation.userId,
        stage: 'reconciliation',
        reason: classification.reason,
      })
      recordMetricCounter('billing.reconciliation.auto_finalized', {
        appUserId: reservation.userId,
        generationIntentKey: reservation.generationIntentKey,
      })
    } else {
      await markCreditReservationReconciliation({
        reservationId: reservation.id,
        status: 'needs_reconciliation',
        reconciliationStatus: 'manual_review',
        failureReason: classification.reason,
        metadata: {
          source: 'reconciliation',
          action: 'manual_review',
        },
      })
      logWarn('billing.credit_reconciliation_gap_detected', {
        reservationId: reservation.id,
        generationIntentKey: reservation.generationIntentKey,
        userId: reservation.userId,
        stage: 'reconciliation',
        reason: classification.reason,
      })
      recordMetricCounter('billing.reconciliation.manual_review', {
        appUserId: reservation.userId,
        generationIntentKey: reservation.generationIntentKey,
      })
    }

    results.push({
      reservationId: reservation.id,
      generationIntentKey: reservation.generationIntentKey,
      action: classification.action,
      reason: classification.reason,
    })
  }

  return results
}
