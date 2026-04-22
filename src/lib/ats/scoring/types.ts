import type { ATSScoreResult } from '@/types/cv'
import type { WorkflowMode } from '@/types/agent'

// v2 formalizes the Phase 64 display semantics: the product path now emits exact scores
// or short estimated ranges through one normalized ATS Readiness contract.
export const ATS_READINESS_CONTRACT_VERSION = 2
export const ATS_READINESS_PREVIOUS_CONTRACT_VERSION = 1

export type ScoreConfidence = 'low' | 'medium' | 'high'

export type ScoreStatus =
  | 'final'
  | 'estimated_range'

export type AtsReadinessDisplayMode =
  | 'exact'
  | 'estimated_range'

export type ReadinessBand =
  | 'needs_work'
  | 'borderline'
  | 'ats_ready'
  | 'excellent'

export type AtsQualityGateResult = {
  improvedSummaryClarity: boolean
  improvedKeywordVisibility: boolean
  noFactualDrift: boolean
  noLossOfRequiredSections: boolean
  noReadabilityRegression: boolean
  noUnsupportedClaimsIntroduced: boolean
}

export type AtsReadinessEvaluationStage =
  | 'baseline_only'
  | 'post_enhancement'

export type AtsReadinessDisplayContract = {
  mode: AtsReadinessDisplayMode
  scoreStatus: ScoreStatus
  exactScore: number | null
  estimatedRangeMin: number | null
  estimatedRangeMax: number | null
  confidence: ScoreConfidence
  labelPtBr: 'ATS Readiness Score'
  badgeTextPtBr: 'Final' | 'Estimado'
  helperTextPtBr: string
  formattedScorePtBr: string
}

export type AtsReadinessScoreContractV2 = {
  contractVersion: typeof ATS_READINESS_CONTRACT_VERSION
  workflowMode: Extract<WorkflowMode, 'ats_enhancement'>
  evaluationStage: AtsReadinessEvaluationStage
  productLabel: 'ATS Readiness Score'
  rawInternalScoreSource: 'scoreATS.total'
  rawInternalScoreBefore: number
  rawInternalScoreAfter: number
  rawInternalConfidence: ScoreConfidence
  displayedReadinessScoreBefore: number
  displayedReadinessScoreAfter: number | null
  displayedReadinessBandBefore: ReadinessBand
  displayedReadinessBandAfter: ReadinessBand | null
  displayedReadinessScoreCurrent: number
  displayedReadinessBandCurrent: ReadinessBand
  scoreStatus: ScoreStatus
  display: AtsReadinessDisplayContract
  qualityGates: AtsQualityGateResult
  withholdReasons: string[]
  rawScoreBefore: ATSScoreResult
  rawScoreAfter: ATSScoreResult
}

export type LegacyAtsReadinessScoreContractV1 = Omit<AtsReadinessScoreContractV2, 'contractVersion' | 'scoreStatus' | 'display'> & {
  contractVersion?: typeof ATS_READINESS_PREVIOUS_CONTRACT_VERSION
  scoreStatus?: ScoreStatus | 'withheld_pending_quality'
  display?: Partial<AtsReadinessDisplayContract>
}

export type AtsReadinessPersistedContract =
  | AtsReadinessScoreContractV2
  | LegacyAtsReadinessScoreContractV1

export type AtsReadinessScoreContract = AtsReadinessScoreContractV2

export type AtsReadinessDecisionLog = {
  contractVersion: typeof ATS_READINESS_CONTRACT_VERSION
  workflowMode: string
  evaluationStage: AtsReadinessEvaluationStage
  rawInternalScoreBefore: number
  rawInternalScoreAfter: number
  displayedReadinessScoreBefore: number
  displayedReadinessScoreAfter: number | null
  scoreStatus: ScoreStatus
  displayMode: AtsReadinessDisplayMode
  exactScore: number | null
  estimatedRangeMin: number | null
  estimatedRangeMax: number | null
  confidence: ScoreConfidence
  appliedFloor89: boolean
  appliedCap95: boolean
  rawDecreased: boolean
  displayedMonotonicityProtected: boolean
  withheldConvertedToRange: boolean
  withholdReasons: string[]
  qualityGates: AtsQualityGateResult
}

export type AtsSummaryRecoveryKind =
  | 'smart_repair'
  | 'conservative_fallback'
  | 'original_cv_fallback'

export type AtsSummaryClarityOutcomeLog = {
  sessionId: string
  userId?: string
  contractVersion: typeof ATS_READINESS_CONTRACT_VERSION
  workflowMode: Extract<WorkflowMode, 'ats_enhancement'>
  evaluationStage: AtsReadinessEvaluationStage
  scoreStatus: ScoreStatus
  confidence: ScoreConfidence
  estimatedRangeOutcome: boolean
  usedExactScore: boolean
  summaryValidationRecovered: boolean
  summaryRecoveryKind: AtsSummaryRecoveryKind | null
  summaryRecoveryWasSmartRepair: boolean
  summaryWasTouchedByRewrite: boolean
  gateImprovedSummaryClarity: boolean
  summaryClarityGateFailed: boolean
  summaryRepairThenClarityFail: boolean
  withheldForSummaryClarity: boolean
  withholdReasons: string[]
}
