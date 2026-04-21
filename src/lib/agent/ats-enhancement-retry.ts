import type { RewriteSectionInput } from '@/types/agent'
import type { CVState } from '@/types/cv'
import { isHighValueMetricBullet } from '@/lib/agent/tools/metric-impact-guard'

export const MAX_ATS_STAGE_RETRIES = 2
export const MAX_REWRITE_SECTION_CHARS = 5_500
export const MAX_REWRITE_BULLETS_PER_EXPERIENCE = 4

type RewriteSectionName = RewriteSectionInput['section']

function trimText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`
}

function prioritizeExperienceBullets(bullets: string[]): string[] {
  if (bullets.length <= MAX_REWRITE_BULLETS_PER_EXPERIENCE) {
    return bullets
  }

  const indexedBullets = bullets.map((bullet, index) => ({
    bullet,
    index,
    premium: isHighValueMetricBullet(bullet),
  }))
  const premiumBullets = indexedBullets.filter((entry) => entry.premium)
  const regularBullets = indexedBullets.filter((entry) => !entry.premium)
  const selected = premiumBullets.length >= MAX_REWRITE_BULLETS_PER_EXPERIENCE
    ? premiumBullets.slice(0, MAX_REWRITE_BULLETS_PER_EXPERIENCE)
    : [
        ...premiumBullets,
        ...regularBullets.slice(0, MAX_REWRITE_BULLETS_PER_EXPERIENCE - premiumBullets.length),
      ]

  return selected
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.bullet)
}

export function shapeRewriteCurrentContent(
  cvState: CVState,
  section: RewriteSectionName,
): { content: string; compacted: boolean } {
  switch (section) {
    case 'experience': {
      const compactExperience = cvState.experience.map((entry) => ({
        title: entry.title,
        company: entry.company,
        startDate: entry.startDate,
        endDate: entry.endDate,
        bullets: prioritizeExperienceBullets(entry.bullets).map((bullet) =>
          trimText(bullet, 220),
        ),
      }))
      const content = JSON.stringify(compactExperience)
      return {
        content: trimText(content, MAX_REWRITE_SECTION_CHARS),
        compacted: content.length > MAX_REWRITE_SECTION_CHARS
          || cvState.experience.some((entry) => entry.bullets.length > MAX_REWRITE_BULLETS_PER_EXPERIENCE),
      }
    }
    case 'education': {
      const content = JSON.stringify(cvState.education)
      return { content: trimText(content, MAX_REWRITE_SECTION_CHARS), compacted: content.length > MAX_REWRITE_SECTION_CHARS }
    }
    case 'certifications': {
      const content = JSON.stringify(cvState.certifications ?? [])
      return { content: trimText(content, MAX_REWRITE_SECTION_CHARS), compacted: content.length > MAX_REWRITE_SECTION_CHARS }
    }
    case 'skills': {
      const content = cvState.skills.join(', ')
      return { content: trimText(content, MAX_REWRITE_SECTION_CHARS), compacted: content.length > MAX_REWRITE_SECTION_CHARS }
    }
    case 'summary':
    default: {
      const content = cvState.summary
      return { content: trimText(content, MAX_REWRITE_SECTION_CHARS), compacted: content.length > MAX_REWRITE_SECTION_CHARS }
    }
  }
}

export async function executeWithStageRetry<T>(
  task: (attempt: number) => Promise<T>,
  options?: {
    maxAttempts?: number
    shouldRetry?: (error: unknown, attempt: number) => boolean
    onRetry?: (error: unknown, attempt: number) => void | Promise<void>
  },
): Promise<{ result: T; attempts: number }> {
  const maxAttempts = options?.maxAttempts ?? MAX_ATS_STAGE_RETRIES
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await task(attempt)
      return { result, attempts: attempt }
    } catch (error) {
      lastError = error

      const shouldRetry = attempt < maxAttempts
        && (options?.shouldRetry?.(error, attempt) ?? true)

      if (!shouldRetry) {
        throw error
      }

      await options?.onRetry?.(error, attempt)
    }
  }

  throw lastError
}
