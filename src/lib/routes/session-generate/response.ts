import { NextResponse } from 'next/server'

import { logInfo, logWarn } from '@/lib/observability/structured-log'
import { assertNever } from '@/lib/routes/shared/exhaustive'
import { toNextJsonResponse } from '@/lib/routes/shared/response'

import {
  buildActiveExportConflictBody,
  buildBlockedReconciliationBody,
  buildCareerFitConfirmationBody,
  buildFailedJobResponse,
  buildSuccessResponseBody,
} from './outcome-builders'
import type { SessionGenerateContext, SessionGenerateExecutionDecision, SessionGeneratePolicyDecision } from './types'

export function toSessionGeneratePolicyResponse(
  context: SessionGenerateContext,
  decision: Exclude<SessionGeneratePolicyDecision, { kind: 'allow' }>,
): NextResponse {
  if (decision.kind === 'blocked_career_fit_confirmation') {
    logWarn('api.session.generate.career_fit_confirmation_required', {
      requestMethod: context.request.method,
      requestPath: context.requestPath,
      sessionId: context.session.id,
      appUserId: context.appUser.id,
      scope: context.scope,
      targetId: context.body.scope === 'target' ? context.body.targetId : undefined,
      success: false,
      latencyMs: Date.now() - context.requestStartedAt,
    })

    return NextResponse.json(buildCareerFitConfirmationBody(), { status: 409 })
  }

  logWarn('api.session.generate.user_export_limit_hit', {
    requestMethod: context.request.method,
    requestPath: context.requestPath,
    sessionId: context.session.id,
    appUserId: context.appUser.id,
    scope: context.scope,
    targetId: context.target?.id,
    conflictingJobId: decision.conflictingJob.jobId,
    success: false,
    latencyMs: Date.now() - context.requestStartedAt,
  })

  return NextResponse.json(
    buildActiveExportConflictBody(decision.conflictingJob),
    { status: 409 },
  )
}

export function toSessionGenerateExecutionResponse(
  context: SessionGenerateContext,
  decision: SessionGenerateExecutionDecision,
): NextResponse {
  switch (decision.kind) {
    case 'blocked_reconciliation':
      logWarn('api.session.generate.billing_reconciliation_pending', {
        requestMethod: context.request.method,
        requestPath: context.requestPath,
        sessionId: context.session.id,
        appUserId: context.appUser.id,
        scope: context.scope,
        targetId: context.target?.id,
        jobId: decision.job.jobId,
        stage: decision.job.stage,
        success: false,
        latencyMs: Date.now() - context.requestStartedAt,
      })

      return NextResponse.json(buildBlockedReconciliationBody(), { status: 409 })
    case 'failed': {
      const failure = buildFailedJobResponse(decision.job)
      const failureCode = typeof failure.body.code === 'string'
        ? failure.body.code
        : undefined

      logWarn('api.session.generate.job_failed', {
        requestMethod: context.request.method,
        requestPath: context.requestPath,
        sessionId: context.session.id,
        appUserId: context.appUser.id,
        scope: context.scope,
        targetId: context.target?.id,
        success: false,
        latencyMs: Date.now() - context.requestStartedAt,
        code: failureCode,
      })

      return toNextJsonResponse(failure)
    }
    case 'completed':
      logInfo('api.session.generate.completed', {
        requestMethod: context.request.method,
        requestPath: context.requestPath,
        sessionId: context.session.id,
        appUserId: context.appUser.id,
        scope: context.scope,
        targetId: decision.targetId,
        success: true,
        latencyMs: Date.now() - context.requestStartedAt,
      })

      return NextResponse.json(buildSuccessResponseBody({
        job: decision.job,
        scope: context.scope,
        targetId: decision.targetId,
      }))
    case 'in_progress':
      logInfo('api.session.generate.in_progress', {
        requestMethod: context.request.method,
        requestPath: context.requestPath,
        sessionId: context.session.id,
        appUserId: context.appUser.id,
        scope: context.scope,
        targetId: decision.targetId,
        success: true,
        latencyMs: Date.now() - context.requestStartedAt,
      })

      return NextResponse.json(buildSuccessResponseBody({
        job: decision.job,
        scope: context.scope,
        targetId: decision.targetId,
        inProgress: true,
      }), { status: 202 })
    default:
      return assertNever(decision, 'session generate execution decision')
  }
}
