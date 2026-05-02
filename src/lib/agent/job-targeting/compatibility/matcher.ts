import type {
  CatalogCategory,
  CatalogTerm,
  JobTargetingCatalogPack,
  LoadedJobTargetingCatalog,
} from '@/lib/agent/job-targeting/catalog/catalog-types'
import type {
  ClaimPermission,
  InternalEvidenceLevel,
  ProductEvidenceGroup,
  RequirementEvidence,
  RequirementEvidenceSource,
  RequirementImportance,
  RequirementKind,
} from '@/lib/agent/job-targeting/compatibility/types'

export const JOB_COMPATIBILITY_MATCHER_VERSION = 'job-compat-matcher-v1'

export const MATCHER_PRECEDENCE = [
  'exact',
  'catalog_alias',
  'catalog_anti_equivalence',
  'catalog_category',
  'llm_ambiguous',
  'fallback',
] as const satisfies readonly RequirementEvidenceSource[]

export interface MatcherRequirement {
  id: string
  text: string
  normalizedText?: string
  kind?: RequirementKind
  importance?: RequirementImportance
}

export interface MatcherResumeEvidence {
  id: string
  text: string
  normalizedText?: string
  section?: string
  sourceKind?: string
  cvPath?: string
}

export interface AmbiguityResolverDecision {
  productEvidenceGroup: ProductEvidenceGroup
  evidenceIds?: string[]
  confidence?: number
  rationaleCode?: string
}

export type RequirementEvidenceAmbiguityResolver = (input: {
  requirement: MatcherRequirement
  decomposedSignals: MatcherRequirement[]
  resumeEvidence: MatcherResumeEvidence[]
  catalog: LoadedJobTargetingCatalog
}) => AmbiguityResolverDecision | null | undefined

export interface ClassifyRequirementEvidenceInput {
  requirement: MatcherRequirement
  decomposedSignals?: MatcherRequirement[]
  resumeEvidence: MatcherResumeEvidence[]
  catalog: LoadedJobTargetingCatalog
  ambiguityResolver?: RequirementEvidenceAmbiguityResolver
}

type CatalogIndex = {
  catalogIds: string[]
  catalogVersions: Record<string, string>
  termsById: Map<string, IndexedTerm>
  categoriesById: Map<string, IndexedCategory>
  antiEquivalences: Array<{
    leftTermId: string
    rightTermId: string
  }>
}

type IndexedTerm = {
  catalogId: string
  term: CatalogTerm
  labelTokens: string[]
  aliasTokens: string[][]
}

type IndexedCategory = {
  catalogId: string
  category: CatalogCategory
}

type TermOccurrence = {
  term: IndexedTerm
  matchLevel: 'exact' | 'catalog_alias'
  evidence?: MatcherResumeEvidence
}

type MatchCandidate = {
  group: ProductEvidenceGroup
  source: RequirementEvidenceSource
  level: InternalEvidenceLevel
  permission: ClaimPermission
  evidence: MatcherResumeEvidence[]
  requirementTermIds: string[]
  resumeTermIds: string[]
  categoryIds: string[]
  prohibitedTerms: string[]
  confidence: number
  rationaleCode: string
  antiEquivalenceTermIds?: string[]
  ambiguityResolved?: boolean
}

const stopWords = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'com',
  'da',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'for',
  'in',
  'including',
  'of',
  'or',
  'para',
  'por',
  'related',
  'the',
  'to',
  'with',
])

