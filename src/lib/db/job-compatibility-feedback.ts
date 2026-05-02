import { randomUUID } from 'node:crypto'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

export type JobCompatibilityFeedbackType =
  | 'gap_marked_wrong'
  | 'supported_marked_wrong'
  | 'missing_evidence_claimed_by_user'
  | 'score_disagreed'
  | 'other'

export type JobCompatibilityFeedbackStatus =
  | 'new'
  | 'reviewed'
  | 'catalog_change_needed'
  | 'resume_update_needed'
  | 'rejected'

export type JobCompatibilityFeedback = {
  id: string
  userId: string
  sessionId: string
  assessmentVersion: string
  catalogVersion: string
  scoreVersion: string
  feedbackType: JobCompatibilityFeedbackType
  targetSignal?: string
  requirementId?: string
  userComment?: string
  status: JobCompatibilityFeedbackStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export async function createJobCompatibilityFeedback(input: {
  userId: string
  sessionId: string
  assessmentVersion: string
  catalogVersion: string
  scoreVersion: string
  feedbackType: JobCompatibilityFeedbackType
  targetSignal?: string
  requirementId?: string
  userComment?: string
}): Promise<JobCompatibilityFeedback> {
  const supabase = getSupabaseAdminClient()
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const row = {
    id,
    user_id: input.userId,
    session_id: input.sessionId,
    assessment_version: input.assessmentVersion,
    catalog_version: input.catalogVersion,
    score_version: input.scoreVersion,
    feedback_type: input.feedbackType,
    target_signal: input.targetSignal ?? null,
    requirement_id: input.requirementId ?? null,
    user_comment: input.userComment ?? null,
    status: 'new',
    created_at: createdAt,
  }
  const { error } = await supabase
    .from('job_compatibility_feedback')
    .insert(row)

  if (error) {
    throw new Error(`Failed to create job compatibility feedback: ${error.message}`)
  }

  return {
    id,
    userId: input.userId,
    sessionId: input.sessionId,
    assessmentVersion: input.assessmentVersion,
    catalogVersion: input.catalogVersion,
    scoreVersion: input.scoreVersion,
    feedbackType: input.feedbackType,
    ...(input.targetSignal === undefined ? {} : { targetSignal: input.targetSignal }),
    ...(input.requirementId === undefined ? {} : { requirementId: input.requirementId }),
    ...(input.userComment === undefined ? {} : { userComment: input.userComment }),
    status: 'new',
    createdAt,
  }
}

