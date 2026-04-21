export type QueryPatternStat = {
  fingerprint: string
  sample: string
  count: number
}

const REPEATED_PATTERN_THRESHOLD = 3
const MAX_TOP_REPEATED_PATTERNS = 5

export function buildQueryFingerprint(descriptor: string): string {
  const [methodAndPath, rawQueryString = ''] = descriptor.split('?', 2)
  const [method = 'GET', path = ''] = methodAndPath.split(' ', 2)

  if (!rawQueryString) {
    return `${method} ${path}`.trim()
  }

  const searchParams = new URLSearchParams(rawQueryString)
  const entries = Array.from(searchParams.entries())
    .map(([key, value]) => [key, normalizeQueryValue(value)] as const)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))

  const normalizedQuery = entries
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return `${method} ${path}?${normalizedQuery}`.trim()
}

export function normalizeQueryValue(value: string): string {
  if (!value) {
    return value
  }

  if (/^in\.\(.+\)$/i.test(value)) {
    return 'in.(:list)'
  }

  if (/^eq\./i.test(value)) {
    return `eq.${normalizeScalarValue(value.slice(3))}`
  }

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
    return ':number'
  }

  if (looksLikeLongList(value)) {
    return ':list'
  }

  return normalizeScalarValue(value)
}

export function summarizePatternStats(
  stats: ReadonlyMap<string, QueryPatternStat>,
): {
  uniqueQueryPatternCount: number
  repeatedQueryPatternCount: number
  maxRepeatedPatternCount: number
  topRepeatedQueryPatterns: QueryPatternStat[]
} {
  const allStats = Array.from(stats.values())
  const repeatedStats = allStats
    .filter((stat) => stat.count >= REPEATED_PATTERN_THRESHOLD)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.fingerprint.localeCompare(right.fingerprint)
    })

  return {
    uniqueQueryPatternCount: allStats.length,
    repeatedQueryPatternCount: repeatedStats.length,
    maxRepeatedPatternCount: repeatedStats[0]?.count ?? 0,
    topRepeatedQueryPatterns: repeatedStats.slice(0, MAX_TOP_REPEATED_PATTERNS),
  }
}

function normalizeScalarValue(value: string): string {
  if (!value) {
    return value
  }

  if (isUuidLike(value)) {
    return ':uuid'
  }

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
    return ':number'
  }

  if (looksOpaque(value)) {
    return ':value'
  }

  return value
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function looksOpaque(value: string): boolean {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return false
  }

  const hasDigit = /[0-9]/.test(value)
  const hasDelimiter = /[_-]/.test(value)

  return (value.length >= 8 && (hasDigit || hasDelimiter))
    || value.length >= 16
}

function looksLikeLongList(value: string): boolean {
  if (!value.includes(',')) {
    return false
  }

  const items = value.split(',').map((item) => item.trim()).filter(Boolean)
  return items.length >= 3 && items.every((item) => item.length >= 4)
}
