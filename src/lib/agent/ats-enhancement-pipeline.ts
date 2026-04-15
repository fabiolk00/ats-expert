import { executeWithStageRetry } from '@/lib/agent/ats-enhancement-retry'
import { createCvVersion } from '@/lib/db/cv-versions'
import { updateSession } from '@/lib/db/sessions'
import { analyzeAtsGeneral } from '@/lib/agent/tools/ats-analysis'
import { rewriteResumeFull } from '@/lib/agent/tools/rewrite-resume-full'
import { validateRewrite } from '@/lib/agent/tools/validate-rewrite'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'
import type { Session } from '@/types/agent'

function buildWorkflowRun(
  session: Session,
  patch: Partial<NonNullable<Session['agentState']['atsWorkflowRun']>>,
): NonNullable<Session['agentState']['atsWorkflowRun']> {
  const current = session.agentState.atsWorkflowRun

  return {
    status: current?.status ?? 'idle',
    attemptCount: current?.attemptCount ?? 0,
    retriedSections: current?.retriedSections ?? [],
    compactedSections: current?.compactedSections ?? [],
    sectionAttempts: current?.sectionAttempts ?? {},
    updatedAt: new Date().toISOString(),
    ...current,
    ...patch,
  }
}

async function persistAgentState(session: Session, agentState: Session['agentState']): Promise<void> {
  await updateSession(session.id, {
    agentState,
  })
  session.agentState = agentState
}

