import {
  claimJob,
  completeJob,
  failJob,
  getJob,
  listJobsForProcessing,
  resetStaleJobs,
} from '@/lib/jobs/repository'
import { resolveExportGenerationConfig } from '@/lib/jobs/config'
import { logError, logInfo, logWarn } from '@/lib/observability/structured-log'
import type {
  JobErrorRef,
  JobStatusSnapshot,
  JobType,
} from '@/types/jobs'

import { processAtsEnhancementJob } from './processors/ats-enhancement'
import { processArtifactGenerationJob } from './processors/artifact-generation'
import { processJobTargetingJob } from './processors/job-targeting'
import type { ClaimedJobProcessor } from './processors/shared'

const JOB_PROCESSORS: Record<JobType, ClaimedJobProcessor> = {
  ats_enhancement: processAtsEnhancementJob,
  job_targeting: processJobTargetingJob,
  artifact_generation: processArtifactGenerationJob,
}

const activeArtifactJobs = new Set<string>()
const activeArtifactJobsByUser = new Map<string, number>()

function isArtifactGenerationJob(job: Pick<JobStatusSnapshot, 'type'>): boolean {
  return job.type === 'artifact_generation'
}

function getArtifactConcurrencyState() {
  const config = resolveExportGenerationConfig()

  return {
    maxConcurrency: config.maxConcurrency,
    maxPerUser: config.maxPerUser,
    activeCount: activeArtifactJobs.size,
    activeForUser: (userId: string) => activeArtifactJobsByUser.get(userId) ?? 0,
  }
}

function canStartArtifactJob(job: JobStatusSnapshot): boolean {
  const state = getArtifactConcurrencyState()

  return (
    state.activeCount < state.maxConcurrency
    && state.activeForUser(job.userId) < state.maxPerUser
  )
}

function markArtifactJobStarted(job: JobStatusSnapshot): void {
  activeArtifactJobs.add(job.jobId)
  activeArtifactJobsByUser.set(job.userId, (activeArtifactJobsByUser.get(job.userId) ?? 0) + 1)
}

function markArtifactJobFinished(job: JobStatusSnapshot): void {
  activeArtifactJobs.delete(job.jobId)

  const current = activeArtifactJobsByUser.get(job.userId) ?? 0
  if (current <= 1) {
    activeArtifactJobsByUser.delete(job.userId)
    return
  }

  activeArtifactJobsByUser.set(job.userId, current - 1)
}

