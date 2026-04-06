import type { TargetFitAssessment } from '@/types/agent'
import type { GapAnalysisResult } from '@/types/cv'

function buildReasons(result: GapAnalysisResult): string[] {
  const reasons = [
    ...result.missingSkills.slice(0, 2).map((skill) => `Missing or underrepresented skill: ${skill}`),
    ...result.weakAreas.slice(0, 2).map((area) => `Weak area in the current profile: ${area}`),
  ]

  return reasons.slice(0, 3)
}

export function deriveTargetFitAssessment(
  result: GapAnalysisResult,
  assessedAt = new Date().toISOString(),
): TargetFitAssessment {
  const missingCount = result.missingSkills.length
  const weakAreaCount = result.weakAreas.length

  let level: TargetFitAssessment['level'] = 'partial'
  if (result.matchScore >= 78 && missingCount <= 2 && weakAreaCount <= 2) {
    level = 'strong'
  } else if (
    result.matchScore < 45
    || missingCount >= 6
    || weakAreaCount >= 5
    || (result.matchScore < 55 && (missingCount >= 4 || weakAreaCount >= 3))
  ) {
    level = 'weak'
  }

  const summaryByLevel: Record<TargetFitAssessment['level'], string> = {
    strong: 'The current profile appears strongly aligned with the target role, with only limited gaps to address.',
    partial: 'The current profile appears partially aligned with the target role, with relevant overlap but meaningful gaps still present.',
    weak: 'The current profile appears weakly aligned with the target role today, with major gaps that resume rewriting alone will not fully solve.',
  }

  return {
    level,
    summary: summaryByLevel[level],
    reasons: buildReasons(result),
    assessedAt,
  }
}
