import { NextRequest, NextResponse } from 'next/server'

import { dispatchToolWithContext } from '@/lib/agent/tools'
import { validateGenerationCvState } from '@/lib/agent/tools/generate-file'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { CVStateSchema } from '@/lib/cv/schema'
import { checkUserQuota } from '@/lib/db/sessions'
import {
  assessAtsEnhancementReadiness,
  buildResumeTextFromCvState,
  getAtsEnhancementBlockingItems,
} from '@/lib/profile/ats-enhancement'
import { createSession, applyToolPatchWithVersion } from '@/lib/db/sessions'
import { runAtsEnhancementPipeline } from '@/lib/agent/ats-enhancement-pipeline'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = CVStateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const readiness = assessAtsEnhancementReadiness(parsed.data)
  const missingItems = getAtsEnhancementBlockingItems(parsed.data)
  if (!readiness.isReady || missingItems.length > 0) {
    return NextResponse.json({
      error: 'Complete seu curriculo para gerar uma versao ATS.',
      reasons: missingItems.length > 0 ? missingItems : readiness.reasons,
      missingItems,
    }, { status: 400 })
  }

  const hasCredits = await checkUserQuota(appUser.id)
  if (!hasCredits) {
    return NextResponse.json({
      error: 'Seus creditos acabaram. Recarregue seu saldo para gerar uma versao ATS.',
    }, { status: 402 })
  }

  const generationValidation = validateGenerationCvState(parsed.data)
  if (!generationValidation.success) {
    return NextResponse.json({
      error: 'Complete seu curriculo para gerar uma versao ATS.',
      reasons: [generationValidation.errorMessage],
      missingItems: [generationValidation.errorMessage],
    }, { status: 400 })
  }

  const session = await createSession(appUser.id)

  await applyToolPatchWithVersion(session, {
    cvState: parsed.data,
    agentState: {
      parseStatus: 'parsed',
      sourceResumeText: buildResumeTextFromCvState(parsed.data),
      workflowMode: 'ats_enhancement',
    },
  }, 'manual')

  const pipeline = await runAtsEnhancementPipeline(session)
  if (!pipeline.success || !pipeline.optimizedCvState) {
    return NextResponse.json({
      error: pipeline.error ?? 'Nao foi possivel melhorar sua versao ATS agora.',
      reasons: pipeline.validation?.issues.map((issue) => issue.message),
    }, { status: 500 })
  }

  const generationResult = await dispatchToolWithContext('generate_file', {
    cv_state: pipeline.optimizedCvState,
    idempotency_key: `profile-ats:${session.id}`,
  }, session)

  if (generationResult.outputFailure) {
    return NextResponse.json({
      error: generationResult.outputFailure.error,
      code: generationResult.outputFailure.code,
    }, { status: 500 })
  }

  const output = generationResult.output as {
    creditsUsed?: number
    resumeGenerationId?: string
  }

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    creditsUsed: output.creditsUsed ?? 0,
    resumeGenerationId: output.resumeGenerationId,
    generationType: 'ATS_ENHANCEMENT',
  })
}
