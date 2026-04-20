import { logInfo } from '@/lib/observability/structured-log'

export type MetricCounterEventName =
  | 'billing.reservations.created'
  | 'billing.reservations.finalized'
  | 'billing.reservations.released'
  | 'billing.reservations.needs_reconciliation'
  | 'billing.reconciliation.auto_finalized'
  | 'billing.reconciliation.auto_released'
  | 'billing.reconciliation.manual_review'
  | 'exports.started'
  | 'exports.completed'
  | 'exports.failed'

export function recordMetricCounter(
  metric: MetricCounterEventName,
  fields: Record<string, unknown> = {},
): void {
  logInfo('metric.counter', {
    metric,
    value: 1,
    ...fields,
  })
}

