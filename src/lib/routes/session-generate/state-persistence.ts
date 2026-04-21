import type { ResumeTarget, Session } from '@/types/agent'

import { getResumeTargetForSession, updateResumeTargetGeneratedOutput } from '@/lib/db/resume-targets'
import { applyGeneratedOutputPatch, getSession } from '@/lib/db/sessions'

import type { SessionGenerateContext } from './types'

export async function persistGeneratingState(input: {
  session: Session
  targetId?: string
}): Promise<void> {
  if (input.targetId) {
    await updateResumeTargetGeneratedOutput(input.session.id, input.targetId, {
      status: 'generating',
      error: undefined,
    })
    return
  }

  await applyGeneratedOutputPatch(input.session, {
    status: 'generating',
    error: undefined,
  })
}

function hasReadyGeneratedArtifact(input: {
  session: Session
  target?: ResumeTarget | null
  scope: 'base' | 'target'
}): boolean {
  const generatedOutput = input.scope === 'target'
    ? input.target?.generatedOutput
    : input.session.generatedOutput

  return generatedOutput?.status === 'ready' && Boolean(generatedOutput.pdfPath)
}

export async function resolveCompletedArtifactFallback(
  context: SessionGenerateContext,
) {
  const refreshedSession = await getSession(context.params.id, context.appUser.id)
  const refreshedTarget = context.scope === 'target' && context.target?.id
    ? await getResumeTargetForSession(context.params.id, context.target.id)
    : context.target

  if (refreshedSession && hasReadyGeneratedArtifact({
    session: refreshedSession,
    target: refreshedTarget,
    scope: context.scope,
  })) {
    return {
      session: refreshedSession,
      target: refreshedTarget,
    }
  }

  return null
}

