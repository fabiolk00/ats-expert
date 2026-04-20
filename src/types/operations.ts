export type ExportOperationsAlertKind =
  | 'needs_reconciliation_backlog'
  | 'manual_review_detected'
  | 'export_failure_rate'
  | 'queue_stalled'
  | 'reservation_stuck'

export type ExportOperationsAlert = {
  kind: ExportOperationsAlertKind
  severity: 'warn' | 'critical'
  message: string
}

export type ExportOperationsSnapshot = {
  generatedAt: string
  queue: {
    queuedJobs: number
    runningJobs: number
  }
  exports: {
    started: number
    completed: number
    failed: number
  }
  reservations: {
    created: number
    finalized: number
    released: number
    needsReconciliation: number
    manualReview: number
    oldestPendingReconciliationAgeMinutes: number | null
    oldestReservedAgeMinutes: number | null
  }
  alerts: ExportOperationsAlert[]
}