export function classifyRequirementEvidence({
  requirement,
  decomposedSignals = [],
  resumeEvidence,
  catalog,
  ambiguityResolver,
}: ClassifyRequirementEvidenceInput): RequirementEvidence {
  const catalogIndex = buildCatalogIndex(catalog)
  const requirementText = requirement.normalizedText ?? requirement.text
  const requirementTerms = findTermOccurrences(requirementText, catalogIndex)
  const evidenceTerms = resumeEvidence.flatMap((item) => (
    findTermOccurrences(item.normalizedText ?? item.text, catalogIndex)
      .map((occurrence) => ({ ...occurrence, evidence: item }))
  ))

  const sameTermMatch = findSameTermMatch(requirementTerms, evidenceTerms, 'exact')
    ?? findSameTermMatch(requirementTerms, evidenceTerms, 'catalog_alias')
  const directTextMatch = requirementTerms.length === 0 || requirement.kind === 'education'
    ? findDirectTextMatch(requirement, resumeEvidence)
    : null
  const antiEquivalenceMatch = findAntiEquivalenceMatch(requirement, requirementTerms, evidenceTerms, catalogIndex)
  const categoryMatch = findCategoryMatch(requirement, requirementTerms, evidenceTerms, catalogIndex, 'catalog_category')
  const adjacentMatch = findCategoryMatch(requirement, requirementTerms, evidenceTerms, catalogIndex, 'adjacent_category')
  const resolverMatch = findResolverMatch({
    requirement,
    decomposedSignals,
    resumeEvidence,
    catalog,
    ambiguityResolver,
  })

  return toRequirementEvidence({
    requirement,
    catalogIndex,
    candidate: sameTermMatch
      ?? directTextMatch
      ?? antiEquivalenceMatch
      ?? categoryMatch
      ?? adjacentMatch
      ?? resolverMatch
      ?? unsupportedCandidate(requirement),
  })
}

function buildCatalogIndex(catalog: LoadedJobTargetingCatalog): CatalogIndex {
  const packs = [catalog.genericTaxonomy, ...catalog.domainPacks]
  const termsById = new Map<string, IndexedTerm>()
  const categoriesById = new Map<string, IndexedCategory>()
  const antiEquivalences: CatalogIndex['antiEquivalences'] = []

  packs.forEach((pack) => {
    pack.terms.forEach((term) => {
      termsById.set(term.id, {
        catalogId: pack.id,
        term,
        labelTokens: tokens(term.label),
        aliasTokens: term.aliases.map((alias) => tokens(alias.value)),
      })
    })

    pack.categories.forEach((category) => {
      categoriesById.set(category.id, {
        catalogId: pack.id,
        category,
      })
    })

    pack.antiEquivalences.forEach((antiEquivalence) => {
      antiEquivalences.push({
        leftTermId: antiEquivalence.leftTermId,
        rightTermId: antiEquivalence.rightTermId,
      })
    })
  })

  return {
    catalogIds: packs.map((pack) => pack.id),
    catalogVersions: versionsByPackId(packs),
    termsById,
    categoriesById,
    antiEquivalences,
  }
}

function versionsByPackId(packs: JobTargetingCatalogPack[]): Record<string, string> {
  return Object.fromEntries(packs.map((pack) => [pack.id, pack.version]))
}

function findTermOccurrences(value: string, catalogIndex: CatalogIndex): TermOccurrence[] {
  const valueTokens = tokens(value)
  const occurrences: TermOccurrence[] = []

  catalogIndex.termsById.forEach((term) => {
    if (containsTokenSequence(valueTokens, term.labelTokens)) {
      occurrences.push({ term, matchLevel: 'exact' })
      return
    }

    if (term.aliasTokens.some((aliasTokens) => containsTokenSequence(valueTokens, aliasTokens))) {
      occurrences.push({ term, matchLevel: 'catalog_alias' })
    }
  })

  return occurrences
}

function findSameTermMatch(
  requirementTerms: TermOccurrence[],
  evidenceTerms: TermOccurrence[],
  requestedLevel: 'exact' | 'catalog_alias',
): MatchCandidate | null {
  for (const requirementTerm of requirementTerms) {
    const match = evidenceTerms.find((evidenceTerm) => (
      evidenceTerm.term.term.id === requirementTerm.term.term.id
      && (
        requestedLevel === 'catalog_alias'
        || (requirementTerm.matchLevel === 'exact' && evidenceTerm.matchLevel === 'exact')
      )
    ))

    if (!match?.evidence) {
      continue
    }

    const source = requirementTerm.matchLevel === 'exact' && match.matchLevel === 'exact'
      ? 'exact'
      : 'catalog_alias'

    if (source !== requestedLevel) {
      continue
    }

    return {
      group: 'supported',
      source,
      level: source === 'exact' ? 'explicit' : 'catalog_alias',
      permission: source === 'exact' ? 'can_claim_directly' : 'can_claim_normalized',
      evidence: [match.evidence],
      requirementTermIds: [requirementTerm.term.term.id],
      resumeTermIds: [match.term.term.id],
      categoryIds: requirementTerm.term.term.categoryIds,
      prohibitedTerms: [],
      confidence: source === 'exact' ? 1 : 0.92,
      rationaleCode: source,
    }
  }

  return null
}

