import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { createJobCompatibilityFeedback } from '@/lib/db/job-compatibility-feedback'
import { getSession } from '@/lib/db/sessions'
import { logWarn } from '@/lib/observability/structured-log'
import { validateTrustedMutationRequest } from '@/lib/security/request-trust'

const FeedbackBodySchema = z.object({
  sessionId: z.string().min(1),
  feedbackType: z.enum([
    'gap_marked_wrong',
    'supported_marked_wrong',
    'missing_evidence_claimed_by_user',
    'score_disagreed',
    'other',
  ]),
  targetSignal: z.string().trim().min(1).max(500).optional(),
  requirementId: z.string().trim().min(1).max(200).optional(),
  userComment: z.string().trim().max(2000).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const trust = validateTrustedMutationRequest(req)
  if (!trust.ok) {
    logWarn('api.job_targeting.feedback.untrusted_request', {
      appUserId: appUser.id,
      requestMethod: req.method,
      requestPath: req.nextUrl.pathname,
      success: false,
      trustSignal: trust.signal,
      trustReason: trust.reason,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = FeedbackBodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  const session = await getSession(body.data.sessionId, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const assessment = session.agentState.jobCompatibilityAssessment
    ?? session.agentState.jobCompatibilityAssessmentShadow
  if (!assessment) {
    return NextResponse.json({ error: 'No compatibility assessment available for this session.' }, { status: 409 })
  }

  const feedback = await createJobCompatibilityFeedback({
    userId: appUser.id,
    sessionId: session.id,
    assessmentVersion: assessment.audit.assessmentVersion,
    catalogVersion: Object.entries(assessment.catalog.catalogVersions)
      .map(([id, version]) => `${id}@${version}`)
      .join(','),
    scoreVersion: assessment.audit.scoreVersion,
    feedbackType: body.data.feedbackType,
    targetSignal: body.data.targetSignal,
    requirementId: body.data.requirementId,
    userComment: body.data.userComment,
  })

  return NextResponse.json({ feedback }, { status: 201 })
}

