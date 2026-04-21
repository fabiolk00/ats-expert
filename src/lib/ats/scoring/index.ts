import type { RewriteValidationResult } from '@/types/agent'
import type { CVState } from '@/types/cv'

import { deriveAtsReadinessConfidence } from './confidence'
import {
  bandFromScore,
  buildAtsReadinessDisplayContract,
  buildEstimatedReadinessRange,
  clampDisplayedReadinessScore,
} from './display-score'
import { recordAtsReadinessDecision } from './observability'
import { evaluateAtsQualityGates, buildWithholdReasons } from './quality-gates'
import { computeRawAtsScoreSnapshot } from './raw-score'
import { ATS_READINESS_CONTRACT_VERSION } from './types'
import type { AtsReadinessScoreContract } from './types'

// Canonical ATS Readiness scoring contract for product surfaces:
// - rawInternalScore* preserves the underlying heuristic ATS score for diagnostics and experiments
// - displayedReadinessScore* is the only product-facing score users should see in ATS enhancement flows
// - post-enhancement display is monotonic, quality-gated, and floored at 89 when the optimized result is safe to show
// - internal heuristic ATS diagnostics must never be treated as the ATS Readiness product truth

type OptimizationSummary = {
  changedSections: Array<'summary' | 'experience' | 'skills' | 'education' | 'certifications'>
  notes: string[]
  keywordCoverageImprovement?: string[]
}

function buildDefaultQualityGates(): AtsReadinessScoreContract['qualityGates'] {
  return {
    improvedSummaryClarity: false,
    improvedKeywordVisibility: false,
    noFactualDrift: false,
    noLossOfRequiredSections: false,
    noReadabilityRegression: false,
    noUnsupportedClaimsIntroduced: false,
  }
}

export function buildBaselineAtsReadinessContract(input: {
  cvState: CVState
}): AtsReadinessScoreContract {
  const rawBefore = computeRawAtsScoreSnapshot(input.cvState)
  const confidence = deriveAtsReadinessConfidence(input.cvState, rawBefore)
  const displayedBefore = clampDisplayedReadinessScore(rawBefore.score.total)

  const contract: AtsReadinessScoreContract = {
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
    workflowMode: 'ats_enhancement',
    evaluationStage: 'baseline_only',
    productLabel: 'ATS Readiness Score',
    rawInternalScoreSource: 'scoreATS.total',
    rawInternalScoreBefore: rawBefore.score.total,
    rawInternalScoreAfter: rawBefore.score.total,
    rawInternalConfidence: confidence,
    displayedReadinessScoreBefore: displayedBefore,
    displayedReadinessScoreAfter: null,
    displayedReadinessBandBefore: bandFromScore(displayedBefore),
    displayedReadinessBandAfter: null,
    displayedReadinessScoreCurrent: displayedBefore,
    displayedReadinessBandCurrent: bandFromScore(displayedBefore),
    scoreStatus: 'final',
    display: buildAtsReadinessDisplayContract({
      scoreStatus: 'final',
      exactScore: displayedBefore,
      estimatedRangeMin: null,
      estimatedRangeMax: null,
      confidence,
    }),
    qualityGates: buildDefaultQualityGates(),
    withholdReasons: [],
    rawScoreBefore: rawBefore.score,
    rawScoreAfter: rawBefore.score,
  }

  recordAtsReadinessDecision(contract)

  return contract
}

export function buildAtsReadinessContractForEnhancement(input: {
  originalCvState: CVState
  optimizedCvState: CVState
  rewriteValidation?: RewriteValidationResult
  optimizationSummary?: OptimizationSummary
  previousContract?: AtsReadinessScoreContract
}): AtsReadinessScoreContract {
  const originalRaw = computeRawAtsScoreSnapshot(input.originalCvState)
  const optimizedRaw = computeRawAtsScoreSnapshot(input.optimizedCvState)
  const confidence = deriveAtsReadinessConfidence(input.optimizedCvState, optimizedRaw)
  const qualityGates = evaluateAtsQualityGates({
    originalCvState: input.originalCvState,
    optimizedCvState: input.optimizedCvState,
    originalRaw,
    optimizedRaw,
    rewriteValidation: input.rewriteValidation,
    optimizationSummary: input.optimizationSummary,
  })

  const displayedBefore = clampDisplayedReadinessScore(
    input.previousContract?.displayedReadinessScoreAfter
    ?? input.previousContract?.displayedReadinessScoreBefore
    ?? originalRaw.score.total,
  )

  const withholdReasons = buildWithholdReasons({
    qualityGates,
    confidence,
    originalRaw,
    optimizedRaw,
  })

  const canDisplayOptimizedScore = withholdReasons.length === 0
  const exactDisplayedAfter = canDisplayOptimizedScore
    ? clampDisplayedReadinessScore(Math.max(
        displayedBefore,
        optimizedRaw.score.total,
        89,
      ))
    : null
  const estimatedRange = canDisplayOptimizedScore
    ? null
    : buildEstimatedReadinessRange({
        displayedReadinessScoreBefore: displayedBefore,
        rawInternalScoreAfter: optimizedRaw.score.total,
      })
  const displayedAfter = exactDisplayedAfter ?? estimatedRange?.min ?? displayedBefore
  const scoreStatus = exactDisplayedAfter === null ? 'estimated_range' : 'final'

  const contract: AtsReadinessScoreContract = {
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
    workflowMode: 'ats_enhancement',
    evaluationStage: 'post_enhancement',
    productLabel: 'ATS Readiness Score',
    rawInternalScoreSource: 'scoreATS.total',
    rawInternalScoreBefore: originalRaw.score.total,
    rawInternalScoreAfter: optimizedRaw.score.total,
    rawInternalConfidence: confidence,
    displayedReadinessScoreBefore: displayedBefore,
    displayedReadinessScoreAfter: displayedAfter,
    displayedReadinessBandBefore: bandFromScore(displayedBefore),
    displayedReadinessBandAfter: bandFromScore(displayedAfter),
    displayedReadinessScoreCurrent: displayedAfter,
    displayedReadinessBandCurrent: bandFromScore(displayedAfter),
    scoreStatus,
    display: buildAtsReadinessDisplayContract({
      scoreStatus,
      exactScore: exactDisplayedAfter,
      estimatedRangeMin: estimatedRange?.min ?? null,
      estimatedRangeMax: estimatedRange?.max ?? null,
      confidence,
    }),
    qualityGates,
    withholdReasons,
    rawScoreBefore: originalRaw.score,
    rawScoreAfter: optimizedRaw.score,
  }

  recordAtsReadinessDecision(contract)

  return contract
}

export function resolveDisplayedReadinessScore(
  contract?: AtsReadinessScoreContract,
): number | undefined {
  if (!contract) {
    return undefined
  }

  return contract.displayedReadinessScoreCurrent
}

export { ATS_READINESS_CONTRACT_VERSION } from './types'
export { buildAtsReadinessDecisionLog, recordAtsReadinessDecision, serializeWithholdReasons } from './observability'
export { normalizePersistedAtsReadiness, resolveDisplayedReadinessScoreForSession, resolveSessionAtsReadiness } from './session-readiness'
