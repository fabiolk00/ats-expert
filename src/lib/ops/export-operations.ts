import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import type { ExportOperationsAlert, ExportOperationsSnapshot } from '@/types/operations'

type JobRow = {
  status: string
  created_at: string
}

type ReservationRow = {
  status: string
  reconciliation_status: string
  created_at: string
  updated_at: string
}

type LedgerRow = {
  entry_type: string
  created_at: string
}

function countWhere<T>(rows: T[], predicate: (row: T) => boolean): number {
  return rows.reduce((count, row) => count + (predicate(row) ? 1 : 0), 0)
}

function resolveOldestAgeMinutes(
  timestamps: string[],
  now: Date,
): number | null {
  if (timestamps.length === 0) {
    return null
  }

  const oldest = timestamps
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right)[0]

  if (!oldest) {
    return null
  }

  return Math.max(0, Math.floor((now.getTime() - oldest) / 60_000))
}

export function buildExportOperationsAlerts(input: {
  queue: { queuedJobs: number; runningJobs: number }
  exports: { started: number; completed: number; failed: number }
  reservations: {
    needsReconciliation: number
    manualReview: number
    oldestPendingReconciliationAgeMinutes: number | null
    oldestReservedAgeMinutes: number | null
  }
}): ExportOperationsAlert[] {
  const alerts: ExportOperationsAlert[] = []
  const exportAttemptCount = input.exports.completed + input.exports.failed
  const failureRate = exportAttemptCount > 0 ? input.exports.failed / exportAttemptCount : 0

  if (input.reservations.needsReconciliation > 5) {
    alerts.push({
      kind: 'needs_reconciliation_backlog',
      severity: 'warn',
      message: 'More than 5 reservations are waiting for reconciliation in the recent window.',
    })
  }

  if (input.reservations.manualReview > 0) {
    alerts.push({
      kind: 'manual_review_detected',
      severity: 'critical',
      message: 'At least one reservation escalated to manual review in the recent window.',
    })
  }

  if (failureRate >= 0.2 && exportAttemptCount >= 5) {
    alerts.push({
      kind: 'export_failure_rate',
      severity: 'warn',
      message: 'Recent export failure rate exceeded the configured threshold.',
    })
  }

  if (input.queue.queuedJobs >= 5 && input.exports.completed === 0 && input.queue.runningJobs === 0) {
    alerts.push({
      kind: 'queue_stalled',
      severity: 'critical',
      message: 'Queued jobs are rising while no export is completing.',
    })
  }

  if ((input.reservations.oldestReservedAgeMinutes ?? 0) >= 15) {
    alerts.push({
      kind: 'reservation_stuck',
      severity: 'warn',
      message: 'A reserved export has not progressed within the acceptable age threshold.',
    })
  }

  return alerts
}

export async function getExportOperationsSnapshot(
  now = new Date(),
): Promise<ExportOperationsSnapshot> {
  const supabase = getSupabaseAdminClient()
  const recentCutoffIso = new Date(now.getTime() - 15 * 60_000).toISOString()

  const [
    jobsResult,
    reservationsResult,
    recentReservationsResult,
    ledgerResult,
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('status, created_at')
      .eq('type', 'artifact_generation')
      .in('status', ['queued', 'running']),
    supabase
      .from('credit_reservations')
      .select('status, reconciliation_status, created_at, updated_at')
      .in('status', ['reserved', 'needs_reconciliation']),
    supabase
      .from('credit_reservations')
      .select('status, reconciliation_status, created_at, updated_at')
      .gte('updated_at', recentCutoffIso),
    supabase
      .from('credit_ledger_entries')
      .select('entry_type, created_at')
      .gte('created_at', recentCutoffIso),
  ])

  if (jobsResult.error) {
    throw new Error(`Failed to load export jobs snapshot: ${jobsResult.error.message}`)
  }

  if (reservationsResult.error) {
    throw new Error(`Failed to load reservation snapshot: ${reservationsResult.error.message}`)
  }

  if (recentReservationsResult.error) {
    throw new Error(`Failed to load recent reservation snapshot: ${recentReservationsResult.error.message}`)
  }

  if (ledgerResult.error) {
    throw new Error(`Failed to load ledger snapshot: ${ledgerResult.error.message}`)
  }

  const jobs = (jobsResult.data ?? []) as JobRow[]
  const reservations = (reservationsResult.data ?? []) as ReservationRow[]
  const recentReservations = (recentReservationsResult.data ?? []) as ReservationRow[]
  const ledgerEntries = (ledgerResult.data ?? []) as LedgerRow[]

  const snapshot = {
    generatedAt: now.toISOString(),
    queue: {
      queuedJobs: countWhere(jobs, (job) => job.status === 'queued'),
      runningJobs: countWhere(jobs, (job) => job.status === 'running'),
    },
    exports: {
      started: countWhere(ledgerEntries, (entry) => entry.entry_type === 'reservation_hold'),
      completed: countWhere(ledgerEntries, (entry) => entry.entry_type === 'reservation_finalize'),
      failed: countWhere(recentReservations, (reservation) => (
        reservation.status === 'needs_reconciliation' || reservation.reconciliation_status === 'manual_review'
      )),
    },
    reservations: {
      created: countWhere(ledgerEntries, (entry) => entry.entry_type === 'reservation_hold'),
      finalized: countWhere(ledgerEntries, (entry) => entry.entry_type === 'reservation_finalize'),
      released: countWhere(ledgerEntries, (entry) => entry.entry_type === 'reservation_release'),
      needsReconciliation: countWhere(recentReservations, (reservation) => reservation.status === 'needs_reconciliation'),
      manualReview: countWhere(recentReservations, (reservation) => reservation.reconciliation_status === 'manual_review'),
      oldestPendingReconciliationAgeMinutes: resolveOldestAgeMinutes(
        reservations
          .filter((reservation) => reservation.status === 'needs_reconciliation')
          .map((reservation) => reservation.updated_at),
        now,
      ),
      oldestReservedAgeMinutes: resolveOldestAgeMinutes(
        reservations
          .filter((reservation) => reservation.status === 'reserved')
          .map((reservation) => reservation.created_at),
        now,
      ),
    },
    alerts: [] as ExportOperationsAlert[],
  }

  return {
    ...snapshot,
    alerts: buildExportOperationsAlerts(snapshot),
  }
}
