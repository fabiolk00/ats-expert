import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import {
  buildAtsReadinessContractForEnhancement,
  buildBaselineAtsReadinessContract,
} from '@/lib/ats/scoring'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import {
  sanitizeGeneratedCvStateForClient,
  sanitizeGeneratedOutputForClient,
} from '@/lib/generated-preview/locked-preview'
import { listJobsForSession } from '@/lib/jobs/repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const atsReadiness = session.agentState.atsReadiness
      ?? (
        session.agentState.workflowMode === 'ats_enhancement' && session.agentState.optimizedCvState
          ? buildAtsReadinessContractForEnhancement({
              originalCvState: session.cvState,
              optimizedCvState: session.agentState.optimizedCvState,
              rewriteValidation: session.agentState.rewriteValidation,
              optimizationSummary: session.agentState.optimizationSummary,
            })
          : session.agentState.workflowMode === 'ats_enhancement'
            ? buildBaselineAtsReadinessContract({
                cvState: session.cvState,
              })
            : undefined
      )

    const targets = await getResumeTargetsForSession(session.id)
    const jobs = await listJobsForSession({
      userId: appUser.id,
      sessionId: session.id,
      limit: 10,
    })

    return NextResponse.json({
      session: {
        id: session.id,
        phase: session.phase,
        stateVersion: session.stateVersion,
        cvState: session.cvState,
        agentState: {
          workflowMode: session.agentState.workflowMode,
          parseStatus: session.agentState.parseStatus,
          parseError: session.agentState.parseError,
          parseConfidenceScore: session.agentState.parseConfidenceScore,
          targetJobDescription: session.agentState.targetJobDescription,
          targetFitAssessment: session.agentState.targetFitAssessment,
          gapAnalysis: session.agentState.gapAnalysis,
          targetingPlan: session.agentState.targetingPlan,
          atsAnalysis: session.agentState.atsAnalysis,
          atsReadiness,
          atsWorkflowRun: session.agentState.atsWorkflowRun,
          rewriteStatus: session.agentState.rewriteStatus,
          optimizedCvState: sanitizeGeneratedCvStateForClient(
            session.agentState.optimizedCvState,
            session.generatedOutput,
            'optimized',
          ),
          optimizedAt: session.agentState.optimizedAt,
          optimizationSummary: session.agentState.optimizationSummary,
          lastRewriteMode: session.agentState.lastRewriteMode,
          rewriteValidation: session.agentState.rewriteValidation,
        },
        generatedOutput: sanitizeGeneratedOutputForClient(session.generatedOutput),
        atsReadiness,
        atsScore: session.atsScore,
        messageCount: session.messageCount,
        creditConsumed: session.creditConsumed,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      jobs,
      targets: targets.map((target) => ({
        ...target,
        derivedCvState: sanitizeGeneratedCvStateForClient(
          target.derivedCvState,
          target.generatedOutput,
          'target',
        ) ?? target.derivedCvState,
        generatedOutput: sanitizeGeneratedOutputForClient(target.generatedOutput),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
