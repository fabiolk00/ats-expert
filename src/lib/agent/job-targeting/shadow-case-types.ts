import type { JobCompatibilityAssessment } from '@/lib/agent/job-targeting/compatibility/types'
import type { TargetingPlan } from '@/types/agent'
import type { CVState } from '@/types/cv'

export type JobTargetingShadowCase = {
  id: string
  source: 'real_anonymized' | 'synthetic' | 'golden' | 'manual_review'
  domain?: string
  cvState: CVState
  targetJobDescription: string
  expected?: {
    notes?: string
    knownStrongSignals?: string[]
    knownGaps?: string[]
    shouldNotClaim?: string[]
  }
  metadata?: {
    originalSessionId?: string
    createdAt?: string
    anonymized: boolean
  }
}

export type ShadowLegacySnapshot = {
  score?: number
  lowFitTriggered?: boolean
  unsupportedCount?: number
  criticalGaps?: string[]
}

export type ShadowAssessmentSnapshot = {
  score: number
  lowFitTriggered: boolean
  supportedCount: number
  adjacentCount: number
  unsupportedCount: number
  forbiddenClaimCount: number
  criticalGaps: string[]
  reviewNeededGaps: string[]
  assessmentVersion: string
  scoreVersion: string
  catalogVersion: string
}

export type ShadowComparisonSnapshot = {
  scoreDelta: number
  lowFitDelta: boolean
  criticalGapDelta: number
  unsupportedDelta: number
}

export type ShadowValidationSnapshot = {
  blocked: boolean
  issueTypes: string[]
  factualViolation: boolean
}

export type ShadowBatchResult = {
  caseId: string
  domain?: string
  source?: JobTargetingShadowCase['source']
  legacy: ShadowLegacySnapshot
  assessment: ShadowAssessmentSnapshot
  comparison: ShadowComparisonSnapshot
  validation?: ShadowValidationSnapshot
  runtime: {
    startedAt: string
    completedAt: string
    latencyMs: number
    success: boolean
    error?: string
  }
}

export type ShadowBatchLegacyContext = {
  targetingPlan: TargetingPlan
  score: number
}

export type ShadowComparisonPersistenceInput = {
  userId?: string
  sessionId?: string
  caseId?: string
  source?: string
  legacy: ShadowLegacySnapshot
  assessment: JobCompatibilityAssessment
}