function findDirectTextMatch(
  requirement: MatcherRequirement,
  resumeEvidence: MatcherResumeEvidence[],
): MatchCandidate | null {
  if (requirement.kind === 'education') {
    return findEducationTextMatch(requirement, resumeEvidence)
  }

  const requirementTokens = meaningfulTokens(requirement.text)
  const match = resumeEvidence
    .map((item) => ({ item, score: textOverlapScore(requirementTokens, meaningfulTokens(item.text)) }))
    .filter(({ score }) => score.overlapCount > 0)
    .sort((left, right) => right.score.score - left.score.score)[0]

  if (!match) {
    return null
  }

  if (
    match.score.containsPhrase
    || (match.score.overlapCount >= 2 && match.score.score >= 0.5)
  ) {
      return {
        group: 'supported',
        source: 'exact',
        level: 'explicit',
        permission: 'can_claim_directly',
        evidence: [match.item],
        requirementTermIds: [],
        resumeTermIds: [],
        categoryIds: [],
        prohibitedTerms: [],
        confidence: Math.max(0.72, match.score.score),
      rationaleCode: 'direct_text_match',
    }
  }

  return null
}

function findEducationTextMatch(
  requirement: MatcherRequirement,
  resumeEvidence: MatcherResumeEvidence[],
): MatchCandidate | null {
  const educationEvidence = resumeEvidence.filter((item) => item.section === 'education')
  const alternatives = educationAlternatives(requirement.text)

  for (const item of educationEvidence) {
    const itemTokens = meaningfulTokens(item.text)
    const alternativeIndex = alternatives.findIndex((alternative) => (
      alternative.length > 0 && containsTokenSequence(itemTokens, alternative)
    ))

    if (alternativeIndex >= 0) {
      const isPrimaryAlternative = alternativeIndex === 0

      return {
        group: isPrimaryAlternative ? 'supported' : 'adjacent',
        source: isPrimaryAlternative ? 'exact' : 'composite_decomposition',
        level: isPrimaryAlternative ? 'explicit' : 'semantic_bridge_only',
        permission: isPrimaryAlternative ? 'can_claim_directly' : 'can_bridge_carefully',
        evidence: [item],
        requirementTermIds: [],
        resumeTermIds: [],
        categoryIds: [],
        prohibitedTerms: [],
        confidence: isPrimaryAlternative ? 0.86 : 0.62,
        rationaleCode: isPrimaryAlternative ? 'education_text_match' : 'education_related_match',
      }
    }

    const score = textOverlapScore(meaningfulTokens(requirement.text), itemTokens)

    if (score.overlapCount >= 1 && score.score >= 0.34) {
      return {
        group: 'supported',
        source: 'exact',
        level: 'explicit',
        permission: 'can_claim_directly',
        evidence: [item],
        requirementTermIds: [],
        resumeTermIds: [],
        categoryIds: [],
        prohibitedTerms: [],
        confidence: Math.max(0.7, score.score),
        rationaleCode: 'education_text_match',
      }
    }
  }

  return null
}

