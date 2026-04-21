import { createJob } from '@/lib/jobs/repository'

import { buildRetryArtifactJobIdempotencyKey } from './keys'
import { isBillingReconciliationPending } from './policy'
import type { SessionGenerateContext } from './types'

export async function createOrReuseSessionGenerateJob(
  context: SessionGenerateContext,
) {
  let createdJob = await createJob({
    userId: context.appUser.id,
    sessionId: context.session.id,
    resumeTargetId: context.target?.id,
    type: 'artifact_generation',
    idempotencyKey: context.primaryIdempotencyKey,
    stage: 'queued',
    dispatchInputRef: context.effectiveSource.ref,
    metadata: {
      scope: context.scope,
      clientRequestId: context.body.clientRequestId ?? null,
    },
  })

  if (
    !context.body.clientRequestId
    && !createdJob.wasCreated
    && isBillingReconciliationPending(createdJob.job)
  ) {
    return { kind: 'blocked_reconciliation' as const, job: createdJob.job }
  }

  if (
    !context.body.clientRequestId
    && !createdJob.wasCreated
    && (createdJob.job.status === 'failed' || createdJob.job.status === 'cancelled')
  ) {
    createdJob = await createJob({
      userId: context.appUser.id,
      sessionId: context.session.id,
      resumeTargetId: context.target?.id,
      type: 'artifact_generation',
      idempotencyKey: buildRetryArtifactJobIdempotencyKey({
        session: context.session,
        target: context.target,
        targetId: context.target?.id,
        retryOfJobId: createdJob.job.jobId,
      }),
      stage: 'queued',
      dispatchInputRef: context.effectiveSource.ref,
      metadata: {
        scope: context.scope,
        retryOf: createdJob.job.jobId,
      },
    })
  }

  return { kind: 'ready' as const, createdJob }
}

