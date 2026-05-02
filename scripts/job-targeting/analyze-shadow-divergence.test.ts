import { describe, expect, it } from 'vitest'

import {
  buildShadowDivergenceReport,
  parseShadowComparisonInput,
  percentile,
} from './analyze-shadow-divergence'

function result(index: number, delta: number) {
  return {
    caseId: `case-${index}`,
    domain: index % 2 === 0 ? 'data-bi' : 'finance',
    legacy: {
      score: 70,
      lowFitTriggered: false,
      unsupportedCount: 2,
      criticalGaps: ['gap'],
    },
    assessment: {
      score: 70 + delta,
      lowFitTriggered: false,
      unsupportedCount: delta > 0 ? 1 : 3,
      supportedCount: 1,
      adjacentCount: 0,
      forbiddenClaimCount: 0,
      criticalGaps: ['gap'],
    },
    comparison: {
      scoreDelta: delta,
      lowFitDelta: false,
      criticalGapDelta: 0,
      unsupportedDelta: delta > 0 ? -1 : 1,
    },
    runtime: {
      success: true,
    },
  }
}

describe('analyze-shadow-divergence', () => {
  it('calculates p95 using nearest-rank percentile', () => {
    expect(percentile([1, 2, 3, 4, 100], 95)).toBe(100)
  })

  it('marks CUTOVER_READY=false with fewer than 500 successful cases', () => {
    const report = buildShadowDivergenceReport([result(1, 2), result(2, 3)])

    expect(report.CUTOVER_READY).toBe(false)
    expect(report.cutoverReasons).toContain('successful_cases_below_500')
  })

  it('marks CUTOVER_READY=false when p95 is high', () => {
    const records = Array.from({ length: 500 }, (_, index) => result(index, index >= 474 ? 45 : 3))

    const report = buildShadowDivergenceReport(records)

    expect(report.CUTOVER_READY).toBe(false)
    expect(report.cutoverReasons).toContain('p95_score_delta_above_30')
  })

  it('marks CUTOVER_READY=false when factual violations exist', () => {
    const records = Array.from({ length: 500 }, (_, index) => ({
      ...result(index, 3),
      validation: index === 0
        ? { factualViolation: true, issueTypes: ['forbidden_term'] }
        : { factualViolation: false, issueTypes: [] },
    }))

    const report = buildShadowDivergenceReport(records)

    expect(report.CUTOVER_READY).toBe(false)
    expect(report.cutoverReasons).toContain('factual_validation_violations_present')
  })

  it('parses shadow comparison logs and batch JSONL results', () => {
    const source = [
      JSON.stringify({ event: 'unrelated', scoreDelta: 99 }),
      JSON.stringify({ event: 'job_targeting.compatibility.shadow_comparison', scoreDelta: 4 }),
      JSON.stringify(result(1, -6)),
    ].join('\n')

    const records = parseShadowComparisonInput(source)

    expect(records).toHaveLength(2)
    expect(buildShadowDivergenceReport(records).scoreDelta.p50).toBe(4)
  })
})
