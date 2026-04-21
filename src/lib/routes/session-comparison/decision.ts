import { scoreATS } from '@/lib/ats/score'
import {
  buildAtsReadinessContractForEnhancement,
} from '@/lib/ats/scoring'
import {
  getPreviewLockSummary,
  sanitizeGeneratedCvStateForClient,
} from '@/lib/generated-preview/locked-preview'
import { buildResumeTextFromCvState } from '@/lib/profile/ats-enhancement'

import type { SessionComparisonContext, SessionComparisonDecision } from './types'

function resolveGenerationType(
  lastRewriteMode?: string,
): Extract<SessionComparisonDecision, { kind: 'success' }>['body']['generationType'] {
  return lastRewriteMode === 'job_targeting' ? 'JOB_TARGETING' : 'ATS_ENHANCEMENT'
}

function resolveScoreLabel(
  generationType: Extract<SessionComparisonDecision, { kind: 'success' }>['body']['generationType'],
): string {
  return generationType === 'JOB_TARGETING' ? 'Aderencia a vaga' : 'ATS Readiness Score'
}

export async function decideSessionComparison(
  context: SessionComparisonContext,
): Promise<SessionComparisonDecision> {
  const optimizedCvState = sanitizeGeneratedCvStateForClient(
    context.session.agentState.optimizedCvState,
    context.session.generatedOutput,
    'optimized',
  )
  if (!optimizedCvState) {
    return {
      kind: 'no_optimized_resume',
      status: 409,
      body: { error: 'No optimized resume found for this session.' },
    }
  }

  const generationType = resolveGenerationType(
    context.session.agentState.lastRewriteMode ?? context.session.agentState.workflowMode,
  )
  const label = resolveScoreLabel(generationType)
  const targetJobDescription = context.session.agentState.targetJobDescription

  try {
    const atsReadiness = generationType === 'ATS_ENHANCEMENT'
      ? buildAtsReadinessContractForEnhancement({
          originalCvState: context.session.cvState,
          optimizedCvState,
          rewriteValidation: context.session.agentState.rewriteValidation,
          optimizationSummary: context.session.agentState.optimizationSummary,
          previousContract: context.session.agentState.atsReadiness,
        })
      : undefined

    const originalResumeText = buildResumeTextFromCvState(context.session.cvState)
    const optimizedResumeText = buildResumeTextFromCvState(optimizedCvState)

    const originalScore = generationType === 'ATS_ENHANCEMENT' && atsReadiness
      ? atsReadiness.displayedReadinessScoreBefore
      : scoreATS(originalResumeText, targetJobDescription).total
    const optimizedScore = generationType === 'ATS_ENHANCEMENT' && atsReadiness
      ? atsReadiness.displayedReadinessScoreAfter
      : scoreATS(optimizedResumeText, targetJobDescription).total

    return {
      kind: 'success',
      body: {
        sessionId: context.session.id,
        workflowMode: context.session.agentState.workflowMode,
        generationType,
        targetJobDescription,
        originalCvState: context.session.cvState,
        optimizedCvState,
        previewLock: getPreviewLockSummary(context.session.generatedOutput),
        optimizationSummary: context.session.agentState.optimizationSummary,
        atsReadiness,
        originalScore: {
          total: originalScore,
          label,
        },
        optimizedScore: {
          total: optimizedScore,
          label,
        },
      },
    }
  } catch {
    return {
      kind: 'internal_error',
      status: 500,
      body: { error: 'Internal server error' },
    }
  }
}
