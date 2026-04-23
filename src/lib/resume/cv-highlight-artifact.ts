import { z } from 'zod'

import type { CVState, ExperienceEntry } from '@/types/cv'

export const CV_HIGHLIGHT_ARTIFACT_VERSION = 2

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUMMARY_MAX_HIGHLIGHT_COVERAGE = 0.4
const EXPERIENCE_MAX_HIGHLIGHT_COVERAGE = 0.55
const COMPACT_EXPERIENCE_HIGHLIGHT_MAX_LENGTH = 90
const HIGHLIGHT_STACK_SEPARATOR_CHAR = '|'
const HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS = 72
const HIGHLIGHT_MAX_CONTINUATION_WORDS = 10

// CHANGE #5 — adaptive coverage threshold replaces the single constant for
// experience bullets. Short bullets (< 60 chars) get a higher ceiling so
// legitimate dense highlights are not rejected by the fixed 55 % threshold.
function adaptiveCoverageThreshold(textLength: number): number {
  if (textLength < 60) return 0.75
  if (textLength < 100) return 0.65
  return EXPERIENCE_MAX_HIGHLIGHT_COVERAGE
}

const HIGHLIGHT_IGNORABLE_BOUNDARY_CHARS = new Set([
  ',',
  '.',
  ':',
  ';',
  '(',
  ')',
  '[',
  ']',
  '/',
  '\\',
  HIGHLIGHT_STACK_SEPARATOR_CHAR,
  '-',
  '–',
  '—',
])

const HIGHLIGHT_BRIDGEABLE_BOUNDARY_CHARS = new Set([
  ',',
  ':',
  ';',
  '(',
  '[',
  '/',
  '\\',
  '-',
  '–',
  '—',
])

const HIGHLIGHT_MERGEABLE_GAP_CHARS = new Set([
  ',',
  '(',
  ')',
  '[',
  ']',
  '/',
  '\\',
  '-',
  '–',
  '—',
])

const HIGHLIGHT_INLINE_COMPOSITE_CHARS = new Set([
  '/',
  '\\',
  '-',
  '–',
  '—',
])

const HIGHLIGHT_STRONG_CLAUSE_START_PATTERN =
  /^(?:and|but|while|however|whereas|mas|por(?:e|é)m|enquanto|because|porque)\b/i

const HIGHLIGHT_VERB_HINT_PATTERN =
  /\b(?:led|built|created|designed|developed|implemented|managed|reduced|increased|improved|optimized|automated|scaled|delivered|owned|migrated|supported|analyzed|organized|reinforced|maintained|provided|served|coordinated|atendi|atuei|organizei|reforcei|mantive|prestei|coordenei|garanti|contribui|suportei|aumentei|reduzi|melhorei|otimizei|automatizei|liderei|criei|desenvolvi|implementei|gerenciei|entreguei|migrei|apoiei|analisei)\b/i

const HIGHLIGHT_GERUND_CONTINUATION_PATTERN =
  /^(?:contributing|reinforcing|ensuring|supporting|maintaining|reducing|increasing|driving|improving|enabling|closing|strengthening|contribuindo|reforcando|reforçando|garantindo|apoiando|mantendo|reduzindo|aumentando|impulsionando|melhorando|viabilizando|fortalecendo)\b/i

const HIGHLIGHT_COORDINATED_CONTINUATION_PATTERN =
  /^(?:and|e)\s+(?:with|for|in|on|during|com|para|em|no|na|nos|nas|ao|aos|a|à|support|supporting|apoio|apoiando|atendimento|rotinas|processo|processos|disponibilidade|estabilidade|satisfacao|satisfação)\b/i

const HIGHLIGHT_DIRECT_CLOSURE_PREPOSITION_PATTERN =
  /^(?:during|in|on|to|com|para|em|no|na|nos|nas|durante|ao|aos|a|à|as|às)\b/i

const HIGHLIGHT_SEMANTIC_DESCRIPTOR_HINT_PATTERN =
  /\b(?:focused|specialized|oriented|dedicated|responsible|experienced|especializado|focado|orientado|dedicado|responsavel|responsável|experiente)\b/i

// CHANGE #6 — pattern used by the local fallback to identify action verbs
// at the start of a bullet, enabling synthetic highlight generation when
// the model returns no ranges for a measurably strong bullet.
const HIGHLIGHT_FALLBACK_ACTION_VERB_PATTERN =
  /\b(?:led|built|created|designed|developed|implemented|managed|reduced|increased|improved|optimized|automated|scaled|delivered|owned|migrated|supported|analyzed|organized|reinforced|maintained|provided|served|coordinated|generated|boosted|cut|saved|grew|elevated|expanded|accelerated|atendi|atuei|organizei|reforcei|mantive|prestei|coordenei|garanti|contribui|suportei|aumentei|reduzi|melhorei|otimizei|automatizei|liderei|criei|desenvolvi|implementei|gerenciei|entreguei|migrei|apoiei|analisei|gerei|ampliei|acelerei|expandi|elevei)\b/i

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CvHighlightInputItem = {
  itemId: string
  section: 'summary' | 'experience'
  text: string
  experienceIndex?: number
  bulletIndex?: number
}

