import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo } from '@/lib/observability/structured-log'

import type { MetricImpactComparison, PremiumMetricBulletSummary } from './metric-impact-guard'

export type EditorialRecoveryPath =
  | 'smart_repair'
  | 'conservative_fallback'
  | 'revert'

type EditorialWorkflowMode = 'ats_enhancement'

export function recordPremiumBulletsDetected(input: PremiumMetricBulletSummary & {
  workflowMode: EditorialWorkflowMode
  sessionId?: string
  contractVersion?: number
}): void {
  logInfo('ats_editorial.premium_bullets_detected', {
    workflowMode: input.workflowMode,
    sessionId: input.sessionId,
    contractVersion: input.contractVersion,
    premiumBulletCount: input.premiumBulletCount,
    premiumPercentBulletCount: input.premiumPercentBulletCount,
    premiumScopeBulletCount: input.premiumScopeBulletCount,
    premiumTechnologyImpactBulletCount: input.premiumTechnologyImpactBulletCount,
    section: input.section,
  })

  if (input.premiumBulletCount > 0) {
    recordMetricCounter('architecture.ats_editorial.premium_bullets_detected', {
      workflowMode: input.workflowMode,
      section: input.section,
    })
  }

  if (input.premiumPercentBulletCount > 0) {
    recordMetricCounter('architecture.ats_editorial.percent_premium_bullets_detected', {
      workflowMode: input.workflowMode,
      section: input.section,
    })
  }
}

export function recordMetricRegressionDetected(input: MetricImpactComparison & {
  workflowMode: EditorialWorkflowMode
  sessionId?: string
}): void {
  if (input.regressionCount === 0) {
    return
  }

  logInfo('ats_editorial.metric_regression_detected', {
    workflowMode: input.workflowMode,
    sessionId: input.sessionId,
    regressionCount: input.regressionCount,
    percentMetricLost: input.percentMetricLost,
    scopeLost: input.scopeLost,
    impactLost: input.impactLost,
    section: input.section,
  })

  recordMetricCounter('architecture.ats_editorial.metric_regression_detected', {
    workflowMode: input.workflowMode,
    section: input.section,
  })

  if (input.percentMetricLost) {
    recordMetricCounter('architecture.ats_editorial.metric_regression_percent_lost', {
      workflowMode: input.workflowMode,
      section: input.section,
    })
  }

  if (input.scopeLost) {
    recordMetricCounter('architecture.ats_editorial.metric_regression_scope_lost', {
      workflowMode: input.workflowMode,
      section: input.section,
    })
  }
}

export function recordRecoveryPathSelected(input: {
  workflowMode: EditorialWorkflowMode
  path: EditorialRecoveryPath
  regressionCount: number
  premiumBulletCount: number
  sessionId?: string
}): void {
  logInfo('ats_editorial.recovery_path_selected', {
    workflowMode: input.workflowMode,
    sessionId: input.sessionId,
    path: input.path,
    regressionCount: input.regressionCount,
    premiumBulletCount: input.premiumBulletCount,
  })

  const metric =
    input.path === 'smart_repair'
      ? 'architecture.ats_editorial.smart_repair_used'
      : input.path === 'conservative_fallback'
        ? 'architecture.ats_editorial.conservative_fallback_used'
        : 'architecture.ats_editorial.revert_used'

  recordMetricCounter(metric, {
    workflowMode: input.workflowMode,
    regressionCount: input.regressionCount,
  })
}

export function recordFinalMetricPreservationResult(input: MetricImpactComparison & {
  workflowMode: EditorialWorkflowMode
  sessionId?: string
  recoveryPath: EditorialRecoveryPath | 'none'
}): void {
  if (input.premiumBulletCountOriginal === 0) {
    return
  }

  logInfo('ats_editorial.final_metric_preservation_result', {
    workflowMode: input.workflowMode,
    sessionId: input.sessionId,
    premiumBulletCountOriginal: input.premiumBulletCountOriginal,
    premiumBulletCountFinal: input.premiumBulletCountFinal,
    metricPreservationStatus: input.metricPreservationStatus,
    usedRecoveryPath: input.recoveryPath !== 'none',
    recoveryPath: input.recoveryPath,
  })

  const metric =
    input.metricPreservationStatus === 'full'
      ? 'architecture.ats_editorial.metric_preservation_full'
      : input.metricPreservationStatus === 'partial'
        ? 'architecture.ats_editorial.metric_preservation_partial'
        : 'architecture.ats_editorial.metric_preservation_regressed'

  if (input.metricPreservationStatus !== 'none') {
    recordMetricCounter(metric, {
      workflowMode: input.workflowMode,
      recoveryPath: input.recoveryPath,
    })
  }
}
