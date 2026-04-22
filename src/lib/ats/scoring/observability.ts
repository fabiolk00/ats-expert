import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo, logWarn } from '@/lib/observability/structured-log'

import { ATS_SUMMARY_CLARITY_WITHHOLD_REASON } from './quality-gates'
import { ATS_READINESS_CONTRACT_VERSION } from './types'
import type {
  AtsReadinessDecisionLog,
  AtsReadinessScoreContract,
  AtsSummaryClarityOutcomeLog,
  AtsSummaryRecoveryKind,
} from './types'

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

export function buildAtsSummaryClarityOutcomeLog(input: {
  sessionId: string
  userId?: string
  summaryRecoveryKind: AtsSummaryRecoveryKind | null
  summaryWasTouchedByRewrite: boolean
  contract: AtsReadinessScoreContract
}): AtsSummaryClarityOutcomeLog {
  const summaryValidationRecovered = input.summaryRecoveryKind !== null
  const summaryRecoveryWasSmartRepair = input.summaryRecoveryKind === 'smart_repair'
  const summaryClarityGateFailed = input.contract.qualityGates.improvedSummaryClarity === false
  const withheldForSummaryClarity = input.contract.withholdReasons.includes(ATS_SUMMARY_CLARITY_WITHHOLD_REASON)

  return {
    sessionId: input.sessionId,
    userId: input.userId,
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
    workflowMode: input.contract.workflowMode,
    evaluationStage: input.contract.evaluationStage,
    scoreStatus: input.contract.scoreStatus,
    confidence: input.contract.rawInternalConfidence,
    estimatedRangeOutcome: input.contract.scoreStatus === 'estimated_range',
    usedExactScore: input.contract.scoreStatus === 'final',
    summaryValidationRecovered,
    summaryRecoveryKind: input.summaryRecoveryKind,
    summaryRecoveryWasSmartRepair,
    summaryWasTouchedByRewrite: input.summaryWasTouchedByRewrite,
    gateImprovedSummaryClarity: input.contract.qualityGates.improvedSummaryClarity,
    summaryClarityGateFailed,
    summaryRepairThenClarityFail:
      summaryValidationRecovered
      && summaryRecoveryWasSmartRepair
      && summaryClarityGateFailed,
    withheldForSummaryClarity,
    withholdReasons: [...input.contract.withholdReasons],
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

export function recordAtsSummaryClarityOutcome(input: {
  sessionId: string
  userId?: string
  summaryRecoveryKind: AtsSummaryRecoveryKind | null
  summaryWasTouchedByRewrite: boolean
  contract: AtsReadinessScoreContract
}): void {
  const outcome = buildAtsSummaryClarityOutcomeLog(input)
  const logEvent = outcome.summaryRepairThenClarityFail ? logWarn : logInfo

  logEvent('agent.ats_enhancement.summary_clarity_outcome', {
    sessionId: outcome.sessionId,
    userId: outcome.userId,
    contractVersion: outcome.contractVersion,
    workflowMode: outcome.workflowMode,
    evaluationStage: outcome.evaluationStage,
    scoreStatus: outcome.scoreStatus,
    confidence: outcome.confidence,
    estimatedRangeOutcome: outcome.estimatedRangeOutcome,
    usedExactScore: outcome.usedExactScore,
    summaryValidationRecovered: outcome.summaryValidationRecovered,
    summaryRecoveryKind: outcome.summaryRecoveryKind,
    summaryRecoveryWasSmartRepair: outcome.summaryRecoveryWasSmartRepair,
    summaryWasTouchedByRewrite: outcome.summaryWasTouchedByRewrite,
    gateImprovedSummaryClarity: outcome.gateImprovedSummaryClarity,
    summaryClarityGateFailed: outcome.summaryClarityGateFailed,
    summaryRepairThenClarityFail: outcome.summaryRepairThenClarityFail,
    withheldForSummaryClarity: outcome.withheldForSummaryClarity,
    withholdReasons: serializeWithholdReasons(outcome.withholdReasons),
    withholdReasonCount: outcome.withholdReasons.length,
  })
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
