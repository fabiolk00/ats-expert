import type { Session } from '@/types/agent'
import type { CVState } from '@/types/cv'
import { recordMetricCounter } from '@/lib/observability/metric-events'
import { logInfo } from '@/lib/observability/structured-log'

import {
  ATS_READINESS_CONTRACT_VERSION,
  ATS_READINESS_PREVIOUS_CONTRACT_VERSION,
  type AtsReadinessPersistedContract,
  type AtsReadinessScoreContract,
} from './types'
import {
  buildAtsReadinessContractForEnhancement,
  buildBaselineAtsReadinessContract,
} from './index'
import { bandFromScore, buildAtsReadinessDisplayContract, buildEstimatedReadinessRange } from './display-score'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getPersistedContractVersion(contract: unknown): number {
  if (!isRecord(contract)) {
    return 0
  }

  return typeof contract.contractVersion === 'number'
    ? contract.contractVersion
    : 0
}

function resolveNormalizedScoreStatus(
  contract: AtsReadinessPersistedContract,
): AtsReadinessScoreContract['scoreStatus'] {
  if (contract.scoreStatus === 'withheld_pending_quality') {
    return 'estimated_range'
  }

  if (contract.scoreStatus === 'estimated_range') {
    return 'estimated_range'
  }

  if (contract.display?.mode === 'estimated_range') {
    return 'estimated_range'
  }

  return 'final'
}

export function normalizePersistedAtsReadiness(
  contract: unknown,
): AtsReadinessScoreContract | undefined {
  if (!isRecord(contract)) {
    return undefined
  }

  if (contract.productLabel !== 'ATS Readiness Score') {
    return undefined
  }

  const persisted = contract as AtsReadinessPersistedContract
  const normalized = {
    ...persisted,
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
  } as AtsReadinessScoreContract
  const scoreStatus = resolveNormalizedScoreStatus(persisted)
  const migratedEstimatedRange = scoreStatus === 'estimated_range'
    ? buildEstimatedReadinessRange({
        displayedReadinessScoreBefore: normalized.displayedReadinessScoreBefore,
        rawInternalScoreAfter: normalized.rawInternalScoreAfter,
      })
    : null
  const normalizedExactScore = scoreStatus === 'final'
    ? normalized.display?.exactScore
      ?? normalized.displayedReadinessScoreAfter
      ?? normalized.displayedReadinessScoreCurrent
    : null
  const exactScore = scoreStatus === 'final'
    ? normalizedExactScore
    : null
  const estimatedRangeMin = scoreStatus === 'estimated_range'
    ? normalized.display?.estimatedRangeMin
      ?? migratedEstimatedRange?.min
      ?? normalized.displayedReadinessScoreCurrent
    : null
  const estimatedRangeMax = scoreStatus === 'estimated_range'
    ? normalized.display?.estimatedRangeMax
      ?? migratedEstimatedRange?.max
      ?? normalized.displayedReadinessScoreCurrent
    : null

  return {
    ...normalized,
    contractVersion: ATS_READINESS_CONTRACT_VERSION,
    displayedReadinessScoreAfter: scoreStatus === 'estimated_range'
      ? estimatedRangeMin
      : normalizedExactScore,
    displayedReadinessBandAfter: scoreStatus === 'estimated_range' && estimatedRangeMin !== null
      ? bandFromScore(estimatedRangeMin)
      : normalizedExactScore !== null
        ? bandFromScore(normalizedExactScore)
        : normalized.displayedReadinessBandAfter,
    displayedReadinessScoreCurrent: scoreStatus === 'estimated_range'
      ? estimatedRangeMin ?? normalized.displayedReadinessScoreCurrent
      : normalizedExactScore ?? normalized.displayedReadinessScoreCurrent,
    displayedReadinessBandCurrent: scoreStatus === 'estimated_range' && estimatedRangeMin !== null
      ? bandFromScore(estimatedRangeMin)
      : normalizedExactScore !== null
        ? bandFromScore(normalizedExactScore)
        : normalized.displayedReadinessBandCurrent,
    scoreStatus,
    display: buildAtsReadinessDisplayContract({
      scoreStatus,
      exactScore,
      estimatedRangeMin,
      estimatedRangeMax,
      confidence: normalized.rawInternalConfidence,
    }),
  }
}

export function resolveSessionAtsReadiness(input: {
  session: Pick<Session, 'cvState' | 'agentState'>
  optimizedCvState?: CVState
  emitFallbackTelemetry?: boolean
}): AtsReadinessScoreContract | undefined {
  const { session } = input
  if (session.agentState.workflowMode !== 'ats_enhancement') {
    return undefined
  }

  const persistedContractVersion = getPersistedContractVersion(session.agentState.atsReadiness)
  const normalizedPersisted = normalizePersistedAtsReadiness(session.agentState.atsReadiness)
  if (normalizedPersisted) {
    const normalizedLegacyContract = persistedContractVersion !== ATS_READINESS_CONTRACT_VERSION
    if (normalizedLegacyContract && input.emitFallbackTelemetry) {
      logInfo('ats_readiness.contract_normalized', {
        fromContractVersion: persistedContractVersion || ATS_READINESS_PREVIOUS_CONTRACT_VERSION,
        toContractVersion: ATS_READINESS_CONTRACT_VERSION,
        workflowMode: normalizedPersisted.workflowMode,
        scoreStatus: normalizedPersisted.scoreStatus,
      })
      recordMetricCounter('architecture.ats_readiness.v1_normalized_to_v2', {
        fromContractVersion: persistedContractVersion || ATS_READINESS_PREVIOUS_CONTRACT_VERSION,
        toContractVersion: ATS_READINESS_CONTRACT_VERSION,
        scoreStatus: normalizedPersisted.scoreStatus,
      })
    }
    return normalizedPersisted
  }

  const optimizedCvState = input.optimizedCvState ?? session.agentState.optimizedCvState
  const fallback = optimizedCvState
    ? buildAtsReadinessContractForEnhancement({
        originalCvState: session.cvState,
        optimizedCvState,
        rewriteValidation: session.agentState.rewriteValidation,
        optimizationSummary: session.agentState.optimizationSummary,
      })
    : buildBaselineAtsReadinessContract({
        cvState: session.cvState,
      })

  if (input.emitFallbackTelemetry) {
    logInfo('ats_readiness.legacy_fallback_derived', {
      contractVersion: ATS_READINESS_CONTRACT_VERSION,
      workflowMode: fallback.workflowMode,
      evaluationStage: fallback.evaluationStage,
      scoreStatus: fallback.scoreStatus,
      confidence: fallback.rawInternalConfidence,
    })
    recordMetricCounter('architecture.ats_readiness.legacy_fallback_used', {
      contractVersion: ATS_READINESS_CONTRACT_VERSION,
      evaluationStage: fallback.evaluationStage,
    })
  }

  return fallback
}

export function resolveDisplayedReadinessScoreForSession(input: {
  session: Pick<Session, 'cvState' | 'agentState'>
  optimizedCvState?: CVState
}): number | undefined {
  return resolveSessionAtsReadiness(input)?.displayedReadinessScoreCurrent
}
