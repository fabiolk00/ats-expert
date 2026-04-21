import type { RewriteValidationResult } from '@/types/agent'
import type { CVState } from '@/types/cv'

import type { AtsQualityGateResult } from './types'
import type { RawAtsScoreSnapshot } from './raw-score'

type OptimizationSummary = {
  changedSections: Array<'summary' | 'experience' | 'skills' | 'education' | 'certifications'>
  notes: string[]
  keywordCoverageImprovement?: string[]
}

type RequiredSection = 'summary' | 'experience' | 'skills' | 'education'

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateTokenSimilarity(left: string, right: string): number {
  const leftTokens = normalizeForComparison(left).split(' ').filter(Boolean)
  const rightTokens = normalizeForComparison(right).split(' ').filter(Boolean)

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

  return (2 * overlap) / (leftTokens.length + rightTokens.length)
}

function countSummaryWords(summary: string): number {
  return summary
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

function hasSummarySectionLabel(summary: string): boolean {
  return /^(?:resumo profissional|professional summary|summary|resumo)\s*[:\-–]/i.test(summary.trim())
}

function countRepeatedSummaryPhrases(summary: string): number {
  const phrases = summary
    .split(/[.!?;]+|,(?=\s+[A-ZÀ-Ý])/u)
    .map((phrase) => normalizeForComparison(phrase))
    .filter((phrase) => phrase.split(' ').length >= 3)

  const counts = new Map<string, number>()
  phrases.forEach((phrase) => {
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
  })

  return Array.from(counts.values()).filter((count) => count > 1).length
}

function isStructurallyNoisySummary(summary: string): boolean {
  const normalized = normalizeForComparison(summary)

  if (!normalized) {
    return true
  }

  if (hasSummarySectionLabel(summary)) {
    return true
  }

  if (countSummaryWords(summary) > 48) {
    return true
  }

  if (countRepeatedSummaryPhrases(summary) > 0) {
    return true
  }

  return /(business intelligence|engenheiro de dados|analytics engineer|analista de dados)(?:\s+\S+){0,3}\s+\1/i.test(normalized)
}

function hasRequiredSection(cvState: CVState, section: RequiredSection): boolean {
  switch (section) {
    case 'summary':
      return cvState.summary.trim().length > 0
    case 'experience':
      return cvState.experience.length > 0
    case 'skills':
      return cvState.skills.filter((skill) => skill.trim().length > 0).length > 0
    case 'education':
      return cvState.education.length > 0
  }
}

function requiredSectionsPresent(cvState: CVState): RequiredSection[] {
  return (['summary', 'experience', 'skills', 'education'] as const)
    .filter((section) => hasRequiredSection(cvState, section))
}

export function evaluateAtsQualityGates(input: {
  originalCvState: CVState
  optimizedCvState: CVState
  originalRaw: RawAtsScoreSnapshot
  optimizedRaw: RawAtsScoreSnapshot
  rewriteValidation?: RewriteValidationResult
  optimizationSummary?: OptimizationSummary
}): AtsQualityGateResult {
  const {
    originalCvState,
    optimizedCvState,
    originalRaw,
    optimizedRaw,
    rewriteValidation,
    optimizationSummary,
  } = input

  const originalSummary = originalCvState.summary.trim()
  const optimizedSummary = optimizedCvState.summary.trim()
  const summaryChanged = optimizedSummary !== originalSummary
  const summaryMeaningfullyDifferent = calculateTokenSimilarity(originalSummary, optimizedSummary) < 0.88
  const summaryStructurallyHealthy =
    countSummaryWords(optimizedSummary) >= 8
    && !isStructurallyNoisySummary(optimizedSummary)
  const keywordSectionsChanged = optimizationSummary?.changedSections.some((section) =>
    section === 'summary' || section === 'experience' || section === 'skills') ?? false
  const explicitKeywordImprovement = (optimizationSummary?.keywordCoverageImprovement?.length ?? 0) > 0
  const hasExplicitKeywordSignal = optimizationSummary?.keywordCoverageImprovement !== undefined
  const fallbackKeywordImprovement = optimizedRaw.score.breakdown.keywords > originalRaw.score.breakdown.keywords
    && (
      keywordSectionsChanged
      || optimizedCvState.skills.length > originalCvState.skills.length
    )

  const beforeRequiredSections = requiredSectionsPresent(originalCvState)
  const afterRetainsRequiredSections = beforeRequiredSections.every((section) => hasRequiredSection(optimizedCvState, section))
  const afterHasAllCoreSections = (['summary', 'experience', 'skills', 'education'] as const)
    .every((section) => hasRequiredSection(optimizedCvState, section))

  return {
    improvedSummaryClarity: summaryChanged
      && summaryMeaningfullyDifferent
      && summaryStructurallyHealthy,
    improvedKeywordVisibility: explicitKeywordImprovement
      || (!hasExplicitKeywordSignal && fallbackKeywordImprovement),
    noFactualDrift: rewriteValidation?.valid === true,
    noLossOfRequiredSections: afterRetainsRequiredSections && afterHasAllCoreSections,
    noReadabilityRegression: optimizedRaw.score.breakdown.format >= originalRaw.score.breakdown.format
      && optimizedRaw.score.breakdown.contact >= originalRaw.score.breakdown.contact,
    noUnsupportedClaimsIntroduced: rewriteValidation?.valid === true,
  }
}

export function buildWithholdReasons(input: {
  qualityGates: AtsQualityGateResult
  confidence: 'low' | 'medium' | 'high'
  originalRaw: RawAtsScoreSnapshot
  optimizedRaw: RawAtsScoreSnapshot
}): string[] {
  const reasons: string[] = []
  const materiallyLowerInternalScore = input.optimizedRaw.score.total + 3 < input.originalRaw.score.total
  const regressedStructuralSignals =
    input.optimizedRaw.score.breakdown.structure < input.originalRaw.score.breakdown.structure
    || input.optimizedRaw.score.breakdown.keywords < input.originalRaw.score.breakdown.keywords

  if (input.confidence === 'low' && (materiallyLowerInternalScore || regressedStructuralSignals)) {
    reasons.push('Low scoring confidence combined with contradictory internal ATS signals.')
  }

  if (!input.qualityGates.improvedSummaryClarity) {
    reasons.push('Summary clarity did not improve enough to justify a final readiness score.')
  }

  if (!input.qualityGates.improvedKeywordVisibility) {
    reasons.push('Keyword visibility did not improve enough to justify a final readiness score.')
  }

  if (!input.qualityGates.noFactualDrift) {
    reasons.push('Factual validation did not pass.')
  }

  if (!input.qualityGates.noLossOfRequiredSections) {
    reasons.push('The optimized resume lost required ATS sections or left them ambiguous.')
  }

  if (!input.qualityGates.noReadabilityRegression) {
    reasons.push('The optimized resume regressed on ATS readability signals.')
  }

  if (!input.qualityGates.noUnsupportedClaimsIntroduced) {
    reasons.push('The optimized resume introduced unsupported claims.')
  }

  return reasons
}
