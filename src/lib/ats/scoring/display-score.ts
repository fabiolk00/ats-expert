import type { ReadinessBand } from './types'

export function bandFromScore(score: number): ReadinessBand {
  if (score < 70) return 'needs_work'
  if (score < 80) return 'borderline'
  if (score < 89) return 'ats_ready'
  return 'excellent'
}

export function clampDisplayedReadinessScore(score: number): number {
  return Math.max(0, Math.min(95, Math.round(score)))
}

