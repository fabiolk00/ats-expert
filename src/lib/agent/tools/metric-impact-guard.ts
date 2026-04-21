import type { CVState, ExperienceEntry } from '@/types/cv'

const METRIC_PATTERN = /\d+(?:[.,]\d+)?%?/g
const IMPACT_TERMS = [
  'aument',
  'reduz',
  'melhor',
  'econom',
  'ganho',
  'eficien',
  'produt',
  'perform',
  'qualidad',
  'sla',
  'throughput',
  'tempo',
  'prazo',
  'custo',
  'saving',
  'otimiz',
  'aceler',
  'escal',
  'estabil',
]
const SCOPE_TERMS = [
  'latam',
  'global',
  'regional',
  'brasil',
  'america latina',
  'mil',
  'milhao',
  'milhoes',
  'milhar',
  'centena',
  'volume',
  'pipeline',
  'pipelines',
  'dashboard',
  'dashboards',
  'producao',
  'clientes',
  'usuarios',
]
const TECHNOLOGY_TERMS = [
  'sql',
  'python',
  'pyspark',
  'spark',
  'databricks',
  'power bi',
  'qlik',
  'dbt',
  'bigquery',
  'aws',
  'azure',
  'gcp',
  'etl',
  'elt',
  'api',
]
const STOPWORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'para',
  'por',
  'um',
  'uma',
])

export type MetricImpactRegression = {
  title: string
  company: string
  originalBullet: string
  metricTokens: string[]
  impactTerms: string[]
  scopeTerms: string[]
}

export type PremiumMetricBulletSummary = {
  premiumBulletCount: number
  premiumPercentBulletCount: number
  premiumScopeBulletCount: number
  premiumTechnologyImpactBulletCount: number
  section: 'experience'
}

export type MetricImpactPreservationStatus =
  | 'none'
  | 'full'
  | 'partial'
  | 'regressed'

export type MetricImpactComparison = PremiumMetricBulletSummary & {
  premiumBulletCountOriginal: number
  premiumBulletCountFinal: number
  regressionCount: number
  percentMetricLost: boolean
  scopeLost: boolean
  impactLost: boolean
  metricPreservationStatus: MetricImpactPreservationStatus
}

function normalize(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function extractTerms(text: string, dictionary: string[]): string[] {
  const normalized = normalize(text)
  return unique(dictionary.filter((term) => normalized.includes(term)))
}

function extractContentTokens(text: string): string[] {
  return unique(
    normalize(text)
      .split(/[^a-z0-9%]+/g)
      .map((token) => token.trim())
      .filter((token) =>
        token.length >= 4
        && !STOPWORDS.has(token)
        && !/^\d+(?:[.,]\d+)?%?$/.test(token),
      ),
  )
}

function calculateOverlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0
  }

  const rightCounts = new Map<string, number>()
  right.forEach((token) => {
    rightCounts.set(token, (rightCounts.get(token) ?? 0) + 1)
  })

  let overlap = 0
  left.forEach((token) => {
    const count = rightCounts.get(token) ?? 0
    if (count > 0) {
      overlap += 1
      rightCounts.set(token, count - 1)
    }
  })

  return overlap / left.length
}

function findMatchingExperienceEntry(
  optimizedExperience: ExperienceEntry[],
  entry: ExperienceEntry,
): ExperienceEntry | undefined {
  const normalizedTitle = normalize(entry.title)
  const normalizedCompany = normalize(entry.company)

  return optimizedExperience.find((candidate) =>
    normalize(candidate.title) === normalizedTitle
    && normalize(candidate.company) === normalizedCompany,
  )
}

function buildBulletSignals(text: string) {
  const metricTokens = unique(Array.from(text.match(METRIC_PATTERN) ?? []).map((token) => normalize(token)))
  const impactTerms = extractTerms(text, IMPACT_TERMS)
  const scopeTerms = extractTerms(text, SCOPE_TERMS)
  const technologyTerms = extractTerms(text, TECHNOLOGY_TERMS)
  const contentTokens = extractContentTokens(text)

  return {
    metricTokens,
    impactTerms,
    scopeTerms,
    technologyTerms,
    contentTokens,
  }
}

function summarizeHighValueBulletSignals(bullets: string[]): PremiumMetricBulletSummary {
  let premiumBulletCount = 0
  let premiumPercentBulletCount = 0
  let premiumScopeBulletCount = 0
  let premiumTechnologyImpactBulletCount = 0

  bullets.forEach((bullet) => {
    if (!isHighValueMetricBullet(bullet)) {
      return
    }

    const signals = buildBulletSignals(bullet)
    premiumBulletCount += 1

    if (signals.metricTokens.some((token) => token.includes('%'))) {
      premiumPercentBulletCount += 1
    }

    if (signals.scopeTerms.length > 0) {
      premiumScopeBulletCount += 1
    }

    if (signals.technologyTerms.length > 0 && signals.impactTerms.length > 0) {
      premiumTechnologyImpactBulletCount += 1
    }
  })

  return {
    premiumBulletCount,
    premiumPercentBulletCount,
    premiumScopeBulletCount,
    premiumTechnologyImpactBulletCount,
    section: 'experience',
  }
}