function findAntiEquivalenceMatch(
  requirement: MatcherRequirement,
  requirementTerms: TermOccurrence[],
  evidenceTerms: TermOccurrence[],
  catalogIndex: CatalogIndex,
): MatchCandidate | null {
  for (const antiEquivalence of catalogIndex.antiEquivalences) {
    const requirementTerm = requirementTerms.find((occurrence) => (
      occurrence.term.term.id === antiEquivalence.leftTermId
      || occurrence.term.term.id === antiEquivalence.rightTermId
    ))

    if (!requirementTerm) {
      continue
    }

    const oppositeTermId = requirementTerm.term.term.id === antiEquivalence.leftTermId
      ? antiEquivalence.rightTermId
      : antiEquivalence.leftTermId
    const evidenceTerm = evidenceTerms.find((occurrence) => occurrence.term.term.id === oppositeTermId)

    if (!evidenceTerm?.evidence) {
      continue
    }

    const hasAdjacentRelationship = hasCategoryRelationship(
      requirementTerm.term.term.categoryIds,
      evidenceTerm.term.term.categoryIds,
      catalogIndex,
      'adjacent_category',
    )
    const hasAdjacentTextSupport = hasResidualRequirementSupport(
      requirement,
      requirementTerm.term,
      evidenceTerm.evidence,
    )
    const shouldRemainAdjacent = hasAdjacentRelationship && hasAdjacentTextSupport

    return {
      group: shouldRemainAdjacent ? 'adjacent' : 'unsupported',
      source: 'catalog_anti_equivalence',
      level: shouldRemainAdjacent ? 'semantic_bridge_only' : 'unsupported_gap',
      permission: shouldRemainAdjacent ? 'can_mention_as_related_context' : 'must_not_claim',
      evidence: [evidenceTerm.evidence],
      requirementTermIds: [requirementTerm.term.term.id],
      resumeTermIds: [evidenceTerm.term.term.id],
      categoryIds: [...requirementTerm.term.term.categoryIds, ...evidenceTerm.term.term.categoryIds],
      prohibitedTerms: shouldRemainAdjacent ? [] : [requirementTerm.term.term.label],
      confidence: shouldRemainAdjacent ? 0.56 : 0.98,
      rationaleCode: shouldRemainAdjacent
        ? 'catalog_anti_equivalence_adjacent'
        : 'catalog_anti_equivalence_blocked',
      antiEquivalenceTermIds: [requirementTerm.term.term.id, evidenceTerm.term.term.id],
    }
  }

  return null
}

function hasResidualRequirementSupport(
  requirement: MatcherRequirement,
  requirementTerm: IndexedTerm,
  evidence: MatcherResumeEvidence,
): boolean {
  const termTokens = new Set(requirementTerm.labelTokens)
  const residualRequirementTokens = meaningfulTokens(requirement.text)
    .filter((token) => !termTokens.has(token))

  if (residualRequirementTokens.length === 0) {
    return true
  }

  const score = textOverlapScore(residualRequirementTokens, meaningfulTokens(evidence.text))

  return score.overlapCount >= 1 && score.score >= 0.34
}

function findCategoryMatch(
  requirement: MatcherRequirement,
  requirementTerms: TermOccurrence[],
  evidenceTerms: TermOccurrence[],
  catalogIndex: CatalogIndex,
  level: 'catalog_category' | 'adjacent_category',
): MatchCandidate | null {
  for (const requirementTerm of requirementTerms) {
    const match = evidenceTerms.find((evidenceTerm) => (
      hasCategoryRelationship(
        requirementTerm.term.term.categoryIds,
        evidenceTerm.term.term.categoryIds,
        catalogIndex,
        level,
      )
    ))

    if (!match?.evidence || !hasResidualRequirementSupport(requirement, requirementTerm.term, match.evidence)) {
      continue
    }

    return {
      group: level === 'catalog_category' ? 'supported' : 'adjacent',
      source: 'catalog_category',
      level: level === 'catalog_category' ? 'category_equivalent' : 'semantic_bridge_only',
      permission: level === 'catalog_category' ? 'can_claim_normalized' : 'can_bridge_carefully',
      evidence: [match.evidence],
      requirementTermIds: [requirementTerm.term.term.id],
      resumeTermIds: [match.term.term.id],
      categoryIds: [...requirementTerm.term.term.categoryIds, ...match.term.term.categoryIds],
      prohibitedTerms: [],
      confidence: level === 'catalog_category' ? 0.82 : 0.58,
      rationaleCode: level,
    }
  }

  return null
}

