import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { dispatchToolWithContext } from '@/lib/agent/tools'
import { TOOL_ERROR_CODES } from '@/lib/agent/tool-errors'
import { getHttpStatusForToolError } from '@/lib/agent/tool-errors'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { createCvVersion } from '@/lib/db/cv-versions'
import { getSession, updateSession } from '@/lib/db/sessions'
import {
  buildUserFacingValidationBlockModal,
  isRecoverableValidationBlock,
  buildValidationOverrideMetadata,
} from '@/lib/agent/job-targeting/recoverable-validation'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'
import { withRequestQueryTracking } from '@/lib/observability/request-query-tracking'
import { validateTrustedMutationRequest } from '@/lib/security/request-trust'

const OverrideBodySchema = z.object({
  overrideToken: z.string().min(1),
  consumeCredit: z.literal(true).optional().default(true),
})

function buildValidationFromIssues(validationIssues: NonNullable<NonNullable<Awaited<ReturnType<typeof getSession>>>['agentState']['blockedTargetedRewriteDraft']>['validationIssues']) {
  const hardIssues = validationIssues.filter((issue) => issue.severity === 'high')
  const softWarnings = validationIssues.filter((issue) => issue.severity !== 'high')

  return {
    blocked: true,
    valid: false,
    hardIssues,
    softWarnings,
    issues: validationIssues,
  }
}

