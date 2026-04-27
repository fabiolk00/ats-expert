const GENERIC_STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por',
  'with', 'for', 'and', 'the', 'of', 'in', 'on', 'to',
])
const MIN_SAFE_ACRONYM_LENGTH = 3

function extractRawAcronymCandidate(value: string | undefined): string | null {
  const rawValue = (value ?? '').trim()
  if (!rawValue) {
    return null
  }

  const parentheticalMatch = rawValue.match(/\(([A-Z0-9][A-Z0-9&/+.-]{1,})\)/)
  if (parentheticalMatch?.[1]) {
    const compact = parentheticalMatch[1].replace(/[^A-Z0-9]/g, '').toLowerCase()
    return compact.length >= MIN_SAFE_ACRONYM_LENGTH ? compact : null
  }

  const compact = rawValue.replace(/[^A-Za-z0-9]/g, '')
  if (
    compact.length >= MIN_SAFE_ACRONYM_LENGTH
    && compact === compact.toUpperCase()
    && /[A-Z]/.test(compact)
  ) {
    return compact.toLowerCase()
  }

  return null
}

function singularizeToken(token: string): string {
  if (token.length <= 3) {
    return token
  }

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`
  }

  if (token.endsWith('oes') || token.endsWith('aes')) {
    return `${token.slice(0, -2)}o`
  }

  if (token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1)
  }

  return token
}

export function normalizeSemanticText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/+.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeSemanticTokens(value: string | undefined): string[] {
  return normalizeSemanticText(value)
    .split(' ')
    .map((token) => singularizeToken(token.trim()))
    .filter(Boolean)
}

export function buildCanonicalSignal(value: string | undefined): string {
  return normalizeSemanticTokens(value).join(' ').trim()
}

export function buildAcronym(value: string | undefined): string | null {
  const rawCandidate = extractRawAcronymCandidate(value)
  if (rawCandidate) {
    return rawCandidate
  }

  const tokens = normalizeSemanticTokens(value).filter((token) => !GENERIC_STOP_WORDS.has(token))

  if (tokens.length < 2) {
    return null
  }

  const acronym = tokens.map((token) => token[0]).join('')
  return acronym.length >= MIN_SAFE_ACRONYM_LENGTH ? acronym : null
}

export function buildLexicalVariants(value: string | undefined): string[] {
  const normalized = normalizeSemanticText(value)
  const canonical = buildCanonicalSignal(value)
  const compact = canonical.replace(/\s+/g, '')
  const acronym = buildAcronym(value)

  return Array.from(new Set([
    normalized,
    canonical,
    compact,
    acronym ?? '',
  ].filter(Boolean)))
}

export function computeTokenOverlap(left: string, right: string): number {
  const leftTokens = normalizeSemanticTokens(left).filter((token) => !GENERIC_STOP_WORDS.has(token))
  const rightTokens = normalizeSemanticTokens(right).filter((token) => !GENERIC_STOP_WORDS.has(token))

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0
  }

  const rightCounts = new Map<string, number>()
  rightTokens.forEach((token) => {
    rightCounts.set(token, (rightCounts.get(token) ?? 0) + 1)
  })

  let overlap = 0
  leftTokens.forEach((token) => {
    const count = rightCounts.get(token) ?? 0
    if (count > 0) {
      overlap += 1
      rightCounts.set(token, count - 1)
    }
  })

  return overlap / Math.max(leftTokens.length, rightTokens.length)
}

export function includesNormalizedPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) {
    return false
  }

  if (haystack === needle) {
    return true
  }

  return haystack.includes(` ${needle} `)
    || haystack.startsWith(`${needle} `)
    || haystack.endsWith(` ${needle}`)
}

export function hasLexicalAliasMatch(left: string, right: string): boolean {
  const leftVariants = new Set(buildLexicalVariants(left))
  const rightVariants = new Set(buildLexicalVariants(right))

  for (const variant of leftVariants) {
    if (rightVariants.has(variant)) {
      return true
    }
  }

  const leftCanonical = buildCanonicalSignal(left)
  const rightCanonical = buildCanonicalSignal(right)

  if (!leftCanonical || !rightCanonical) {
    return false
  }

  if (includesNormalizedPhrase(leftCanonical, rightCanonical) || includesNormalizedPhrase(rightCanonical, leftCanonical)) {
    return true
  }

  const leftAcronym = buildAcronym(left)
  const rightAcronym = buildAcronym(right)

  return Boolean(
    leftAcronym
    && rightAcronym
    && leftAcronym === rightAcronym,
  )
}