export type CvHighlightReason =
  | 'metric_impact'
  | 'business_impact'
  | 'action_result'
  | 'ats_strength'
  | 'tool_context'

export type CvHighlightRange = {
  start: number
  end: number
  reason: CvHighlightReason
}

export type CvResolvedHighlight = {
  itemId: string
  section: 'summary' | 'experience'
  ranges: CvHighlightRange[]
}

export type CvHighlightState = {
  source: 'rewritten_cv_state'
  version: typeof CV_HIGHLIGHT_ARTIFACT_VERSION
  resolvedHighlights: CvResolvedHighlight[]
  generatedAt: string
  /** CHANGE #4 — fingerprint of the rewrittenCvState used to detect reuse */
  cvStateFingerprint?: string
}

export type CvHighlightDetectionResult = Array<{
  itemId: string
  ranges: Array<{
    start: number
    end: number
    reason: CvHighlightReason
  }>
}>

export type CvHighlightTextSegment = {
  text: string
  highlighted: boolean
  reason?: CvHighlightReason
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const cvHighlightReasonSchema = z.enum([
  'metric_impact',
  'business_impact',
  'action_result',
  'ats_strength',
  'tool_context',
])

const cvHighlightRangeSchema = z.object({
  start: z.number().int(),
  end: z.number().int(),
  reason: cvHighlightReasonSchema,
})

const cvHighlightDetectionItemSchema = z.object({
  itemId: z.string().min(1),
  ranges: z.array(cvHighlightRangeSchema),
})

const cvHighlightDetectionObjectSchema = z.object({
  items: z.array(cvHighlightDetectionItemSchema),
})

const cvResolvedHighlightSchema = z.object({
  itemId: z.string().min(1),
  section: z.enum(['summary', 'experience']),
  ranges: z.array(cvHighlightRangeSchema),
})

const cvHighlightStateSchema = z.object({
  source: z.literal('rewritten_cv_state'),
  version: z.literal(CV_HIGHLIGHT_ARTIFACT_VERSION),
  resolvedHighlights: z.array(cvResolvedHighlightSchema),
  generatedAt: z.string().min(1),
  cvStateFingerprint: z.string().optional(),
})

// ---------------------------------------------------------------------------
// ID / identity helpers
// ---------------------------------------------------------------------------

export function createSummaryHighlightItemId(): string {
  return 'summary_0'
}

export function canonicalizeHighlightIdentityText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function hashHighlightIdentity(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36).padStart(7, '0')
}

function buildExperienceBulletIdentitySeed(
  experience: ExperienceEntry,
  bullet: string,
): string {
  return [
    canonicalizeHighlightIdentityText(experience.title),
    canonicalizeHighlightIdentityText(experience.company),
    canonicalizeHighlightIdentityText(experience.startDate),
    canonicalizeHighlightIdentityText(experience.endDate),
    canonicalizeHighlightIdentityText(bullet),
  ].join('::')
}

export function createExperienceBulletHighlightItemId(
  experience: ExperienceEntry,
  bullet: string,
  occurrenceIndex = 0,
): string {
  return `exp_${hashHighlightIdentity(`${buildExperienceBulletIdentitySeed(experience, bullet)}::${occurrenceIndex}`)}`
}

export function buildExperienceBulletHighlightItemIds(
  experience: ExperienceEntry,
): Array<string | undefined> {
  const occurrenceBySeed = new Map<string, number>()

  return experience.bullets.map((bullet) => {
    if (!bullet.trim()) {
      return undefined
    }

    const seed = buildExperienceBulletIdentitySeed(experience, bullet)
    const occurrenceIndex = occurrenceBySeed.get(seed) ?? 0
    occurrenceBySeed.set(seed, occurrenceIndex + 1)

    return createExperienceBulletHighlightItemId(experience, bullet, occurrenceIndex)
  })
}

// ---------------------------------------------------------------------------
// CHANGE #4 — CVState fingerprinting
// Allows callers to detect when a highlightState was generated for the exact
// same rewrittenCvState and therefore can be safely reused without a new
// model call, eliminating non-determinism between equivalent executions.
// ---------------------------------------------------------------------------

export function computeCvStateFingerprint(cvState: CVState): string {
  const seed = [
    canonicalizeHighlightIdentityText(cvState.summary),
    ...cvState.experience.flatMap((exp) => [
      canonicalizeHighlightIdentityText(exp.title),
      canonicalizeHighlightIdentityText(exp.company),
      canonicalizeHighlightIdentityText(exp.startDate),
      canonicalizeHighlightIdentityText(exp.endDate),
      ...exp.bullets.map((b) => canonicalizeHighlightIdentityText(b)),
    ]),
  ].join('|||')

  return hashHighlightIdentity(seed)
}

export function highlightStateMatchesCvState(
  highlightState: CvHighlightState,
  cvState: CVState,
): boolean {
  if (!highlightState.cvStateFingerprint) {
    return false
  }

  return highlightState.cvStateFingerprint === computeCvStateFingerprint(cvState)
}

// ---------------------------------------------------------------------------
// Flatten
// ---------------------------------------------------------------------------

