import { randomUUID } from 'node:crypto'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import {
  buildCatalogVersionString,
  snapshotAssessment,
} from '@/lib/agent/job-targeting/shadow-comparison'
import type {
  ShadowComparisonPersistenceInput,
  ShadowLegacySnapshot,
} from '@/lib/agent/job-targeting/shadow-case-types'
import type { JobCompatibilityAssessment } from '@/lib/agent/job-targeting/compatibility/types'

export type JobCompatibilityShadowComparison = {
  id: string
  userId?: string
  sessionId?: string
  caseId?: string
  legacyScore?: number
  assessmentScore: number
  scoreDelta: number
  legacyCriticalGapsCount?: number
  assessmentCriticalGapsCount: number
  criticalGapDelta: number
  legacyLowFitTriggered?: boolean
  assessmentLowFitTriggered: boolean
  lowFitDelta: boolean
  legacyUnsupportedCount?: number
  assessmentUnsupportedCount: number
  assessmentSupportedCount: number
  assessmentAdjacentCount: number
  assessmentForbiddenClaimCount: number
  assessmentVersion: string
  scoreVersion: string
  catalogVersion: string
  source: string
  createdAt: string
}

function buildComparisonNumbers(params: {
  legacy: ShadowLegacySnapshot
  assessment: JobCompatibilityAssessment
}) {
  const assessmentSnapshot = snapshotAssessment(params.assessment)
  const legacyCriticalGapsCount = params.legacy.criticalGaps?.length
  const legacyScore = params.legacy.score
  const legacyUnsupportedCount = params.legacy.unsupportedCount
  const legacyLowFitTriggered = params.legacy.lowFitTriggered

  return {
    legacyScore,
    assessmentScore: assessmentSnapshot.score,
    scoreDelta: assessmentSnapshot.score - (legacyScore ?? 0),
    legacyCriticalGapsCount,
    assessmentCriticalGapsCount: assessmentSnapshot.criticalGaps.length,
    criticalGapDelta: assessmentSnapshot.criticalGaps.length - (legacyCriticalGapsCount ?? 0),
    legacyLowFitTriggered,
    assessmentLowFitTriggered: assessmentSnapshot.lowFitTriggered,
    lowFitDelta: Boolean(legacyLowFitTriggered) !== assessmentSnapshot.lowFitTriggered,
    legacyUnsupportedCount,
    assessmentUnsupportedCount: assessmentSnapshot.unsupportedCount,
    assessmentSupportedCount: assessmentSnapshot.supportedCount,
    assessmentAdjacentCount: assessmentSnapshot.adjacentCount,
    assessmentForbiddenClaimCount: assessmentSnapshot.forbiddenClaimCount,
    assessmentVersion: assessmentSnapshot.assessmentVersion,
    scoreVersion: assessmentSnapshot.scoreVersion,
    catalogVersion: assessmentSnapshot.catalogVersion || buildCatalogVersionString(params.assessment),
  }
}

export async function createJobCompatibilityShadowComparison(
  input: ShadowComparisonPersistenceInput,
): Promise<JobCompatibilityShadowComparison> {
  const supabase = getSupabaseAdminClient()
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const numbers = buildComparisonNumbers({
    legacy: input.legacy,
    assessment: input.assessment,
  })
  const row = {
    id,
    user_id: input.userId ?? null,
    session_id: input.sessionId ?? null,
    case_id: input.caseId ?? null,
    legacy_score: numbers.legacyScore ?? null,
    assessment_score: numbers.assessmentScore,
    score_delta: numbers.scoreDelta,
    legacy_critical_gaps_count: numbers.legacyCriticalGapsCount ?? null,
    assessment_critical_gaps_count: numbers.assessmentCriticalGapsCount,
    critical_gap_delta: numbers.criticalGapDelta,
    legacy_low_fit_triggered: numbers.legacyLowFitTriggered ?? null,
    assessment_low_fit_triggered: numbers.assessmentLowFitTriggered,
    low_fit_delta: numbers.lowFitDelta,
    legacy_unsupported_count: numbers.legacyUnsupportedCount ?? null,
    assessment_unsupported_count: numbers.assessmentUnsupportedCount,
    assessment_supported_count: numbers.assessmentSupportedCount,
    assessment_adjacent_count: numbers.assessmentAdjacentCount,
    assessment_forbidden_claim_count: numbers.assessmentForbiddenClaimCount,
    assessment_version: numbers.assessmentVersion,
    score_version: numbers.scoreVersion,
    catalog_version: numbers.catalogVersion,
    source: input.source ?? 'batch',
    created_at: createdAt,
  }
  const { error } = await supabase
    .from('job_compatibility_shadow_comparison')
    .insert(row)

  if (error) {
    throw new Error(`Failed to create job compatibility shadow comparison: ${error.message}`)
  }

  return {
    id,
    ...(input.userId === undefined ? {} : { userId: input.userId }),
    ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
    ...(input.caseId === undefined ? {} : { caseId: input.caseId }),
    legacyScore: numbers.legacyScore,
    assessmentScore: numbers.assessmentScore,
    scoreDelta: numbers.scoreDelta,
    legacyCriticalGapsCount: numbers.legacyCriticalGapsCount,
    assessmentCriticalGapsCount: numbers.assessmentCriticalGapsCount,
    criticalGapDelta: numbers.criticalGapDelta,
    legacyLowFitTriggered: numbers.legacyLowFitTriggered,
    assessmentLowFitTriggered: numbers.assessmentLowFitTriggered,
    lowFitDelta: numbers.lowFitDelta,
    legacyUnsupportedCount: numbers.legacyUnsupportedCount,
    assessmentUnsupportedCount: numbers.assessmentUnsupportedCount,
    assessmentSupportedCount: numbers.assessmentSupportedCount,
    assessmentAdjacentCount: numbers.assessmentAdjacentCount,
    assessmentForbiddenClaimCount: numbers.assessmentForbiddenClaimCount,
    assessmentVersion: numbers.assessmentVersion,
    scoreVersion: numbers.scoreVersion,
    catalogVersion: numbers.catalogVersion,
    source: input.source ?? 'batch',
    createdAt,
  }
}
