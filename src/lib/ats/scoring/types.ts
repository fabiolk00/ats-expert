import type { ATSScoreResult } from '@/types/cv'
import type { WorkflowMode } from '@/types/agent'

export type ScoreConfidence = 'low' | 'medium' | 'high'

export type ScoreStatus =
  | 'final'
  | 'withheld_pending_quality'

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

export type AtsReadinessScoreContract = {
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
  qualityGates: AtsQualityGateResult
  withholdReasons: string[]
  rawScoreBefore: ATSScoreResult
  rawScoreAfter: ATSScoreResult
}