function hasCategoryRelationship(
  leftCategoryIds: string[],
  rightCategoryIds: string[],
  catalogIndex: CatalogIndex,
  level: 'catalog_category' | 'adjacent_category',
): boolean {
  return leftCategoryIds.some((leftCategoryId) => (
    rightCategoryIds.some((rightCategoryId) => (
      categoryRelatesTo(leftCategoryId, rightCategoryId, catalogIndex, level)
      || categoryRelatesTo(rightCategoryId, leftCategoryId, catalogIndex, level)
    ))
  ))
}

function categoryRelatesTo(
  leftCategoryId: string,
  rightCategoryId: string,
  catalogIndex: CatalogIndex,
  level: 'catalog_category' | 'adjacent_category',
): boolean {
  const category = catalogIndex.categoriesById.get(leftCategoryId)?.category

  if (!category) {
    return false
  }

  const relationships = level === 'catalog_category'
    ? category.equivalentCategoryIds
    : category.adjacentCategoryIds

  return relationships.some((relationship) => relationship.categoryId === rightCategoryId)
}

function findResolverMatch({
  requirement,
  decomposedSignals,
  resumeEvidence,
  catalog,
  ambiguityResolver,
}: Required<Pick<ClassifyRequirementEvidenceInput, 'requirement' | 'resumeEvidence' | 'catalog'>>
  & Pick<ClassifyRequirementEvidenceInput, 'decomposedSignals' | 'ambiguityResolver'>): MatchCandidate | null {
  const decision = ambiguityResolver?.({
    requirement,
    decomposedSignals: decomposedSignals ?? [],
    resumeEvidence,
    catalog,
  })

  if (!decision) {
    return null
  }

  const evidenceById = new Map(resumeEvidence.map((item) => [item.id, item]))
  const matchedEvidence = (decision.evidenceIds ?? [])
    .map((id) => evidenceById.get(id))
    .filter((item): item is MatcherResumeEvidence => Boolean(item))

  return {
    group: decision.productEvidenceGroup,
    source: 'llm_ambiguous',
    level: evidenceLevelForGroup(decision.productEvidenceGroup),
    permission: permissionForGroup(decision.productEvidenceGroup),
    evidence: matchedEvidence,
    requirementTermIds: [],
    resumeTermIds: [],
    categoryIds: [],
    prohibitedTerms: [],
    confidence: decision.confidence ?? 0.5,
    rationaleCode: decision.rationaleCode ?? 'llm_ambiguity_resolved',
    ambiguityResolved: true,
  }
}

function unsupportedCandidate(requirement: MatcherRequirement): MatchCandidate {
  return {
    group: 'unsupported',
    source: 'fallback',
    level: 'unsupported_gap',
    permission: 'must_not_claim',
    evidence: [],
    requirementTermIds: [],
    resumeTermIds: [],
    categoryIds: [],
    prohibitedTerms: [requirement.text],
    confidence: 0,
    rationaleCode: 'unsupported_fallback',
  }
}

function toRequirementEvidence({
  requirement,
  catalogIndex,
  candidate,
}: {
  requirement: MatcherRequirement
  catalogIndex: CatalogIndex
  candidate: MatchCandidate
}): RequirementEvidence {
  const requirementTermLabels = labelsForTermIds(candidate.requirementTermIds, catalogIndex)
  const resumeTermLabels = labelsForTermIds(candidate.resumeTermIds, catalogIndex)
  const extractedSignals = unique([
    ...requirementTermLabels,
    ...(requirementTermLabels.length === 0 ? [requirement.text] : []),
  ])
  const matchedResumeTerms = unique([
    ...resumeTermLabels,
    ...candidate.evidence.map((item) => item.text),
  ])
  const catalogTermIds = unique([...candidate.requirementTermIds, ...candidate.resumeTermIds])

  return {
    id: requirement.id,
    originalRequirement: requirement.text,
    normalizedRequirement: requirement.normalizedText ?? normalizeTextForAudit(requirement.text),
    extractedSignals,
    kind: requirement.kind ?? 'unknown',
    importance: requirement.importance ?? 'secondary',
    productGroup: candidate.group,
    evidenceLevel: candidate.level,
    rewritePermission: candidate.permission,
    matchedResumeTerms,
    supportingResumeSpans: candidate.evidence.map((item) => ({
      id: item.id,
      text: item.text,
      ...(item.section === undefined ? {} : { section: item.section }),
      ...(item.sourceKind === undefined ? {} : { sourceKind: item.sourceKind }),
      ...(item.cvPath === undefined ? {} : { cvPath: item.cvPath }),
    })),
    confidence: candidate.confidence,
    rationale: candidate.rationaleCode,
    source: candidate.source,
    catalogTermIds,
    catalogCategoryIds: unique(candidate.categoryIds),
    prohibitedTerms: unique(candidate.prohibitedTerms),
    audit: {
      matcherVersion: JOB_COMPATIBILITY_MATCHER_VERSION,
      precedence: MATCHER_PRECEDENCE,
      catalogIds: catalogIndex.catalogIds,
      catalogVersions: catalogIndex.catalogVersions,
      catalogTermIds,
      catalogCategoryIds: unique(candidate.categoryIds),
      ...(candidate.antiEquivalenceTermIds === undefined
        ? {}
        : { antiEquivalenceTermIds: unique(candidate.antiEquivalenceTermIds) }),
      ...(candidate.ambiguityResolved === undefined ? {} : { ambiguityResolved: candidate.ambiguityResolved }),
    },
  }
}

