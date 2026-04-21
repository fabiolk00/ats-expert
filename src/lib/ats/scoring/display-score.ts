import type { AtsReadinessDisplayContract, ReadinessBand, ScoreConfidence, ScoreStatus } from './types'

export function bandFromScore(score: number): ReadinessBand {
  if (score < 70) return 'needs_work'
  if (score < 80) return 'borderline'
  if (score < 89) return 'ats_ready'
  return 'excellent'
}

export function clampDisplayedReadinessScore(score: number): number {
  return Math.max(0, Math.min(95, Math.round(score)))
}

export function buildEstimatedReadinessRange(input: {
  displayedReadinessScoreBefore: number
  rawInternalScoreAfter: number
}): {
  min: number
  max: number
} {
  const rangeMin = Math.min(95, Math.max(89, input.displayedReadinessScoreBefore))
  const centeredUpperBound = Math.min(95, Math.max(input.rawInternalScoreAfter, rangeMin))
  const rangeMax = Math.min(95, Math.max(
    Math.min(rangeMin + 2, centeredUpperBound),
    rangeMin === 95 ? 95 : rangeMin + 1,
  ))

  return {
    min: rangeMin,
    max: rangeMax,
  }
}

export function formatAtsReadinessScorePtBr(input: {
  exactScore: number | null
  estimatedRangeMin: number | null
  estimatedRangeMax: number | null
}): string {
  if (input.exactScore !== null) {
    return String(input.exactScore)
  }

  if (input.estimatedRangeMin !== null && input.estimatedRangeMax !== null) {
    if (input.estimatedRangeMin === input.estimatedRangeMax) {
      return String(input.estimatedRangeMin)
    }

    return `${input.estimatedRangeMin}\u2013${input.estimatedRangeMax}`
  }

  return ''
}

export function buildAtsReadinessDisplayContract(input: {
  scoreStatus: ScoreStatus
  exactScore: number | null
  estimatedRangeMin: number | null
  estimatedRangeMax: number | null
  confidence: ScoreConfidence
}): AtsReadinessDisplayContract {
  const mode = input.scoreStatus === 'final' ? 'exact' : 'estimated_range'

  return {
    mode,
    scoreStatus: input.scoreStatus,
    exactScore: input.exactScore,
    estimatedRangeMin: input.estimatedRangeMin,
    estimatedRangeMax: input.estimatedRangeMax,
    confidence: input.confidence,
    labelPtBr: 'ATS Readiness Score',
    badgeTextPtBr: input.scoreStatus === 'final' ? 'Final' : 'Estimado',
    helperTextPtBr: input.scoreStatus === 'final'
      ? 'Pontuação final.'
      : 'Faixa estimada com base na otimização concluída.',
    formattedScorePtBr: formatAtsReadinessScorePtBr({
      exactScore: input.exactScore,
      estimatedRangeMin: input.estimatedRangeMin,
      estimatedRangeMax: input.estimatedRangeMax,
    }),
  }
}
