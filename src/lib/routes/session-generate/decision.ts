import { createOrReuseSessionGenerateJob } from './job-reuse'
import { startSessionGenerateJob } from './job-start'
import { resolveCompletedArtifactFallback } from './artifact-fallback'
import { persistGeneratingState } from './state-persistence'
import type { SessionGenerateContext, SessionGenerateExecutionDecision } from './types'

export async function executeSessionGenerateFlow(
  context: SessionGenerateContext,
): Promise<SessionGenerateExecutionDecision> {
  // Execution order:
  // 1. interpret reuse and retry eligibility
  // 2. start or rejoin durable processing
  // 3. normalize terminal outcomes
  // 4. persist best-effort generating state for in-flight work
  const reusableJob = await createOrReuseSessionGenerateJob(context)
  if (reusableJob.kind === 'blocked_reconciliation') {
    return reusableJob
  }

  const startedJob = await startSessionGenerateJob(context, reusableJob.createdJob.job.jobId)
  const job = startedJob ?? reusableJob.createdJob.job

  if (job.status === 'failed' || job.status === 'cancelled') {
    return { kind: 'failed', job }
  }

  if (job.status === 'completed' && job.terminalResultRef?.kind === 'resume_generation') {
    return { kind: 'completed', job, targetId: context.target?.id }
  }

  if (job.status === 'completed') {
    const completedArtifact = await resolveCompletedArtifactFallback(context)

    if (completedArtifact) {
      return { kind: 'completed', job, targetId: completedArtifact.target?.id }
    }
  }

  await persistGeneratingState({
    session: context.session,
    targetId: context.target?.id,
  })

  if (job.status === 'queued' || job.status === 'running') {
    return { kind: 'in_progress', job, targetId: context.target?.id }
  }

  throw new Error(`Unsupported durable artifact job status: ${job.status}`)
}