function permissionForGroup(group: ProductEvidenceGroup): ClaimPermission {
  if (group === 'supported') {
    return 'can_claim_normalized'
  }

  if (group === 'adjacent') {
    return 'can_bridge_carefully'
  }

  return 'must_not_claim'
}

function evidenceLevelForGroup(group: ProductEvidenceGroup): InternalEvidenceLevel {
  if (group === 'supported') {
    return 'strong_contextual_inference'
  }

  if (group === 'adjacent') {
    return 'semantic_bridge_only'
  }

  return 'unsupported_gap'
}

function labelsForTermIds(termIds: string[], catalogIndex: CatalogIndex): string[] {
  return termIds
    .map((termId) => catalogIndex.termsById.get(termId)?.term.label)
    .filter((label): label is string => Boolean(label))
}

function normalizeTextForAudit(value: string): string {
  return tokens(value).join(' ')
}

function educationAlternatives(value: string): string[][] {
  return value
    .replace(/\bor\b/giu, ',')
    .split(',')
    .map((item) => item.replace(/\b(?:degree|bacharelado|bachelor|licenciatura|technologist)\s+(?:in|em)?\b/giu, ' '))
    .map(meaningfulTokens)
    .filter((item) => item.length > 0)
}

function textOverlapScore(
  requirementTokens: string[],
  evidenceTokens: string[],
): {
  overlapCount: number
  score: number
  containsPhrase: boolean
} {
  const uniqueRequirementTokens = unique(requirementTokens)
  const uniqueEvidenceTokens = unique(evidenceTokens)
  const overlapCount = uniqueRequirementTokens
    .filter((token) => uniqueEvidenceTokens.includes(token))
    .length
  const denominator = Math.max(1, Math.min(uniqueRequirementTokens.length, uniqueEvidenceTokens.length))

  return {
    overlapCount,
    score: overlapCount / denominator,
    containsPhrase: containsTokenSequence(uniqueRequirementTokens, uniqueEvidenceTokens)
      || containsTokenSequence(uniqueEvidenceTokens, uniqueRequirementTokens),
  }
}

function containsTokenSequence(sourceTokens: string[], candidateTokens: string[]): boolean {
  if (candidateTokens.length === 0 || candidateTokens.length > sourceTokens.length) {
    return false
  }

  return sourceTokens.some((_, index) => (
    candidateTokens.every((token, offset) => sourceTokens[index + offset] === token)
  ))
}

function meaningfulTokens(value: string): string[] {
  return tokens(value).filter((token) => !stopWords.has(token))
}

function tokens(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map(stemToken)
}

function stemToken(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) {
    return token.slice(0, -3)
  }

  if (token.length > 6 && token.endsWith('tion')) {
    return token.slice(0, -3)
  }

  if (token.length > 4 && token.endsWith('ed')) {
    return token.slice(0, -2)
  }

  if (token.length > 5 && token.endsWith('e')) {
    return token.slice(0, -1)
  }

  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1)
  }

  return token
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}
