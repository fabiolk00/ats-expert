import { NextRequest, NextResponse } from 'next/server'

import { analyzeAtsGeneral } from '@/lib/agent/tools/ats-analysis'
import { scoreATS } from '@/lib/ats/score'
import {
  getPreviewLockSummary,
  sanitizeGeneratedCvStateForClient,
} from '@/lib/generated-preview/locked-preview'
import { buildResumeTextFromCvState } from '@/lib/profile/ats-enhancement'
import { toNextJsonResponse } from '@/lib/routes/shared/response'
import { resolveSessionComparisonContext } from '@/lib/routes/session-comparison/context'
import type { ResumeComparisonResponse } from '@/types/dashboard'

function resolveGenerationType(lastRewriteMode?: string): ResumeComparisonResponse['generationType'] {
  return lastRewriteMode === 'job_targeting' ? 'JOB_TARGETING' : 'ATS_ENHANCEMENT'
}

function resolveScoreLabel(generationType: ResumeComparisonResponse['generationType']): string {
  return generationType === 'JOB_TARGETING' ? 'Aderência à vaga' : 'Score ATS'
}

// Compatibility-only dashboard surface: keep GET /api/session/[id]/comparison public without repointing consumers.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const contextResult = await resolveSessionComparisonContext(_req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const { session } = contextResult.context
  const optimizedCvState = sanitizeGeneratedCvStateForClient(
    session.agentState.optimizedCvState,
    session.generatedOutput,
    'optimized',
  )
  if (!optimizedCvState) {
    return NextResponse.json({ error: 'No optimized resume found for this session.' }, { status: 409 })
  }

  const generationType = resolveGenerationType(session.agentState.lastRewriteMode ?? session.agentState.workflowMode)
  const label = resolveScoreLabel(generationType)
  const targetJobDescription = session.agentState.targetJobDescription

  try {
    const originalResumeText = buildResumeTextFromCvState(session.cvState)
    const optimizedResumeText = buildResumeTextFromCvState(optimizedCvState)

    const [originalAnalysis, optimizedAnalysis] = generationType === 'ATS_ENHANCEMENT'
      ? await Promise.all([
          analyzeAtsGeneral(session.cvState, session.userId, session.id),
          analyzeAtsGeneral(optimizedCvState, session.userId, session.id),
        ])
      : await Promise.all([
          Promise.resolve({
            success: true,
            result: {
              overallScore: scoreATS(originalResumeText, targetJobDescription).total,
            },
          }),
          Promise.resolve({
            success: true,
            result: {
              overallScore: scoreATS(optimizedResumeText, targetJobDescription).total,
            },
          }),
        ])

    const originalScore = originalAnalysis.success && originalAnalysis.result
      ? originalAnalysis.result.overallScore
      : scoreATS(originalResumeText, targetJobDescription).total
    const optimizedScore = optimizedAnalysis.success && optimizedAnalysis.result
      ? optimizedAnalysis.result.overallScore
      : scoreATS(optimizedResumeText, targetJobDescription).total

    return NextResponse.json({
      sessionId: session.id,
      workflowMode: session.agentState.workflowMode,
      generationType,
      targetJobDescription,
      originalCvState: session.cvState,
      optimizedCvState,
      previewLock: getPreviewLockSummary(session.generatedOutput),
      optimizationSummary: session.agentState.optimizationSummary,
      originalScore: {
        total: originalScore,
        label,
      },
      optimizedScore: {
        total: optimizedScore,
        label,
      },
    } satisfies ResumeComparisonResponse)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
