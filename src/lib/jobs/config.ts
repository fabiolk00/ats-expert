const DEFAULT_EXPORT_GENERATION_MAX_CONCURRENCY = 3
const DEFAULT_EXPORT_GENERATION_MAX_PER_USER = 1
const DEFAULT_EXPORT_GENERATION_TIMEOUT_MS = 90_000
const DEFAULT_EXPORT_GENERATION_RETRY_DELAYS_MS = [10_000, 30_000, 120_000]
const DEFAULT_EXPORT_WORKER_POLL_INTERVAL_MS = 2_000
const DEFAULT_EXPORT_WORKER_CLAIM_BATCH_SIZE = 12

type AppRuntimeRole = 'web' | 'worker'

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseRetryDelays(value: string | undefined): number[] {
  if (!value?.trim()) {
    return [...DEFAULT_EXPORT_GENERATION_RETRY_DELAYS_MS]
  }

  const parsed = value
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0)

  return parsed.length > 0 ? parsed : [...DEFAULT_EXPORT_GENERATION_RETRY_DELAYS_MS]
}

export function resolveAppRuntimeRole(env: NodeJS.ProcessEnv = process.env): AppRuntimeRole {
  const value = env.APP_RUNTIME_ROLE?.trim().toLowerCase()
  return value === 'worker' ? 'worker' : 'web'
}

export function resolveExportGenerationConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    runtimeRole: resolveAppRuntimeRole(env),
    maxConcurrency: parsePositiveInt(
      env.EXPORT_GENERATION_MAX_CONCURRENCY,
      DEFAULT_EXPORT_GENERATION_MAX_CONCURRENCY,
    ),
    maxPerUser: parsePositiveInt(
      env.EXPORT_GENERATION_MAX_PER_USER,
      DEFAULT_EXPORT_GENERATION_MAX_PER_USER,
    ),
    timeoutMs: parsePositiveInt(
      env.EXPORT_GENERATION_TIMEOUT_MS,
      DEFAULT_EXPORT_GENERATION_TIMEOUT_MS,
    ),
    retryDelaysMs: parseRetryDelays(env.EXPORT_GENERATION_RETRY_DELAYS_MS),
    workerPollIntervalMs: parsePositiveInt(
      env.EXPORT_WORKER_POLL_INTERVAL_MS,
      DEFAULT_EXPORT_WORKER_POLL_INTERVAL_MS,
    ),
    workerClaimBatchSize: parsePositiveInt(
      env.EXPORT_WORKER_CLAIM_BATCH_SIZE,
      DEFAULT_EXPORT_WORKER_CLAIM_BATCH_SIZE,
    ),
  }
}

