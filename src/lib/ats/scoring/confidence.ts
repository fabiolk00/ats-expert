import type { CVState } from '@/types/cv'

import type { ScoreConfidence } from './types'
import type { RawAtsScoreSnapshot } from './raw-score'

function countMissingRequiredSections(cvState: CVState): number {
  let missing = 0

  if (!cvState.summary.trim()) missing += 1
  if (cvState.experience.length === 0) missing += 1
  if (cvState.skills.filter((skill) => skill.trim()).length === 0) missing += 1
  if (cvState.education.length === 0) missing += 1

  return missing
}

export function deriveAtsReadinessConfidence(
  cvState: CVState,
  rawScore: RawAtsScoreSnapshot,
): ScoreConfidence {
  const missingRequiredSections = countMissingRequiredSections(cvState)
  const { extractedTextLength, score } = rawScore

  if (
    extractedTextLength < 300
    || missingRequiredSections >= 2
    || score.breakdown.format <= 8
    || score.breakdown.structure <= 5
  ) {
    return 'low'
  }

  if (
    extractedTextLength >= 650
    && missingRequiredSections === 0
    && score.breakdown.format >= 18
    && score.breakdown.structure >= 15
    && score.breakdown.contact >= 8
  ) {
    return 'high'
  }

  return 'medium'
}

