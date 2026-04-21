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

  const summaryChanged = optimizedCvState.summary.trim() !== originalCvState.summary.trim()
  const summaryLongEnough = optimizedCvState.summary.trim().length >= Math.max(80, originalCvState.summary.trim().length)
  const keywordSectionsChanged = optimizationSummary?.changedSections.some((section) =>
    section === 'summary' || section === 'experience' || section === 'skills') ?? false
  const explicitKeywordImprovement = (optimizationSummary?.keywordCoverageImprovement?.length ?? 0) > 0

  const beforeRequiredSections = requiredSectionsPresent(originalCvState)
  const afterRetainsRequiredSections = beforeRequiredSections.every((section) => hasRequiredSection(optimizedCvState, section))
  const afterHasAllCoreSections = (['summary', 'experience', 'skills', 'education'] as const)
    .every((section) => hasRequiredSection(optimizedCvState, section))

  return {
    improvedSummaryClarity: (summaryChanged && summaryLongEnough)
      || (summaryChanged && optimizedCvState.summary.trim().length > originalCvState.summary.trim().length),
    improvedKeywordVisibility: explicitKeywordImprovement
      || (
        optimizedRaw.score.breakdown.keywords >= originalRaw.score.breakdown.keywords
        && (
          keywordSectionsChanged
          || optimizedCvState.skills.length >= originalCvState.skills.length
        )
      ),
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