async function persistAgentState(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  agentState: NonNullable<Awaited<ReturnType<typeof getSession>>>['agentState'],
): Promise<void> {
  await updateSession(session.id, { agentState })
  session.agentState = agentState
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  return withRequestQueryTracking(req, async () => {
    const appUser = await getCurrentAppUser()
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trust = validateTrustedMutationRequest(req)
    if (!trust.ok) {
      logWarn('api.session.job_targeting.override.untrusted_request', {
        requestMethod: req.method,
        requestPath: req.nextUrl.pathname,
        requestedSessionId: params.id,
        appUserId: appUser.id,
        trustSignal: trust.signal,
        trustReason: trust.reason,
        success: false,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await getSession(params.id, appUser.id)
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = OverrideBodySchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }

    const blockedDraft = session.agentState.blockedTargetedRewriteDraft
    if (!blockedDraft || !session.agentState.recoverableValidationBlock) {
      return NextResponse.json({
        error: 'Não existe uma versão bloqueada pronta para override nesta sessão.',
      }, { status: 409 })
    }

    if (
      blockedDraft.sessionId !== session.id
      || blockedDraft.userId !== appUser.id
      || blockedDraft.token !== body.data.overrideToken
    ) {
      return NextResponse.json({
        error: 'O token de override não corresponde à sessão atual.',
      }, { status: 403 })
    }

    if (Date.parse(blockedDraft.expiresAt) <= Date.now()) {
      return NextResponse.json({
        error: 'Esta confirmação expirou. Gere uma nova versão para continuar.',
      }, { status: 410 })
    }

    const previousAgentState = structuredClone(session.agentState)
    const rewriteValidation = session.agentState.rewriteValidation ?? buildValidationFromIssues(blockedDraft.validationIssues)
    if (!blockedDraft.recoverable || !isRecoverableValidationBlock(rewriteValidation)) {
      return NextResponse.json({
        error: 'Este bloqueio nÃ£o pode ser liberado com override pago.',
      }, { status: 409 })
    }

    const requiredCredits = body.data.consumeCredit ? 1 : 0
    const availableCredits = appUser.creditAccount.creditsRemaining
    if (availableCredits < requiredCredits) {
      logWarn('api.session.job_targeting.override.insufficient_credits', {
        requestMethod: req.method,
        requestPath: req.nextUrl.pathname,
        sessionId: session.id,
        appUserId: appUser.id,
        requiredCredits,
        availableCredits,
        success: false,
      })
      return NextResponse.json({
        error: 'insufficient_credits',
        code: TOOL_ERROR_CODES.INSUFFICIENT_CREDITS,
        message: 'Você não tem créditos suficientes para gerar esta versão.',
        requiredCredits,
        availableCredits,
        openPricing: true,
      }, { status: 402 })
    }

    const consumedDraftState = {
      ...session.agentState,
      blockedTargetedRewriteDraft: undefined,
      recoverableValidationBlock: undefined,
    }
    const generationSession = {
      ...session,
      agentState: {
        ...session.agentState,
        workflowMode: 'job_targeting' as const,
        targetJobDescription: blockedDraft.targetJobDescription,
        optimizedCvState: structuredClone(blockedDraft.optimizedCvState),
        optimizedAt: new Date().toISOString(),
        optimizationSummary: blockedDraft.optimizationSummary ?? session.agentState.optimizationSummary,
        lastRewriteMode: 'job_targeting' as const,
        rewriteStatus: 'failed' as const,
        rewriteValidation,
        blockedTargetedRewriteDraft: blockedDraft,
        recoverableValidationBlock: session.agentState.recoverableValidationBlock ?? {
          status: 'validation_blocked_recoverable' as const,
          overrideToken: blockedDraft.token,
          modal: buildUserFacingValidationBlockModal({
            targetRole: blockedDraft.targetRole,
            validationIssues: blockedDraft.validationIssues,
          }),
          expiresAt: blockedDraft.expiresAt,
        },
      },
    }

    try {
      await persistAgentState(session, consumedDraftState)
      await createCvVersion({
        sessionId: session.id,
        snapshot: blockedDraft.optimizedCvState,
        source: 'job-targeting',
      })
    } catch (error) {
      await persistAgentState(session, previousAgentState)
      logError('api.session.job_targeting.override.persist_failed', {
        requestMethod: req.method,
        requestPath: req.nextUrl.pathname,
        sessionId: session.id,
        appUserId: appUser.id,
        success: false,
        ...serializeError(error),
      })
      return NextResponse.json({
        error: 'Não conseguimos concluir a geração por um erro técnico. Tente novamente.',
      }, { status: 500 })
    }

    const generationResult = await dispatchToolWithContext(
      'generate_file',
      {
        cv_state: blockedDraft.optimizedCvState,
        idempotency_key: `profile-target-override:${session.id}:${blockedDraft.id}`,
      },
      generationSession,
    )

    if (generationResult.outputFailure) {
      await persistAgentState(session, previousAgentState)
      logWarn('agent.job_targeting.validation_override_failed', {
        sessionId: session.id,
        userId: appUser.id,
        targetRole: blockedDraft.targetRole,
        issueCount: blockedDraft.validationIssues.length,
        hardIssueCount: blockedDraft.validationIssues.filter((issue) => issue.severity === 'high').length,
        code: generationResult.outputFailure.code,
        error: generationResult.outputFailure.error,
      })
      return NextResponse.json({
        error: generationResult.outputFailure.error ?? 'Não conseguimos concluir a geração por um erro técnico. Tente novamente.',
        code: generationResult.outputFailure.code,
      }, {
        status: generationResult.outputFailure.code
          ? getHttpStatusForToolError(generationResult.outputFailure.code)
          : 500,
      })
    }

    const completedAgentState = {
      ...generationSession.agentState,
      rewriteStatus: 'completed' as const,
      validationOverride: buildValidationOverrideMetadata({
        userId: appUser.id,
        targetRole: blockedDraft.targetRole,
        validationIssues: blockedDraft.validationIssues,
      }),
      blockedTargetedRewriteDraft: undefined,
      recoverableValidationBlock: undefined,
    }

    await persistAgentState(session, completedAgentState)

    const output = generationResult.output as {
      creditsUsed?: number
      resumeGenerationId?: string
    }
    const warnings = completedAgentState.rewriteValidation?.softWarnings
      .map((issue) => issue.message)
      .filter(Boolean)

    logInfo('agent.job_targeting.validation_override_succeeded', {
      sessionId: session.id,
      userId: appUser.id,
      targetRole: blockedDraft.targetRole,
      issueCount: blockedDraft.validationIssues.length,
      hardIssueCount: blockedDraft.validationIssues.filter((issue) => issue.severity === 'high').length,
      creditCost: 1,
      creditCharged: (output.creditsUsed ?? 0) > 0,
      resumeGenerationId: output.resumeGenerationId,
      validationOverride: true,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      creditsUsed: output.creditsUsed ?? 0,
      resumeGenerationId: output.resumeGenerationId,
      generationType: 'JOB_TARGETING' as const,
      warnings: warnings && warnings.length > 0 ? warnings : undefined,
    })
  })
}
