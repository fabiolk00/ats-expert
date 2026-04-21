import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo } from '@/lib/observability/structured-log'

import {
  recordFinalMetricPreservationResult,
  recordMetricRegressionDetected,
  recordPremiumBulletsDetected,
  recordRecoveryPathSelected,
} from './metric-impact-observability'

vi.mock('@/lib/observability/structured-log', () => ({
  logInfo: vi.fn(),
}))

vi.mock('@/lib/observability/metric-events', () => ({
  recordMetricCounter: vi.fn(),
}))

describe('metric impact observability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits premium bullet detection without leaking resume text', () => {
    recordPremiumBulletsDetected({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      premiumBulletCount: 2,
      premiumPercentBulletCount: 1,
      premiumScopeBulletCount: 2,
      premiumTechnologyImpactBulletCount: 2,
      section: 'experience',
    })

    expect(logInfo).toHaveBeenCalledWith('ats_editorial.premium_bullets_detected', expect.objectContaining({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      premiumBulletCount: 2,
      premiumPercentBulletCount: 1,
      premiumScopeBulletCount: 2,
      premiumTechnologyImpactBulletCount: 2,
      section: 'experience',
    }))
    expect(logInfo).not.toHaveBeenCalledWith(
      'ats_editorial.premium_bullets_detected',
      expect.objectContaining({
        originalBullet: expect.anything(),
      }),
    )
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.premium_bullets_detected', expect.any(Object))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.percent_premium_bullets_detected', expect.any(Object))
  })

  it('emits metric regression detection with safe flags only', () => {
    recordMetricRegressionDetected({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      premiumBulletCountOriginal: 2,
      premiumBulletCountFinal: 1,
      premiumBulletCount: 2,
      premiumPercentBulletCount: 1,
      premiumScopeBulletCount: 2,
      premiumTechnologyImpactBulletCount: 2,
      regressionCount: 1,
      percentMetricLost: true,
      scopeLost: true,
      impactLost: true,
      metricPreservationStatus: 'partial',
      section: 'experience',
    })

    expect(logInfo).toHaveBeenCalledWith('ats_editorial.metric_regression_detected', expect.objectContaining({
      regressionCount: 1,
      percentMetricLost: true,
      scopeLost: true,
      impactLost: true,
      section: 'experience',
    }))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.metric_regression_detected', expect.any(Object))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.metric_regression_percent_lost', expect.any(Object))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.metric_regression_scope_lost', expect.any(Object))
  })

  it('emits the selected recovery path deterministically', () => {
    recordRecoveryPathSelected({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      path: 'conservative_fallback',
      regressionCount: 2,
      premiumBulletCount: 3,
    })

    expect(logInfo).toHaveBeenCalledWith('ats_editorial.recovery_path_selected', expect.objectContaining({
      path: 'conservative_fallback',
      regressionCount: 2,
      premiumBulletCount: 3,
    }))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.conservative_fallback_used', expect.any(Object))
  })

  it('emits the final preservation result and metrics for recovered outputs', () => {
    recordFinalMetricPreservationResult({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      recoveryPath: 'smart_repair',
      premiumBulletCountOriginal: 2,
      premiumBulletCountFinal: 2,
      premiumBulletCount: 2,
      premiumPercentBulletCount: 1,
      premiumScopeBulletCount: 2,
      premiumTechnologyImpactBulletCount: 2,
      regressionCount: 0,
      percentMetricLost: false,
      scopeLost: false,
      impactLost: false,
      metricPreservationStatus: 'full',
      section: 'experience',
    })

    expect(logInfo).toHaveBeenCalledWith('ats_editorial.final_metric_preservation_result', expect.objectContaining({
      premiumBulletCountOriginal: 2,
      premiumBulletCountFinal: 2,
      metricPreservationStatus: 'full',
      usedRecoveryPath: true,
      recoveryPath: 'smart_repair',
    }))
    expect(recordMetricCounter).toHaveBeenCalledWith('architecture.ats_editorial.metric_preservation_full', expect.any(Object))
  })

  it('does not emit a final preservation event when no premium bullet existed', () => {
    recordFinalMetricPreservationResult({
      workflowMode: 'ats_enhancement',
      sessionId: 'sess_123',
      recoveryPath: 'none',
      premiumBulletCountOriginal: 0,
      premiumBulletCountFinal: 0,
      premiumBulletCount: 0,
      premiumPercentBulletCount: 0,
      premiumScopeBulletCount: 0,
      premiumTechnologyImpactBulletCount: 0,
      regressionCount: 0,
      percentMetricLost: false,
      scopeLost: false,
      impactLost: false,
      metricPreservationStatus: 'none',
      section: 'experience',
    })

    expect(logInfo).not.toHaveBeenCalled()
    expect(recordMetricCounter).not.toHaveBeenCalled()
  })
})
