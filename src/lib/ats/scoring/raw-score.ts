import { scoreATS } from '@/lib/ats/score'
import { buildResumeTextFromCvState } from '@/lib/profile/ats-enhancement'
import type { CVState } from '@/types/cv'

export type RawAtsScoreSnapshot = {
  resumeText: string
  extractedTextLength: number
  score: ReturnType<typeof scoreATS>
}

export function computeRawAtsScoreSnapshot(
  cvState: CVState,
  jobDescription?: string,
): RawAtsScoreSnapshot {
  const resumeText = buildResumeTextFromCvState(cvState)
  return {
    resumeText,
    extractedTextLength: resumeText.length,
    score: scoreATS(resumeText, jobDescription),
  }
}