export function flattenCvStateForHighlight(cvState: CVState): CvHighlightInputItem[] {
  const items: CvHighlightInputItem[] = []

  if (cvState.summary.trim()) {
    items.push({
      itemId: createSummaryHighlightItemId(),
      section: 'summary',
      text: cvState.summary,
    })
  }

  cvState.experience.forEach((experience, experienceIndex) => {
    const itemIds = buildExperienceBulletHighlightItemIds(experience)

    experience.bullets.forEach((bullet, bulletIndex) => {
      const itemId = itemIds[bulletIndex]
      if (!itemId) {
        return
      }

      items.push({
        itemId,
        section: 'experience',
        experienceIndex,
        bulletIndex,
        text: bullet,
      })
    })
  })

  return items
}

// ---------------------------------------------------------------------------
// Raw detection parsing
// ---------------------------------------------------------------------------

function parseRawHighlightDetection(raw: unknown): CvHighlightDetectionResult {
  const objectResult = cvHighlightDetectionObjectSchema.safeParse(raw)
  if (objectResult.success) {
    return objectResult.data.items
  }

  const arrayResult = z.array(cvHighlightDetectionItemSchema).safeParse(raw)
  if (arrayResult.success) {
    return arrayResult.data
  }

  return []
}

// ---------------------------------------------------------------------------
// Range primitives
// ---------------------------------------------------------------------------

function isSafeNonOverlappingRange(
  range: CvHighlightRange,
  itemText: string,
  previousAcceptedRange?: CvHighlightRange,
): boolean {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    return false
  }

  if (range.start < 0 || range.end <= range.start || range.end > itemText.length) {
    return false
  }

  if (previousAcceptedRange && range.start < previousAcceptedRange.end) {
    return false
  }

  return true
}

function clampHighlightRange(
  textLength: number,
  range: CvHighlightRange,
): CvHighlightRange | null {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    return null
  }

  const start = Math.max(0, Math.min(textLength, range.start))
  const end = Math.max(0, Math.min(textLength, range.end))
  if (end <= start) {
    return null
  }

  return { start, end, reason: range.reason }
}

// ---------------------------------------------------------------------------
// Character helpers
// ---------------------------------------------------------------------------

function isWhitespaceLike(char: string | undefined): boolean {
  return typeof char === 'string' && /\s/u.test(char)
}

function isWordLikeChar(char: string | undefined): boolean {
  return typeof char === 'string' && /[\p{L}\p{N}]/u.test(char)
}