export async function runAtsEnhancementPipeline(session: Session): Promise<{
  success: boolean
  atsAnalysis?: NonNullable<Session['agentState']['atsAnalysis']>
  optimizedCvState?: Session['agentState']['optimizedCvState']
  optimizationSummary?: Session['agentState']['optimizationSummary']
  validation?: Session['agentState']['rewriteValidation']
  error?: string
}> {
  await persistAgentState(session, {
    ...session.agentState,
    rewriteStatus: 'running',
    workflowMode: 'ats_enhancement',
    atsWorkflowRun: buildWorkflowRun(session, {
      status: 'running',
      currentStage: 'analysis',
      attemptCount: 0,
      retriedSections: [],
      compactedSections: [],
      sectionAttempts: {},
      lastFailureReason: undefined,
      lastFailureSection: undefined,
      lastFailureStage: undefined,
    }),
  })

  logInfo('agent.ats_enhancement.started', {
    workflowMode: 'ats_enhancement',
    sessionId: session.id,
    userId: session.userId,
    stage: 'analysis',
  })

  const atsAnalysisResult = await executeWithStageRetry(
    async (attempt) => {
      session.agentState.atsWorkflowRun = buildWorkflowRun(session, {
        currentStage: 'analysis',
        attemptCount: attempt,
      })
      return analyzeAtsGeneral(session.cvState, session.userId, session.id)
    },
    {
      onRetry: (_error, attempt) => {
        logWarn('agent.ats_enhancement.retry', {
          workflowMode: 'ats_enhancement',
          sessionId: session.id,
          userId: session.userId,
          stage: 'analysis',
          attempt: attempt + 1,
        })
      },
    },
  ).then(({ result }) => result)

  if (!atsAnalysisResult.success || !atsAnalysisResult.result) {
    const nextAgentState: Session['agentState'] = {
      ...session.agentState,
      rewriteStatus: 'failed',
      atsWorkflowRun: buildWorkflowRun(session, {
        status: 'failed',
        currentStage: 'analysis',
        lastFailureStage: 'analysis',
        lastFailureReason: atsAnalysisResult.error ?? 'ATS analysis failed.',
      }),
    }
    await persistAgentState(session, nextAgentState)
    logError('agent.ats_enhancement.failed', {
      workflowMode: 'ats_enhancement',
      sessionId: session.id,
      userId: session.userId,
      stage: 'analysis',
      success: false,
      errorMessage: atsAnalysisResult.error ?? 'ATS analysis failed.',
    })
    return {
      success: false,
      error: atsAnalysisResult.error ?? 'ATS analysis failed.',
    }
  }

  const atsAnalysis = {
    result: atsAnalysisResult.result,
    analyzedAt: new Date().toISOString(),
  } satisfies NonNullable<Session['agentState']['atsAnalysis']>

  await persistAgentState(session, {
    ...session.agentState,
    atsWorkflowRun: buildWorkflowRun(session, {
      currentStage: 'rewrite_plan',
    }),
  })

  const rewriteResult = await rewriteResumeFull({
    mode: 'ats_enhancement',
    cvState: session.cvState,
    atsAnalysis: atsAnalysis.result,
    userId: session.userId,
    sessionId: session.id,
  })

  if (!rewriteResult.success || !rewriteResult.optimizedCvState) {
    const nextAgentState: Session['agentState'] = {
      ...session.agentState,
      atsAnalysis,
      rewriteStatus: 'failed',
      atsWorkflowRun: buildWorkflowRun(session, {
        status: 'failed',
        currentStage: 'rewrite_section',
        sectionAttempts: rewriteResult.diagnostics?.sectionAttempts ?? {},
        retriedSections: rewriteResult.diagnostics?.retriedSections ?? [],
        compactedSections: rewriteResult.diagnostics?.compactedSections ?? [],
        usageTotals: {
          sectionAttempts: Object.values(rewriteResult.diagnostics?.sectionAttempts ?? {}).reduce((total, value) => total + (value ?? 0), 0),
          retriedSections: rewriteResult.diagnostics?.retriedSections.length ?? 0,
          compactedSections: rewriteResult.diagnostics?.compactedSections.length ?? 0,
        },
        lastFailureStage: 'rewrite_section',
        lastFailureReason: rewriteResult.error ?? 'Full ATS rewrite failed.',
      }),
    }
    await persistAgentState(session, nextAgentState)
    logError('agent.ats_enhancement.failed', {
      workflowMode: 'ats_enhancement',
      sessionId: session.id,
      userId: session.userId,
      stage: 'rewrite_section',
      success: false,
      retriedSections: rewriteResult.diagnostics?.retriedSections.length ?? 0,
      compactedSections: rewriteResult.diagnostics?.compactedSections.length ?? 0,
      errorMessage: rewriteResult.error ?? 'Full ATS rewrite failed.',
    })
    return {
      success: false,
      atsAnalysis,
      error: rewriteResult.error ?? 'Full ATS rewrite failed.',
    }
  }

  logInfo('agent.ats_enhancement.rewrite_completed', {
    workflowMode: 'ats_enhancement',
    sessionId: session.id,
    userId: session.userId,
    stage: 'rewrite_section',
    sectionAttempts: Object.values(rewriteResult.diagnostics?.sectionAttempts ?? {}).reduce((total, value) => total + (value ?? 0), 0),
    retriedSections: rewriteResult.diagnostics?.retriedSections.length ?? 0,
    compactedSections: rewriteResult.diagnostics?.compactedSections.length ?? 0,
  })

  const validation = validateRewrite(session.cvState, rewriteResult.optimizedCvState)
  const optimizedAt = new Date().toISOString()
  const nextAgentState: Session['agentState'] = {
    ...session.agentState,
    workflowMode: 'ats_enhancement',
    atsAnalysis,
    rewriteStatus: validation.valid ? 'completed' : 'failed',
    optimizedCvState: validation.valid ? rewriteResult.optimizedCvState : undefined,
    optimizedAt: validation.valid ? optimizedAt : undefined,
    optimizationSummary: validation.valid ? rewriteResult.summary : undefined,
    lastRewriteMode: validation.valid ? 'ats_enhancement' : session.agentState.lastRewriteMode,
    rewriteValidation: validation,
    atsWorkflowRun: buildWorkflowRun(session, {
      status: validation.valid ? 'completed' : 'failed',
      currentStage: validation.valid ? 'persist_version' : 'validation',
      sectionAttempts: rewriteResult.diagnostics?.sectionAttempts ?? {},
      retriedSections: rewriteResult.diagnostics?.retriedSections ?? [],
      compactedSections: rewriteResult.diagnostics?.compactedSections ?? [],
      usageTotals: {
        sectionAttempts: Object.values(rewriteResult.diagnostics?.sectionAttempts ?? {}).reduce((total, value) => total + (value ?? 0), 0),
        retriedSections: rewriteResult.diagnostics?.retriedSections.length ?? 0,
        compactedSections: rewriteResult.diagnostics?.compactedSections.length ?? 0,
      },
      lastFailureStage: validation.valid ? undefined : 'validation',
      lastFailureReason: validation.valid ? undefined : 'ATS rewrite validation failed.',
    }),
  }

  await persistAgentState(session, nextAgentState)

  if (!validation.valid) {
    logWarn('agent.ats_enhancement.validation_failed', {
      workflowMode: 'ats_enhancement',
      sessionId: session.id,
      userId: session.userId,
      stage: 'validation',
      success: false,
      issueCount: validation.issues.length,
    })
    return {
      success: false,
      atsAnalysis,
      validation,
      error: 'ATS rewrite validation failed.',
    }
  }

  const validatedOptimizedCvState = rewriteResult.optimizedCvState

  try {
    await executeWithStageRetry(
      async (attempt) => {
        session.agentState.atsWorkflowRun = buildWorkflowRun(session, {
          status: 'running',
          currentStage: 'persist_version',
          attemptCount: attempt,
        })
        await createCvVersion({
          sessionId: session.id,
          snapshot: validatedOptimizedCvState,
          source: 'ats-enhancement',
        })
      },
      {
        onRetry: (_error, attempt) => {
          logWarn('agent.ats_enhancement.retry', {
            workflowMode: 'ats_enhancement',
            sessionId: session.id,
            userId: session.userId,
            stage: 'persist_version',
            attempt: attempt + 1,
          })
        },
      },
    )
  } catch (error) {
    const failedAgentState: Session['agentState'] = {
      ...session.agentState,
      rewriteStatus: 'failed',
      optimizedCvState: undefined,
      optimizedAt: undefined,
      optimizationSummary: undefined,
      lastRewriteMode: session.agentState.lastRewriteMode,
      atsWorkflowRun: buildWorkflowRun(session, {
        status: 'failed',
        currentStage: 'persist_version',
        lastFailureStage: 'persist_version',
        lastFailureReason: error instanceof Error ? error.message : 'Failed to persist ATS version.',
      }),
    }
    await persistAgentState(session, failedAgentState)
    logError('agent.ats_enhancement.failed', {
      workflowMode: 'ats_enhancement',
      sessionId: session.id,
      userId: session.userId,
      stage: 'persist_version',
      success: false,
      ...serializeError(error),
    })
    return {
      success: false,
      atsAnalysis,
      validation,
      error: error instanceof Error ? error.message : 'Failed to persist ATS version.',
    }
  }

  const completedAgentState: Session['agentState'] = {
    ...session.agentState,
    atsWorkflowRun: buildWorkflowRun(session, {
      status: 'completed',
      currentStage: 'persist_version',
      lastFailureStage: undefined,
      lastFailureReason: undefined,
    }),
  }
  await persistAgentState(session, completedAgentState)
  logInfo('agent.ats_enhancement.completed', {
    workflowMode: 'ats_enhancement',
    sessionId: session.id,
    userId: session.userId,
    stage: 'persist_version',
    success: true,
    issueCount: validation.issues.length,
    sectionAttempts: Object.values(rewriteResult.diagnostics?.sectionAttempts ?? {}).reduce((total, value) => total + (value ?? 0), 0),
    retriedSections: rewriteResult.diagnostics?.retriedSections.length ?? 0,
    compactedSections: rewriteResult.diagnostics?.compactedSections.length ?? 0,
  })

  return {
    success: true,
    atsAnalysis,
    optimizedCvState: rewriteResult.optimizedCvState,
    optimizationSummary: rewriteResult.summary,
    validation,
  }
}
