import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo } from '@/lib/observability/structured-log'

import { ATS_READINESS_CONTRACT_VERSION } from './types'
import type { AtsReadinessDecisionLog, AtsReadinessScoreContract } from './types'

type AtsReadinessCompatSurface =
  | 'session_response'
  | 'agent_done_chunk'

export function serializeWithholdReasons(reasons: string[]): string {
  return JSON.stringify([...reasons])
}

export function buildAtsReadinessDecisionLog(contract: AtsReadinessScoreContract): AtsReadinessDecisionLog {
  const rawDecreased = contract.rawInternalScoreAfter < contract.rawInternalScoreBefore
  const displayedAfter = contract.displayedReadinessScoreAfter
  const displayedMonotonicityProtected = contract.display.mode === 'exact'
    ? displayedAfter !== null
      && contract.rawInternalScoreAfter < contract.displayedReadinessScoreBefore
      && displayedAfter === contract.displayedReadinessScoreBefore
    : (contract.display.estimatedRangeMin ?? 0) >= contract.displayedReadinessScoreBefore
  const appliedFloor89 = contract.display.mode === 'exact'
    ? displayedAfter !== null
      && displayedAfter === 89
      && displayedAfter > contract.displayedReadinessScoreBefore
      && displayedAfter > contract.rawInternalScoreAfter
    : (contract.display.estimatedRangeMin ?? 0) === 89
  const appliedCap95 = contract.display.mode === 'exact'
    ? displayedAfter !== null
      && displayedAfter === 95
      && Math.max(contract.displayedReadinessScoreBefore, contract.rawInternalScoreAfter, 89) > 95
    : (contract.display.estimatedRangeMax ?? 0) === 95
  const withheldConvertedToRange = contract.scoreStatus === 'estimated_range'
    && contract.withholdReasons.length > 0
  const estimatedRangeMax = contract.display.estimatedRangeMax

  const exactScore = contract.display.exactScore
  const estimatedRangeMin = contract.display.estimatedRangeMin

  return {
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
    workflowMode: contract.workflowMode,
    evaluationStage: contract.evaluationStage,
    rawInternalScoreBefore: contract.rawInternalScoreBefore,
    rawInternalScoreAfter: contract.rawInternalScoreAfter,
    displayedReadinessScoreBefore: contract.displayedReadinessScoreBefore,
    displayedReadinessScoreAfter: contract.displayedReadinessScoreAfter,
    scoreStatus: contract.scoreStatus,
    displayMode: contract.display.mode,
    exactScore,
    estimatedRangeMin,
    estimatedRangeMax,
    confidence: contract.rawInternalConfidence,
    appliedFloor89,
    appliedCap95,
    rawDecreased,
    displayedMonotonicityProtected,
    withheldConvertedToRange,
    withholdReasons: [...contract.withholdReasons],
    qualityGates: { ...contract.qualityGates },
  }
}

export function recordAtsReadinessDecision(contract: AtsReadinessScoreContract): void {
  const decision = buildAtsReadinessDecisionLog(contract)

  logInfo('ats_readiness.decision', {
    contractVersion: decision.contractVersion,
    workflowMode: decision.workflowMode,
    evaluationStage: decision.evaluationStage,
    rawInternalScoreBefore: decision.rawInternalScoreBefore,
    rawInternalScoreAfter: decision.rawInternalScoreAfter,
    displayedReadinessScoreBefore: decision.displayedReadinessScoreBefore,
    displayedReadinessScoreAfter: decision.displayedReadinessScoreAfter,
    scoreStatus: decision.scoreStatus,
    displayMode: decision.displayMode,
    exactScore: decision.exactScore,
    estimatedRangeMin: decision.estimatedRangeMin,
    estimatedRangeMax: decision.estimatedRangeMax,
    confidence: decision.confidence,
    appliedFloor89: decision.appliedFloor89,
    appliedCap95: decision.appliedCap95,
    rawDecreased: decision.rawDecreased,
    displayedMonotonicityProtected: decision.displayedMonotonicityProtected,
    withheldConvertedToRange: decision.withheldConvertedToRange,
    withholdReasons: serializeWithholdReasons(decision.withholdReasons),
    withholdReasonCount: decision.withholdReasons.length,
    gateImprovedSummaryClarity: decision.qualityGates.improvedSummaryClarity,
    gateImprovedKeywordVisibility: decision.qualityGates.improvedKeywordVisibility,
    gateNoFactualDrift: decision.qualityGates.noFactualDrift,
    gateNoLossOfRequiredSections: decision.qualityGates.noLossOfRequiredSections,
    gateNoReadabilityRegression: decision.qualityGates.noReadabilityRegression,
    gateNoUnsupportedClaimsIntroduced: decision.qualityGates.noUnsupportedClaimsIntroduced,
  })

  recordMetricCounter(
    decision.scoreStatus === 'final'
      ? 'architecture.ats_readiness.finalized'
      : 'architecture.ats_readiness.estimated_range',
    {
      contractVersion: decision.contractVersion,
      workflowMode: decision.workflowMode,
      confidence: decision.confidence,
      evaluationStage: decision.evaluationStage,
    },
  )

  if (decision.withheldConvertedToRange) {
    recordMetricCounter('architecture.ats_readiness.withheld_converted_to_range', {
      contractVersion: decision.contractVersion,
      evaluationStage: decision.evaluationStage,
    })
    recordMetricCounter('architecture.ats_readiness.withheld', {
      contractVersion: decision.contractVersion,
      workflowMode: decision.workflowMode,
      confidence: decision.confidence,
      evaluationStage: decision.evaluationStage,
    })
  }

  if (decision.appliedFloor89) {
    recordMetricCounter('architecture.ats_readiness.floor_89_applied', {
      contractVersion: decision.contractVersion,
      evaluationStage: decision.evaluationStage,
    })
  }

  if (decision.confidence === 'low') {
    recordMetricCounter('architecture.ats_readiness.low_confidence', {
      contractVersion: decision.contractVersion,
      evaluationStage: decision.evaluationStage,
      scoreStatus: decision.scoreStatus,
    })
  }

  if (decision.rawDecreased && decision.displayedMonotonicityProtected) {
    recordMetricCounter('architecture.ats_readiness.raw_decreased_display_protected', {
      contractVersion: decision.contractVersion,
      evaluationStage: decision.evaluationStage,
    })
  }
}

export function recordAtsReadinessCompatFieldEmission(input: {
  surface: AtsReadinessCompatSurface
  workflowMode?: string
  hasCanonicalReadiness: boolean
  contractVersion?: number
}): void {
  const metric = input.surface === 'session_response'
    ? 'architecture.ats_readiness.compat_session_ats_score_emitted'
    : 'architecture.ats_readiness.compat_agent_done_chunk_ats_score_emitted'

  logInfo('ats_readiness.compat_field_emitted', {
    contractVersion: input.contractVersion ?? ATS_READINESS_CONTRACT_VERSION,
    surface: input.surface,
    workflowMode: input.workflowMode,
    hasCanonicalReadiness: input.hasCanonicalReadiness,
  })

  recordMetricCounter(metric, {
    contractVersion: input.contractVersion ?? ATS_READINESS_CONTRACT_VERSION,
    surface: input.surface,
    workflowMode: input.workflowMode,
    hasCanonicalReadiness: input.hasCanonicalReadiness,
  })
}