function buildRetryDelays(jobType: JobType): number[] {
  if (jobType !== 'artifact_generation') {
    return []
  }

  return resolveExportGenerationConfig().retryDelaysMs
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function buildUnexpectedProcessorErrorRef(
  error: unknown,
): Extract<JobErrorRef, { kind: 'job_error' }> {
  return {
    kind: 'job_error',
    code: 'UNEXPECTED_PROCESSOR_ERROR',
    message: error instanceof Error ? error.message : String(error),
    retryable: true,
  }
}

async function persistProcessorFailure(
  job: JobStatusSnapshot,
  errorRef: JobErrorRef,
  stage?: string,
): Promise<void> {
  if (!job.claimedAt) {
    logError('jobs.runtime.failure_without_claim', {
      jobId: job.jobId,
      userId: job.userId,
      sessionId: job.sessionId,
      resumeTargetId: job.resumeTargetId,
      type: job.type,
      status: job.status,
      stage,
      errorCode: errorRef.kind === 'job_error' ? errorRef.code : 'resume_generation_failure',
      errorMessage: errorRef.kind === 'job_error' ? errorRef.message : errorRef.failureReason,
    })
    return
  }

  await failJob({
    jobId: job.jobId,
    userId: job.userId,
    ownerClaimedAt: job.claimedAt,
    stage,
    errorRef,
  })
}

async function processClaimedJob(job: JobStatusSnapshot): Promise<void> {
  const processor = JOB_PROCESSORS[job.type]
  const processingStartedAt = Date.now()
  if (!processor) {
    await persistProcessorFailure(job, {
      kind: 'job_error',
      code: 'UNSUPPORTED_JOB_TYPE',
      message: `Unsupported job type: ${job.type}`,
      retryable: false,
    })
    return
  }

  logInfo('jobs.runtime.processing_started', {
    jobId: job.jobId,
    userId: job.userId,
    sessionId: job.sessionId,
    resumeTargetId: job.resumeTargetId,
    type: job.type,
    status: job.status,
    stage: job.stage,
    latencyMs: 0,
  })

  try {
    const retryDelays = buildRetryDelays(job.type)
    let attempt = 0

    while (true) {
      const outcome = await processor(job)

      if (!job.claimedAt) {
        throw new Error(`Claimed job ${job.jobId} is missing claimedAt.`)
      }

      if (outcome.ok) {
        await completeJob({
          jobId: job.jobId,
          userId: job.userId,
          ownerClaimedAt: job.claimedAt,
          stage: outcome.stage,
          progress: outcome.progress,
          resultRef: outcome.resultRef,
        })

        logInfo('jobs.runtime.processing_completed', {
          jobId: job.jobId,
          userId: job.userId,
          sessionId: job.sessionId,
          resumeTargetId: job.resumeTargetId,
          type: job.type,
          status: 'completed',
          stage: outcome.stage,
          attempts: attempt + 1,
          latencyMs: Date.now() - processingStartedAt,
        })
        return
      }

      const retryable = outcome.errorRef.kind === 'job_error' && outcome.errorRef.retryable === true
      const nextDelayMs = retryable ? retryDelays[attempt] : undefined

      if (nextDelayMs !== undefined) {
        attempt += 1
        const retryErrorRef = outcome.errorRef.kind === 'job_error'
          ? outcome.errorRef
          : {
              code: 'resume_generation_failure',
              message: outcome.errorRef.failureReason ?? 'Retryable generation failure.',
            }
        logWarn('jobs.runtime.processing_retry_scheduled', {
          jobId: job.jobId,
          userId: job.userId,
          sessionId: job.sessionId,
          resumeTargetId: job.resumeTargetId,
          type: job.type,
          stage: outcome.stage,
          attempt,
          retryDelayMs: nextDelayMs,
          errorCode: retryErrorRef.code,
          errorMessage: retryErrorRef.message,
        })
        await sleep(nextDelayMs)
        continue
      }

      await persistProcessorFailure(job, outcome.errorRef, outcome.stage)

      logWarn('jobs.runtime.processing_failed', {
        jobId: job.jobId,
        userId: job.userId,
        sessionId: job.sessionId,
        resumeTargetId: job.resumeTargetId,
        type: job.type,
        status: 'failed',
        stage: outcome.stage,
        attempts: attempt + 1,
        errorCode: outcome.errorRef.kind === 'job_error'
          ? outcome.errorRef.code
          : 'resume_generation_failure',
        errorMessage: outcome.errorRef.kind === 'job_error'
          ? outcome.errorRef.message
          : outcome.errorRef.failureReason,
        latencyMs: Date.now() - processingStartedAt,
      })
      return
    }
  } catch (error) {
    const errorRef = buildUnexpectedProcessorErrorRef(error)

    logError('jobs.runtime.processing_threw', {
      jobId: job.jobId,
      userId: job.userId,
      sessionId: job.sessionId,
      resumeTargetId: job.resumeTargetId,
      type: job.type,
      status: 'failed',
      stage: job.stage,
      errorCode: errorRef.code,
      errorMessage: errorRef.message,
      latencyMs: Date.now() - processingStartedAt,
    })

    try {
      await persistProcessorFailure(job, errorRef, job.stage)
    } catch (persistError) {
      logError('jobs.runtime.processing_failure_persist_failed', {
        jobId: job.jobId,
        userId: job.userId,
        sessionId: job.sessionId,
        resumeTargetId: job.resumeTargetId,
        type: job.type,
        status: 'failed',
        stage: job.stage,
        errorMessage: persistError instanceof Error ? persistError.message : String(persistError),
        latencyMs: Date.now() - processingStartedAt,
      })
    }
  }
}

export async function startDurableJobProcessing(input: {
  jobId: string
  userId: string
}): Promise<JobStatusSnapshot | null> {
  const runtimeConfig = resolveExportGenerationConfig()
  const currentJob = await getJob(input.jobId, input.userId)

  if (!currentJob) {
    return null
  }

  if (isArtifactGenerationJob(currentJob)) {
    if (runtimeConfig.runtimeRole !== 'worker') {
      return currentJob
    }

    if (!canStartArtifactJob(currentJob)) {
      return currentJob
    }
  }

  const claimed = await claimJob({
    jobId: input.jobId,
    userId: input.userId,
    stage: 'processing',
  })

  if (!claimed) {
    return null
  }

  if (claimed.status !== 'running') {
    return claimed
  }

  if (isArtifactGenerationJob(claimed)) {
    markArtifactJobStarted(claimed)
  }

  queueMicrotask(() => {
    void processClaimedJob(claimed)
      .finally(() => {
        if (isArtifactGenerationJob(claimed)) {
          markArtifactJobFinished(claimed)
        }
      })
  })

  return claimed
}

export function getArtifactProcessingSnapshot() {
  const state = getArtifactConcurrencyState()

  return {
    activeCount: state.activeCount,
    maxConcurrency: state.maxConcurrency,
    maxPerUser: state.maxPerUser,
  }
}

export async function processQueuedArtifactGenerationJobs(): Promise<number> {
  const runtimeConfig = resolveExportGenerationConfig()

  if (runtimeConfig.runtimeRole !== 'worker') {
    return 0
  }

  await resetStaleJobs({ type: 'artifact_generation' })

  const queuedJobs = await listJobsForProcessing({
    type: 'artifact_generation',
    status: 'queued',
    limit: runtimeConfig.workerClaimBatchSize,
  })

  let started = 0
  for (const job of queuedJobs) {
    if (!canStartArtifactJob(job)) {
      break
    }

    const startedJob = await startDurableJobProcessing({
      jobId: job.jobId,
      userId: job.userId,
    })

    if (startedJob?.status === 'running') {
      started += 1
    }
  }

  return started
}
