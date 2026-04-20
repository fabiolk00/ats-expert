import { processQueuedArtifactGenerationJobs } from '@/lib/jobs/runtime'
import { resolveExportGenerationConfig } from '@/lib/jobs/config'
import { logError, logInfo, serializeError } from '@/lib/observability/structured-log'

async function main(): Promise<void> {
  const config = resolveExportGenerationConfig()

  logInfo('export.worker.started', {
    runtimeRole: config.runtimeRole,
    maxConcurrency: config.maxConcurrency,
    maxPerUser: config.maxPerUser,
    pollIntervalMs: config.workerPollIntervalMs,
    claimBatchSize: config.workerClaimBatchSize,
  })

  while (true) {
    try {
      const started = await processQueuedArtifactGenerationJobs()
      logInfo('export.worker.tick', {
        startedJobs: started,
      })
    } catch (error) {
      logError('export.worker.tick_failed', {
        ...serializeError(error),
      })
    }

    await new Promise((resolve) => {
      setTimeout(resolve, config.workerPollIntervalMs)
    })
  }
}

void main()
