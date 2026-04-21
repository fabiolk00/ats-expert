import { createHash } from 'crypto'

import { resolveEffectiveResumeSource } from '@/lib/jobs/source-of-truth'

import type { SessionGenerateContext } from './types'

export function buildArtifactJobIdempotencyKey(input: {
  session: SessionGenerateContext['session']
  target: SessionGenerateContext['target']
  targetId?: string
  clientRequestId?: string
}): string {
  const effectiveSource = resolveEffectiveResumeSource(input.session, input.target)
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({
      sessionId: input.session.id,
      targetId: input.targetId ?? null,
      clientRequestId: input.clientRequestId ?? null,
      dispatchInputRef: effectiveSource.ref,
      sourceCvState: effectiveSource.cvState,
    }))
    .digest('hex')
    .slice(0, 24)

  return `session-generate:${input.session.id}:${input.targetId ?? 'base'}:${fingerprint}`
}

export function buildRetryArtifactJobIdempotencyKey(input: {
  session: SessionGenerateContext['session']
  target: SessionGenerateContext['target']
  targetId?: string
  retryOfJobId: string
}): string {
  const effectiveSource = resolveEffectiveResumeSource(input.session, input.target)
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({
      sessionId: input.session.id,
      targetId: input.targetId ?? null,
      retryOfJobId: input.retryOfJobId,
      dispatchInputRef: effectiveSource.ref,
      sourceCvState: effectiveSource.cvState,
    }))
    .digest('hex')
    .slice(0, 24)

  return `session-generate:${input.session.id}:${input.targetId ?? 'base'}:retry:${fingerprint}`
}

