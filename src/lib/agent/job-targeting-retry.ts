import { executeWithStageRetry, shapeRewriteCurrentContent } from '@/lib/agent/ats-enhancement-retry'
import type { CVState } from '@/types/cv'
import type { RewriteSectionInput } from '@/types/agent'

export const MAX_JOB_TARGETING_STAGE_RETRIES = 2
export const MAX_TARGET_JOB_DESCRIPTION_CHARS = 4500
export const MAX_TARGETING_PLAN_ITEMS = 6

type RewriteSectionName = RewriteSectionInput['section']

export function shapeTargetJobDescription(targetJobDescription: string): {
  content: string
  compacted: boolean
} {
  const normalized = targetJobDescription.trim().replace(/\r\n/g, '\n')
  if (normalized.length <= MAX_TARGET_JOB_DESCRIPTION_CHARS) {
    return {
      content: normalized,
      compacted: false,
    }
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const prioritizedLines = lines.filter((line) =>
    /requis|responsab|qualifica|skills|stack|must|nice|vaga|role|cargo|position/i.test(line),
  )
  const fallbackLines = lines.filter((line) => !prioritizedLines.includes(line))
  const compacted = [...prioritizedLines, ...fallbackLines]
    .join('\n')
    .slice(0, MAX_TARGET_JOB_DESCRIPTION_CHARS)
    .trim()

  return {
    content: compacted,
    compacted: true,
  }
}

export function shapeTargetingRewriteCurrentContent(
  cvState: CVState,
  section: RewriteSectionName,
): ReturnType<typeof shapeRewriteCurrentContent> {
  return shapeRewriteCurrentContent(cvState, section)
}

export { executeWithStageRetry }