export function scoreMetricImpactBulletPriority(text: string): number {
  const signals = buildBulletSignals(text)

  let score = 0
  score += Math.min(signals.metricTokens.length, 2) * 2
  score += Math.min(signals.impactTerms.length, 2)
  score += Math.min(signals.scopeTerms.length, 2)
  score += Math.min(signals.technologyTerms.length, 1)

  if (signals.metricTokens.some((token) => token.includes('%'))) {
    score += 2
  }

  return score
}

export function isHighValueMetricBullet(text: string): boolean {
  return scoreMetricImpactBulletPriority(text) >= 4
}

function preservesSubstantiveMetricImpact(
  originalBullet: string,
  optimizedCombinedText: string,
): boolean {
  const originalSignals = buildBulletSignals(originalBullet)
  const optimizedSignals = buildBulletSignals(optimizedCombinedText)
  const normalizedOptimized = normalize(optimizedCombinedText)

  const preservesMetrics = originalSignals.metricTokens.every((token) => normalizedOptimized.includes(token))
  if (!preservesMetrics) {
    return false
  }

  const preservesImpactTerms = originalSignals.impactTerms.length === 0
    || originalSignals.impactTerms.some((term) => normalizedOptimized.includes(term))
  const preservesScopeTerms = originalSignals.scopeTerms.length === 0
    || originalSignals.scopeTerms.some((term) => normalizedOptimized.includes(term))

  if (preservesImpactTerms && preservesScopeTerms) {
    return true
  }

  return calculateOverlap(originalSignals.contentTokens, optimizedSignals.contentTokens) >= 0.45
}

export function findMetricImpactRegressions(
  originalCvState: CVState,
  optimizedCvState: CVState,
): MetricImpactRegression[] {
  const regressions: MetricImpactRegression[] = []

  originalCvState.experience.forEach((entry) => {
    const optimizedEntry = findMatchingExperienceEntry(optimizedCvState.experience, entry)
    if (!optimizedEntry) {
      return
    }

    const optimizedCombinedText = optimizedEntry.bullets.join(' ')
    entry.bullets.forEach((bullet) => {
      if (!isHighValueMetricBullet(bullet)) {
        return
      }

      if (preservesSubstantiveMetricImpact(bullet, optimizedCombinedText)) {
        return
      }

      const signals = buildBulletSignals(bullet)
      regressions.push({
        title: entry.title,
        company: entry.company,
        originalBullet: bullet,
        metricTokens: signals.metricTokens,
        impactTerms: signals.impactTerms,
        scopeTerms: signals.scopeTerms,
      })
    })
  })

  return regressions
}

export function summarizePremiumMetricBullets(cvState: CVState): PremiumMetricBulletSummary {
  return summarizeHighValueBulletSignals(
    cvState.experience.flatMap((entry) => entry.bullets),
  )
}

export function countPreservedMetricImpactBullets(
  originalCvState: CVState,
  optimizedCvState: CVState,
): number {
  let preservedCount = 0

  originalCvState.experience.forEach((entry) => {
    const optimizedEntry = findMatchingExperienceEntry(optimizedCvState.experience, entry)
    if (!optimizedEntry) {
      return
    }

    const optimizedCombinedText = optimizedEntry.bullets.join(' ')
    entry.bullets.forEach((bullet) => {
      if (!isHighValueMetricBullet(bullet)) {
        return
      }

      if (preservesSubstantiveMetricImpact(bullet, optimizedCombinedText)) {
        preservedCount += 1
      }
    })
  })

  return preservedCount
}

export function compareMetricImpactPreservation(
  originalCvState: CVState,
  optimizedCvState: CVState,
): MetricImpactComparison {
  const premiumSummary = summarizePremiumMetricBullets(originalCvState)
  const regressions = findMetricImpactRegressions(originalCvState, optimizedCvState)
  const preservedCount = countPreservedMetricImpactBullets(originalCvState, optimizedCvState)

  let metricPreservationStatus: MetricImpactPreservationStatus = 'none'
  if (premiumSummary.premiumBulletCount > 0) {
    if (regressions.length === 0 && preservedCount >= premiumSummary.premiumBulletCount) {
      metricPreservationStatus = 'full'
    } else if (preservedCount > 0) {
      metricPreservationStatus = 'partial'
    } else {
      metricPreservationStatus = 'regressed'
    }
  }

  return {
    ...premiumSummary,
    premiumBulletCountOriginal: premiumSummary.premiumBulletCount,
    premiumBulletCountFinal: preservedCount,
    regressionCount: regressions.length,
    percentMetricLost: regressions.some((regression) => regression.metricTokens.some((token) => token.includes('%'))),
    scopeLost: regressions.some((regression) => regression.scopeTerms.length > 0),
    impactLost: regressions.some((regression) => regression.impactTerms.length > 0),
    metricPreservationStatus,
  }
}
