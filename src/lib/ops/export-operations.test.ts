import { describe, expect, it } from 'vitest'

import { buildExportOperationsAlerts } from './export-operations'

describe('buildExportOperationsAlerts', () => {
  it('creates actionable alerts for reconciliation backlog, manual review, stalled queue, and stuck reservations', () => {
    const alerts = buildExportOperationsAlerts({
      queue: {
        queuedJobs: 7,
        runningJobs: 0,
      },
      exports: {
        started: 7,
        completed: 0,
        failed: 3,
      },
      reservations: {
        needsReconciliation: 6,
        manualReview: 1,
        oldestPendingReconciliationAgeMinutes: 20,
        oldestReservedAgeMinutes: 18,
      },
    })

    expect(alerts.map((alert) => alert.kind)).toEqual([
      'needs_reconciliation_backlog',
      'manual_review_detected',
      'queue_stalled',
      'reservation_stuck',
    ])
  })

  it('adds an export failure-rate alert only when the rolling sample is meaningful', () => {
    const alerts = buildExportOperationsAlerts({
      queue: {
        queuedJobs: 1,
        runningJobs: 1,
      },
      exports: {
        started: 10,
        completed: 4,
        failed: 2,
      },
      reservations: {
        needsReconciliation: 0,
        manualReview: 0,
        oldestPendingReconciliationAgeMinutes: null,
        oldestReservedAgeMinutes: null,
      },
    })

    expect(alerts.find((alert) => alert.kind === 'export_failure_rate')).toEqual({
      kind: 'export_failure_rate',
      severity: 'warn',
      message: 'Recent export failure rate exceeded the configured threshold.',
    })
  })
})