function countHighlightWords(value: string): number {
  return value.match(/[\p{L}\p{N}$%+#]+/gu)?.length ?? 0
}

function hasMeaningfulHighlightContent(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value) || /\$\s*\d/u.test(value)
}

function isInlineDecimalOrAbbreviationBoundary(text: string, index: number): boolean {
  return (
    text[index] === '.'
    && isWordLikeChar(text[index - 1])
    && isWordLikeChar(text[index + 1])
  )
}

// ---------------------------------------------------------------------------
// Continuation helpers
// ---------------------------------------------------------------------------

function normalizeLeadingContinuationText(value: string): string {
  let cursor = 0

  while (
    cursor < value.length
    && (isWhitespaceLike(value[cursor]) || HIGHLIGHT_IGNORABLE_BOUNDARY_CHARS.has(value[cursor]!))
  ) {
    cursor += 1
  }

  return value.slice(cursor).trim()
}

function startsWithAttachedContinuation(value: string): boolean {
  const trimmed = normalizeLeadingContinuationText(value)
  if (!trimmed) return false

  return (
    HIGHLIGHT_GERUND_CONTINUATION_PATTERN.test(trimmed)
    || HIGHLIGHT_COORDINATED_CONTINUATION_PATTERN.test(trimmed)
  )
}

function isLikelyNounPhraseContinuation(value: string): boolean {
  const trimmed = normalizeLeadingContinuationText(value)
  if (!trimmed) return false

  return (
    countHighlightWords(trimmed) <= 4
    && !HIGHLIGHT_VERB_HINT_PATTERN.test(trimmed)
    && !HIGHLIGHT_STRONG_CLAUSE_START_PATTERN.test(trimmed)
  )
}

function hasActionOrMetricLead(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  return HIGHLIGHT_VERB_HINT_PATTERN.test(trimmed) || /[$\d%]/u.test(trimmed)
}

function hasSemanticClosureLead(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  return (
    hasActionOrMetricLead(trimmed)
    || HIGHLIGHT_SEMANTIC_DESCRIPTOR_HINT_PATTERN.test(trimmed)
  )
}

function isLikelyTightPrepositionalClosure(value: string): boolean {
  const normalized = normalizeLeadingContinuationText(value)
  if (!normalized || !HIGHLIGHT_DIRECT_CLOSURE_PREPOSITION_PATTERN.test(normalized)) {
    return false
  }

  if (countHighlightWords(normalized) > 5) return false

  const [, ...tailWords] = normalized.split(/\s+/u)
  const tail = tailWords.join(' ')
  if (!tail) return false

  return !/\b(?:with|for|by|via|through|across|toward|towards|between|among|com|para|durante|during|em|no|na|nos|nas)\b/i.test(
    tail,
  )
}

function isLikelyTightSemanticComplementClosure(value: string): boolean {
  const normalized = normalizeLeadingContinuationText(value)
  if (!normalized) return false

  if (countHighlightWords(normalized) > 6) return false
  if (HIGHLIGHT_STRONG_CLAUSE_START_PATTERN.test(normalized)) return false
  if (HIGHLIGHT_VERB_HINT_PATTERN.test(normalized)) return false
  if (/^(?:for|with|by|via|through|across)\b/i.test(normalized)) return false

  return (
    /^(?:para|com|no|na|nos|nas|ao|aos|a|à|em|focused on|specialized in|oriented to|dedicated to|responsible for)\b/i.test(
      normalized,
    ) || isLikelyNounPhraseContinuation(normalized)
  )
}

// ---------------------------------------------------------------------------
// Trim / normalize helpers
// ---------------------------------------------------------------------------

function trimHighlightEdgeNoiseBounds(
  text: string,
  start: number,
  end: number,
): { start: number; end: number } | null {
  let nextStart = start
  let nextEnd = end

  while (
    nextStart < nextEnd
    && (
      isWhitespaceLike(text[nextStart])
      || (
        HIGHLIGHT_IGNORABLE_BOUNDARY_CHARS.has(text[nextStart]!)
        && !(
          (text[nextStart] === '(' && text.slice(nextStart + 1, nextEnd).includes(')'))
          || (text[nextStart] === '[' && text.slice(nextStart + 1, nextEnd).includes(']'))
        )
      )
    )
  ) {
    nextStart += 1
  }

  while (
    nextEnd > nextStart
    && (
      isWhitespaceLike(text[nextEnd - 1])
      || (
        HIGHLIGHT_IGNORABLE_BOUNDARY_CHARS.has(text[nextEnd - 1]!)
        && !(
          (text[nextEnd - 1] === ')' && text.slice(nextStart, nextEnd - 1).includes('('))
          || (text[nextEnd - 1] === ']' && text.slice(nextStart, nextEnd - 1).includes('['))
        )
      )
    )
  ) {
    nextEnd -= 1
  }

  if (nextEnd <= nextStart) return null

  return { start: nextStart, end: nextEnd }
}

function normalizeRangeToWordBoundaries(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange {
  let start = range.start
  let end = range.end

  while (
    start > 0
    && isWordLikeChar(text[start - 1])
    && (
      isWordLikeChar(text[start])
      || (HIGHLIGHT_INLINE_COMPOSITE_CHARS.has(text[start]!) && isWordLikeChar(text[start + 1]))
    )
  ) {
    start -= 1
  }

  while (
    end < text.length
    && isWordLikeChar(text[end])
    && (isWordLikeChar(text[end - 1]) || HIGHLIGHT_INLINE_COMPOSITE_CHARS.has(text[end - 1]!))
  ) {
    end += 1
  }

  return { start, end, reason: range.reason }
}

function expandRangeLeftForCurrencyPrefix(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange {
  let start = range.start

  if (start > 0 && text[start - 1] === '$' && isWordLikeChar(text[start])) {
    start -= 1
  }

  return { start, end: range.end, reason: range.reason }
}

function expandRangeAcrossInlineCompositeTerms(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange {
  let start = range.start
  let end = range.end

  while (
    start > 1
    && HIGHLIGHT_INLINE_COMPOSITE_CHARS.has(text[start - 1]!)
    && isWordLikeChar(text[start - 2])
    && isWordLikeChar(text[start])
  ) {
    start -= 1
    while (start > 0 && isWordLikeChar(text[start - 1])) {
      start -= 1
    }
  }

  while (
    end + 1 < text.length
    && HIGHLIGHT_INLINE_COMPOSITE_CHARS.has(text[end]!)
    && isWordLikeChar(text[end - 1])
    && isWordLikeChar(text[end + 1])
  ) {
    end += 1
    while (end < text.length && isWordLikeChar(text[end])) {
      end += 1
    }
  }

  if (end < text.length && text[end] === '%' && isWordLikeChar(text[end - 1])) {
    end += 1
  }

  return { start, end, reason: range.reason }
}

// ---------------------------------------------------------------------------
// CHANGE #2 — readShortContinuationEnd no longer stops at '(' when there is
// a matching ')' within the look-ahead window. This allows metric annotations
// like "reduced latency (by 40%)" to be absorbed as part of the span.
// ---------------------------------------------------------------------------

function readShortContinuationEnd(text: string, start: number): number | null {
  let cursor = start

  while (
    cursor < text.length
    && cursor - start <= HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS
  ) {
    const char = text[cursor]

    if (
      char === HIGHLIGHT_STACK_SEPARATOR_CHAR
      || (/[.!?]/u.test(char) && !isInlineDecimalOrAbbreviationBoundary(text, cursor))
    ) {
      break
    }

    // CHANGE #2: only break on '(' when there is no matching ')' ahead.
    if (char === '(' || char === '[') {
      const closeChar = char === '(' ? ')' : ']'
      const remainingWindow = text.slice(
        cursor + 1,
        cursor + 1 + HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS,
      )
      if (!remainingWindow.includes(closeChar)) {
        break
      }
      // has matching close — let the cursor continue through the parenthetical
      cursor += 1
      continue
    }

    if (
      cursor > start
      && (char === ',' || char === ':' || char === ';')
    ) {
      break
    }

    cursor += 1
  }

  while (cursor > start && isWhitespaceLike(text[cursor - 1])) {
    cursor -= 1
  }

  if (cursor <= start) return null

  return cursor
}

// ---------------------------------------------------------------------------
// Expansion decision functions
// ---------------------------------------------------------------------------

function shouldExpandAcrossBoundary(
  separatorChar: string,
  continuationText: string,
): boolean {
  const trimmed = continuationText.trim()
  const normalized = normalizeLeadingContinuationText(continuationText)
  const attachedContinuation = startsWithAttachedContinuation(normalized)

  if (!trimmed || !hasMeaningfulHighlightContent(trimmed)) return false
  if (trimmed.length > HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS) return false

  if (
    countHighlightWords(normalized || trimmed)
    > (attachedContinuation
      ? HIGHLIGHT_MAX_CONTINUATION_WORDS + 4
      : HIGHLIGHT_MAX_CONTINUATION_WORDS)
  ) {
    return false
  }

  if (HIGHLIGHT_STRONG_CLAUSE_START_PATTERN.test(normalized || trimmed)) return false

  if (separatorChar === ':' || separatorChar === ';') {
    return /^[$\d\p{Lu}]/u.test(normalized || trimmed)
  }

  if (separatorChar === ',') {
    return (
      attachedContinuation
      || isLikelyNounPhraseContinuation(normalized)
      || /^[$\d]/u.test(normalized || trimmed)
    )
  }

  return true
}

// ---------------------------------------------------------------------------
// CHANGE #3 — shouldPreferPhraseClosure no longer unconditionally blocks
// continuations starting with "by", "for", "with", etc. Those prepositions
// are only blocked when the current fragment lacks a semantic closure lead
// (i.e., no action verb, metric, or descriptor). This lets spans like
// "reduced latency by 40%" or "built for 3 enterprise clients" close fully.
// ---------------------------------------------------------------------------

function shouldPreferPhraseClosure(
  text: string,
  range: CvHighlightRange,
  candidateEnd: number,
): boolean {
  if (candidateEnd <= range.end) return false

  const addition = text.slice(range.end, candidateEnd).trim()
  const normalizedAddition = normalizeLeadingContinuationText(addition)
  const currentFragment = text.slice(range.start, range.end).trim()

  if (!addition || !hasMeaningfulHighlightContent(addition)) return false
  if (addition.length > HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS) return false

  if (
    countHighlightWords(normalizedAddition || addition)
    > (startsWithAttachedContinuation(normalizedAddition)
      ? HIGHLIGHT_MAX_CONTINUATION_WORDS + 2
      : HIGHLIGHT_MAX_CONTINUATION_WORDS)
  ) {
    return false
  }

  if (HIGHLIGHT_STRONG_CLAUSE_START_PATTERN.test(normalizedAddition || addition)) return false

  // CHANGE #3: block metric-valued prepositions only when the current
  // fragment does not already carry semantic weight.
  if (
    /^(?:for|with|by|via|through|across)\b/i.test(normalizedAddition)
    && !hasSemanticClosureLead(currentFragment)
  ) {
    return false
  }

  const attachedContinuation =
    HIGHLIGHT_GERUND_CONTINUATION_PATTERN.test(normalizedAddition)
    || HIGHLIGHT_COORDINATED_CONTINUATION_PATTERN.test(normalizedAddition)

  const nounPhraseClosure =
    isLikelyNounPhraseContinuation(normalizedAddition)
    && (/[$\d%]/u.test(currentFragment) || hasSemanticClosureLead(currentFragment))

  const prepositionalClosure =
    isLikelyTightPrepositionalClosure(normalizedAddition)
    && hasSemanticClosureLead(currentFragment)

  const semanticComplementClosure =
    isLikelyTightSemanticComplementClosure(normalizedAddition)
    && hasSemanticClosureLead(currentFragment)

  // CHANGE #3: also allow the continuation when it starts with a metric
  // preposition ("by 40%", "with zero downtime") and the fragment has a
  // semantic closure lead — catches the common "verb + metric complement" pattern.
  const metricPrepositionClosure =
    /^(?:by|with|for)\b/i.test(normalizedAddition)
    && hasSemanticClosureLead(currentFragment)
    && /\d|[$%]/u.test(addition)

  if (
    !attachedContinuation
    && !nounPhraseClosure
    && !prepositionalClosure
    && !semanticComplementClosure
    && !metricPrepositionClosure
  ) {
    return false
  }

  const mergedText = text.slice(range.start, candidateEnd).trim()
  if (mergedText.includes(HIGHLIGHT_STACK_SEPARATOR_CHAR)) return false

  return (
    mergedText.length <= HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS * 2
    && countHighlightWords(mergedText) <= HIGHLIGHT_MAX_CONTINUATION_WORDS + 5
  )
}

// ---------------------------------------------------------------------------
// Expansion functions
// ---------------------------------------------------------------------------

function expandRangeRightAcrossSeparator(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange {
  let separatorIndex = range.end
  while (separatorIndex < text.length && isWhitespaceLike(text[separatorIndex])) {
    separatorIndex += 1
  }

  const separatorChar = text[separatorIndex]
  if (!separatorChar || !HIGHLIGHT_BRIDGEABLE_BOUNDARY_CHARS.has(separatorChar)) {
    return range
  }

  let continuationStart = separatorIndex + 1
  while (continuationStart < text.length && isWhitespaceLike(text[continuationStart])) {
    continuationStart += 1
  }

  const continuationEnd = readShortContinuationEnd(text, continuationStart)
  if (continuationEnd === null) return range

  const continuationText = text.slice(continuationStart, continuationEnd)
  if (!shouldExpandAcrossBoundary(separatorChar, continuationText)) return range

  return { start: range.start, end: continuationEnd, reason: range.reason }
}

function expandRangeRightForPhraseClosure(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange {
  let continuationStart = range.end
  while (continuationStart < text.length && isWhitespaceLike(text[continuationStart])) {
    continuationStart += 1
  }

  if (continuationStart >= text.length) return range

  const continuationEnd = readShortContinuationEnd(text, continuationStart)
  if (continuationEnd === null) return range

  if (!shouldPreferPhraseClosure(text, range, continuationEnd)) return range

  return { start: range.start, end: continuationEnd, reason: range.reason }
}

// ---------------------------------------------------------------------------
// Pipe / stack helpers
// ---------------------------------------------------------------------------

function isLikelyPipeStackText(text: string): boolean {
  const pipeCount = text.split(HIGHLIGHT_STACK_SEPARATOR_CHAR).length - 1
  if (pipeCount < 2) return false

  return !HIGHLIGHT_VERB_HINT_PATTERN.test(text)
}

function isWeakPipeSegment(itemText: string, fragment: string): boolean {
  if (!isLikelyPipeStackText(itemText)) return false
  if (/\d|\$|%/u.test(fragment) || HIGHLIGHT_VERB_HINT_PATTERN.test(fragment)) return false

  return countHighlightWords(fragment) <= 2
}

function constrainRangeToPipeSegment(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange | null {
  const fragment = text.slice(range.start, range.end)

  if (!fragment.includes(HIGHLIGHT_STACK_SEPARATOR_CHAR)) {
    if (isWeakPipeSegment(text, fragment.trim())) return null
    return range
  }

  let bestBounds: { start: number; end: number } | null = null
  let cursor = range.start

  while (cursor < range.end) {
    while (
      cursor < range.end
      && (text[cursor] === HIGHLIGHT_STACK_SEPARATOR_CHAR || isWhitespaceLike(text[cursor]))
    ) {
      cursor += 1
    }

    if (cursor >= range.end) break

    let segmentEnd = cursor
    while (segmentEnd < range.end && text[segmentEnd] !== HIGHLIGHT_STACK_SEPARATOR_CHAR) {
      segmentEnd += 1
    }

    const trimmedBounds = trimHighlightEdgeNoiseBounds(text, cursor, segmentEnd)
    if (
      trimmedBounds
      && (!bestBounds || trimmedBounds.end - trimmedBounds.start > bestBounds.end - bestBounds.start)
    ) {
      bestBounds = trimmedBounds
    }

    cursor = segmentEnd + 1
  }

  if (!bestBounds) return null

  const bestFragment = text.slice(bestBounds.start, bestBounds.end).trim()
  if (!bestFragment || isWeakPipeSegment(text, bestFragment)) return null

  return { start: bestBounds.start, end: bestBounds.end, reason: range.reason }
}

// ---------------------------------------------------------------------------
// Merge helper
// ---------------------------------------------------------------------------

function shouldMergeAcrossIgnorableGap(
  text: string,
  previousRange: CvHighlightRange,
  nextRange: CvHighlightRange,
): boolean {
  if (previousRange.reason !== nextRange.reason) return false

  const gapText = text.slice(previousRange.end, nextRange.start)
  if (!gapText) return false

  if (
    [...gapText].some(
      (char) => !isWhitespaceLike(char) && !HIGHLIGHT_MERGEABLE_GAP_CHARS.has(char),
    )
  ) {
    return false
  }

  const mergedText = text.slice(previousRange.start, nextRange.end).trim()
  if (mergedText.includes(HIGHLIGHT_STACK_SEPARATOR_CHAR)) return false

  return (
    countHighlightWords(mergedText) <= HIGHLIGHT_MAX_CONTINUATION_WORDS + 3
    && mergedText.length <= HIGHLIGHT_MAX_BOUNDARY_REFINEMENT_CHARS * 2
  )
}

// ---------------------------------------------------------------------------
// CHANGE #1 — normalizeHighlightSpanBoundaries runs the expansion loop until
// the range stabilizes (up to MAX_EXPANSION_ITERATIONS iterations) instead of
// calling each expansion function exactly once. This handles bullets where two
// consecutive boundary steps are required to close the semantic unit, e.g.:
//   "reduced latency, by 40%" → needs separator expansion then phrase closure.
// ---------------------------------------------------------------------------

const MAX_EXPANSION_ITERATIONS = 3

export function normalizeHighlightSpanBoundaries(
  text: string,
  range: CvHighlightRange,
): CvHighlightRange | null {
  let normalizedRange = clampHighlightRange(text.length, range)
  if (!normalizedRange) return null

  const trimmedInitialBounds = trimHighlightEdgeNoiseBounds(
    text,
    normalizedRange.start,
    normalizedRange.end,
  )
  if (!trimmedInitialBounds) return null

  normalizedRange = {
    start: trimmedInitialBounds.start,
    end: trimmedInitialBounds.end,
    reason: range.reason,
  }

  // CHANGE #1: stabilising expansion loop.
  normalizedRange = normalizeRangeToWordBoundaries(text, normalizedRange)
  normalizedRange = expandRangeLeftForCurrencyPrefix(text, normalizedRange)
  normalizedRange = expandRangeAcrossInlineCompositeTerms(text, normalizedRange)

  let previousEnd = -1
  let iterations = 0

  while (normalizedRange.end !== previousEnd && iterations < MAX_EXPANSION_ITERATIONS) {
    previousEnd = normalizedRange.end
    normalizedRange = expandRangeRightAcrossSeparator(text, normalizedRange)
    normalizedRange = expandRangeRightForPhraseClosure(text, normalizedRange)
    iterations += 1
  }

  normalizedRange = normalizeRangeToWordBoundaries(text, normalizedRange)
  normalizedRange = expandRangeLeftForCurrencyPrefix(text, normalizedRange)
  normalizedRange = expandRangeAcrossInlineCompositeTerms(text, normalizedRange)

  if (text.includes(HIGHLIGHT_STACK_SEPARATOR_CHAR)) {
    const constrainedRange = constrainRangeToPipeSegment(text, normalizedRange)
    if (!constrainedRange) return null

    normalizedRange = constrainedRange
  }

  const trimmedFinalBounds = trimHighlightEdgeNoiseBounds(
    text,
    normalizedRange.start,
    normalizedRange.end,
  )
  if (!trimmedFinalBounds) return null

  const finalRange: CvHighlightRange = {
    start: trimmedFinalBounds.start,
    end: trimmedFinalBounds.end,
    reason: normalizedRange.reason,
  }

  if (!hasMeaningfulHighlightContent(text.slice(finalRange.start, finalRange.end))) {
    return null
  }

  return finalRange
}

// ---------------------------------------------------------------------------
// Segmentation normalization
// ---------------------------------------------------------------------------

export function normalizeHighlightRangesForSegmentation(
  text: string,
  ranges: CvHighlightRange[],
): CvHighlightRange[] {
  const textLength = text.length
  const sortedRanges = ranges
    .map((range) => clampHighlightRange(textLength, range))
    .filter((range): range is CvHighlightRange => range !== null)
    .map((range) => normalizeHighlightSpanBoundaries(text, range))
    .filter((range): range is CvHighlightRange => range !== null)
    .sort((left, right) => left.start - right.start || left.end - right.end)

  return sortedRanges.reduce<CvHighlightRange[]>((acc, range) => {
    const previousRange = acc[acc.length - 1]

    if (!previousRange) {
      acc.push(range)
      return acc
    }

    if (
      previousRange.start === range.start
      && previousRange.end === range.end
      && previousRange.reason === range.reason
    ) {
      return acc
    }

    if (range.start < previousRange.end) {
      previousRange.end = Math.max(previousRange.end, range.end)
      return acc
    }

    if (shouldMergeAcrossIgnorableGap(text, previousRange, range)) {
      previousRange.end = range.end
      return acc
    }

    acc.push(range)
    return acc
  }, [])
}

// ---------------------------------------------------------------------------
// Editorial acceptance
// CHANGE #5 — isEditoriallyAcceptableHighlightRange now uses
// adaptiveCoverageThreshold() instead of the fixed constant, so short
// bullets are not unfairly penalised by the 55 % ceiling.
// ---------------------------------------------------------------------------

function isCompactMeasurableExperienceHighlight(text: string): boolean {
  if (text.trim().length > COMPACT_EXPERIENCE_HIGHLIGHT_MAX_LENGTH) return false

  return (
    /\d/.test(text)
    && /\b(reduced|increased|improved|grew|cut|saved|boosted|generated|delivered|optimized|accelerated|elevated|expanded|aumentei|reduzi|elevei|melhorei|otimizei|ampliei|gerei|entreguei|acelerei|expandi)\b/i.test(
      text,
    )
  )
}

export function isEditoriallyAcceptableHighlightRange(
  text: string,
  range: CvHighlightRange,
  section: 'summary' | 'experience',
): boolean {
  const textLength = Math.max(text.trim().length, 1)
  const coverage = (range.end - range.start) / textLength

  if (section === 'summary') {
    return coverage <= SUMMARY_MAX_HIGHLIGHT_COVERAGE
  }

  // CHANGE #5: adaptive ceiling based on bullet length.
  const ceiling = adaptiveCoverageThreshold(textLength)
  if (coverage <= ceiling) return true

  return (
    range.start === 0
    && range.end === text.length
    && isCompactMeasurableExperienceHighlight(text)
  )
}

// ---------------------------------------------------------------------------
// CHANGE #6 — local fallback highlight generator
// When the model returns no ranges for a bullet that clearly carries an
// action verb followed by (or adjacent to) a metric, this function
// synthesises a minimal span covering the action-verb–metric sequence.
// This is intentionally conservative: it only fires when the bullet passes
// isCompactMeasurableExperienceHighlight() AND the model produced zero ranges,
// and the resulting span must still pass editorial acceptance.
// ---------------------------------------------------------------------------

function buildFallbackHighlightRange(
  text: string,
): CvHighlightRange | null {
  // Locate the first action verb.
  const verbMatch = HIGHLIGHT_FALLBACK_ACTION_VERB_PATTERN.exec(text)
  if (!verbMatch) return null

  // Locate the first digit/metric in the text.
  const metricMatch = /\d/.exec(text)
  if (!metricMatch) return null

  // Span from verb start to a point shortly after the metric.
  const spanStart = verbMatch.index
  // Extend end to the first natural stop after the metric.
  const metricEnd = readShortContinuationEnd(text, metricMatch.index)
  if (metricEnd === null) return null

  const spanEnd = Math.min(metricEnd, text.length)
  if (spanEnd <= spanStart) return null

  const candidate: CvHighlightRange = { start: spanStart, end: spanEnd, reason: 'metric_impact' }
  return normalizeHighlightSpanBoundaries(text, candidate)
}

function applyFallbackHighlightsForUnmarkedItems(
  items: CvHighlightInputItem[],
  resolvedHighlights: CvResolvedHighlight[],
): CvResolvedHighlight[] {
  const highlightedIds = new Set(resolvedHighlights.map((h) => h.itemId))
  const supplementary: CvResolvedHighlight[] = []

  for (const item of items) {
    if (item.section !== 'experience') continue
    if (highlightedIds.has(item.itemId)) continue
    if (!isCompactMeasurableExperienceHighlight(item.text)) continue

    const fallbackRange = buildFallbackHighlightRange(item.text)
    if (!fallbackRange) continue
    if (!isEditoriallyAcceptableHighlightRange(item.text, fallbackRange, 'experience')) continue

    supplementary.push({
      itemId: item.itemId,
      section: 'experience',
      ranges: [fallbackRange],
    })
  }

  return [...resolvedHighlights, ...supplementary]
}

// ---------------------------------------------------------------------------
// Main validation + resolution entry point
// ---------------------------------------------------------------------------

export function validateAndResolveHighlights(
  items: CvHighlightInputItem[],
  raw: unknown,
): CvResolvedHighlight[] {
  if (items.length === 0) return []

  const itemMap = new Map(items.map((item) => [item.itemId, item]))
  const detectionItems = parseRawHighlightDetection(raw)
  const rangesByItemId = new Map<string, CvHighlightRange[]>()
  const resolved: CvResolvedHighlight[] = []

  detectionItems.forEach((candidate) => {
    if (!itemMap.has(candidate.itemId) || !Array.isArray(candidate.ranges)) return

    const existingRanges = rangesByItemId.get(candidate.itemId) ?? []
    existingRanges.push(...candidate.ranges)
    rangesByItemId.set(candidate.itemId, existingRanges)
  })

  rangesByItemId.forEach((candidateRanges, itemId) => {
    const item = itemMap.get(itemId)
    if (!item) return

    const normalizedRanges = normalizeHighlightRangesForSegmentation(item.text, candidateRanges)
    const validRanges = normalizedRanges.reduce<CvHighlightRange[]>((acc, range) => {
      const previousRange = acc[acc.length - 1]

      if (!isSafeNonOverlappingRange(range, item.text, previousRange)) return acc
      if (!isEditoriallyAcceptableHighlightRange(item.text, range, item.section)) return acc

      acc.push({ start: range.start, end: range.end, reason: range.reason })
      return acc
    }, [])

    if (validRanges.length === 0) return

    resolved.push({ itemId, section: item.section, ranges: validRanges })
  })

  // CHANGE #6: apply local fallback for experience bullets that the model
  // left completely unmarked but that clearly contain measurable impact.
  return applyFallbackHighlightsForUnmarkedItems(items, resolved)
}

// ---------------------------------------------------------------------------
// Accessors / renderers
// ---------------------------------------------------------------------------

export function getHighlightRangesForItem(
  resolvedHighlights: CvResolvedHighlight[] | undefined,
  itemId: string,
): CvHighlightRange[] {
  if (!resolvedHighlights) return []

  return resolvedHighlights
    .filter((highlight) => highlight.itemId === itemId)
    .flatMap((highlight) => highlight.ranges)
    .sort((left, right) => left.start - right.start || left.end - right.end)
}

export function segmentTextByHighlightRanges(
  text: string,
  ranges: CvHighlightRange[],
): CvHighlightTextSegment[] {
  const normalizedRanges = normalizeHighlightRangesForSegmentation(text, ranges)

  if (normalizedRanges.length === 0) {
    return [{ text, highlighted: false }]
  }

  const segments: CvHighlightTextSegment[] = []
  let cursor = 0

  normalizedRanges.forEach((range) => {
    if (cursor < range.start) {
      segments.push({ text: text.slice(cursor, range.start), highlighted: false })
    }

    segments.push({ text: text.slice(range.start, range.end), highlighted: true, reason: range.reason })
    cursor = range.end
  })

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false })
  }

  return segments
}

export function normalizeCvHighlightState(value: unknown): CvHighlightState | undefined {
  const result = cvHighlightStateSchema.safeParse(value)
  return result.success ? result.data : undefined
}
