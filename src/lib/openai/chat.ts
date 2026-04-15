import type OpenAI from 'openai'
import { APIError } from 'openai'
import type { Stream } from 'openai/streaming'

import type { WorkflowMode } from '@/types/agent'
import { logInfo, logWarn } from '@/lib/observability/structured-log'

const OPENAI_RETRYABLE_STATUS_CODES = [429, 500, 502, 503] as const
const DEFAULT_OPENAI_CIRCUIT_FAILURE_THRESHOLD = 3
const DEFAULT_OPENAI_CIRCUIT_OPEN_MS = 30_000
const DEFAULT_OPENAI_MAX_BACKOFF_MS = 30_000

type CircuitState = 'closed' | 'open' | 'half_open'

export type OpenAIProtectionContext = {
  operation?: string
  workflowMode?: WorkflowMode
  stage?: string
  requestKind?: 'completion' | 'stream'
  model?: string
  sessionId?: string
  userId?: string
}

type OpenAICircuitSnapshot = {
  state: CircuitState
  consecutiveFailures: number
  openedAt?: number
  openUntil?: number
  halfOpenProbeActive: boolean
}

type CircuitLease = {
  halfOpenProbe: boolean
}

type OpenAIProtectionConfig = {
  circuitFailureThreshold: number
  circuitOpenMs: number
  maxBackoffMs: number
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function resolveOpenAIProtectionConfig(env: NodeJS.ProcessEnv = process.env): OpenAIProtectionConfig {
  return {
    circuitFailureThreshold: parsePositiveInteger(
      env.OPENAI_CIRCUIT_FAILURE_THRESHOLD,
      DEFAULT_OPENAI_CIRCUIT_FAILURE_THRESHOLD,
    ),
    circuitOpenMs: parsePositiveInteger(
      env.OPENAI_CIRCUIT_OPEN_MS,
      DEFAULT_OPENAI_CIRCUIT_OPEN_MS,
    ),
    maxBackoffMs: parsePositiveInteger(
      env.OPENAI_MAX_BACKOFF_MS,
      DEFAULT_OPENAI_MAX_BACKOFF_MS,
    ),
  }
}

function getOpenAIProtectionConfig(): OpenAIProtectionConfig {
  return resolveOpenAIProtectionConfig()
}

let openAICircuitState: OpenAICircuitSnapshot = {
  state: 'closed',
  consecutiveFailures: 0,
  halfOpenProbeActive: false,
}

export class OpenAIRequestTimeoutError extends Error {
  readonly code = 'OPENAI_TIMEOUT'

  constructor(message = 'OpenAI request timed out.') {
    super(message)
    this.name = 'OpenAIRequestTimeoutError'
  }
}

export class OpenAICircuitOpenError extends Error {
  readonly code = 'OPENAI_CIRCUIT_OPEN'

  constructor(message = 'OpenAI circuit breaker is open.') {
    super(message)
    this.name = 'OpenAICircuitOpenError'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getContextFields(context?: OpenAIProtectionContext): Record<string, string | number | boolean | undefined> {
  const config = getOpenAIProtectionConfig()

  return {
    provider: 'openai',
    operation: context?.operation,
    workflowMode: context?.workflowMode,
    stage: context?.stage,
    requestKind: context?.requestKind ?? 'completion',
    model: context?.model,
    sessionId: context?.sessionId,
    userId: context?.userId,
    breakerThreshold: config.circuitFailureThreshold,
    breakerCooldownMs: config.circuitOpenMs,
  }
}

function parseRetryAfterMs(error: unknown): number | null {
  if (!(error instanceof APIError)) return null

  const header = error.headers?.['retry-after']
  if (!header) return null

  const seconds = Number(header)
  if (!Number.isFinite(seconds) || seconds <= 0) return null

  return seconds * 1000
}

function isExternalAbort(error: unknown, externalSignal?: AbortSignal): boolean {
  return Boolean(
    externalSignal?.aborted
    && (error instanceof Error || error instanceof DOMException)
    && error.name === 'AbortError',
  )
}

function isRetryableProviderError(error: unknown): boolean {
  return error instanceof OpenAIRequestTimeoutError
    || (
      error instanceof APIError
      && OPENAI_RETRYABLE_STATUS_CODES.includes(error.status as (typeof OPENAI_RETRYABLE_STATUS_CODES)[number])
    )
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  const config = getOpenAIProtectionConfig()
  const exponentialDelay = Math.pow(2, attempt - 1) * 1000
  const retryAfterMs = parseRetryAfterMs(error)

  return Math.min(
    retryAfterMs != null ? Math.max(retryAfterMs, exponentialDelay) : exponentialDelay,
    config.maxBackoffMs,
  )
}

function enterOpenAICircuit(context?: OpenAIProtectionContext): CircuitLease {
  const now = Date.now()

  if (openAICircuitState.state === 'open') {
    if ((openAICircuitState.openUntil ?? 0) > now) {
      logWarn('openai.circuit.short_circuit', {
        ...getContextFields(context),
        breakerState: openAICircuitState.state,
        consecutiveFailures: openAICircuitState.consecutiveFailures,
        openUntil: openAICircuitState.openUntil,
      })
      throw new OpenAICircuitOpenError()
    }

    openAICircuitState = {
      ...openAICircuitState,
      state: 'half_open',
      halfOpenProbeActive: false,
    }

    logInfo('openai.circuit.half_open', {
      ...getContextFields(context),
      breakerState: 'half_open',
      consecutiveFailures: openAICircuitState.consecutiveFailures,
    })
  }

  if (openAICircuitState.state === 'half_open') {
    if (openAICircuitState.halfOpenProbeActive) {
      logWarn('openai.circuit.short_circuit', {
        ...getContextFields(context),
        breakerState: 'half_open',
        consecutiveFailures: openAICircuitState.consecutiveFailures,
        openUntil: openAICircuitState.openUntil,
      })
      throw new OpenAICircuitOpenError('OpenAI circuit breaker is probing recovery.')
    }

    openAICircuitState = {
      ...openAICircuitState,
      halfOpenProbeActive: true,
    }

    return { halfOpenProbe: true }
  }

  return { halfOpenProbe: false }
}

function recordOpenAICircuitSuccess(lease: CircuitLease, context?: OpenAIProtectionContext): void {
  const previousState = openAICircuitState.state
  const previousFailures = openAICircuitState.consecutiveFailures

  openAICircuitState = {
    state: 'closed',
    consecutiveFailures: 0,
    halfOpenProbeActive: false,
  }

  if (lease.halfOpenProbe || previousState !== 'closed' || previousFailures > 0) {
    logInfo('openai.circuit.closed', {
      ...getContextFields(context),
      previousState,
      previousFailures,
      breakerState: 'closed',
    })
  }
}

function recordOpenAICircuitFailure(error: unknown, lease: CircuitLease, context?: OpenAIProtectionContext): void {
  const config = getOpenAIProtectionConfig()
  const now = Date.now()

  if (lease.halfOpenProbe || openAICircuitState.state === 'half_open') {
    openAICircuitState = {
      state: 'open',
      consecutiveFailures: config.circuitFailureThreshold,
      openedAt: now,
      openUntil: now + config.circuitOpenMs,
      halfOpenProbeActive: false,
    }

    logWarn('openai.circuit.open', {
      ...getContextFields(context),
      breakerState: 'open',
      consecutiveFailures: openAICircuitState.consecutiveFailures,
      reason: error instanceof Error ? error.name : 'half_open_probe_failed',
      openForMs: config.circuitOpenMs,
      openUntil: openAICircuitState.openUntil,
    })
    return
  }

  const consecutiveFailures = openAICircuitState.consecutiveFailures + 1
  const shouldOpen = consecutiveFailures >= config.circuitFailureThreshold

  openAICircuitState = shouldOpen
    ? {
        state: 'open',
        consecutiveFailures,
        openedAt: now,
        openUntil: now + config.circuitOpenMs,
        halfOpenProbeActive: false,
      }
    : {
        ...openAICircuitState,
        state: 'closed',
        consecutiveFailures,
        halfOpenProbeActive: false,
      }

  if (shouldOpen) {
    logWarn('openai.circuit.open', {
      ...getContextFields(context),
      breakerState: 'open',
      consecutiveFailures,
      reason: error instanceof Error ? error.name : 'retryable_provider_failure',
      openForMs: config.circuitOpenMs,
      openUntil: openAICircuitState.openUntil,
    })
  }
}

async function callOpenAIWithRetryGeneric<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  maxRetries = 3,
  timeoutMs?: number,
  externalSignal?: AbortSignal,
  protectionContext?: OpenAIProtectionContext,
): Promise<T> {
  const lease = enterOpenAICircuit(protectionContext)
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (externalSignal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    let controller: AbortController | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let onExternalAbort: (() => void) | undefined
    let timedOut = false

    try {
      controller = new AbortController()

      if (timeoutMs) {
        timer = setTimeout(() => {
          timedOut = true
          controller?.abort()
        }, timeoutMs)
      }

      if (externalSignal) {
        onExternalAbort = () => controller?.abort()
        externalSignal.addEventListener('abort', onExternalAbort)
      }

      const result = await fn(controller.signal)
      recordOpenAICircuitSuccess(lease, protectionContext)
      return result
    } catch (error) {
      const normalizedError = timedOut
        ? new OpenAIRequestTimeoutError()
        : error as Error
      lastError = normalizedError

      if (isExternalAbort(normalizedError, externalSignal)) {
        throw normalizedError
      }

      if (timedOut) {
        logWarn('openai.request.timeout', {
          ...getContextFields(protectionContext),
          attempt,
          timeoutMs,
          breakerState: openAICircuitState.state,
        })
      }

      const retryable = isRetryableProviderError(normalizedError)
      if (!retryable || attempt === maxRetries) {
        if (retryable) {
          recordOpenAICircuitFailure(normalizedError, lease, protectionContext)
        } else if (lease.halfOpenProbe) {
          openAICircuitState = {
            ...openAICircuitState,
            halfOpenProbeActive: false,
          }
        }
        throw normalizedError
      }

      const delay = getRetryDelayMs(normalizedError, attempt)
      logWarn('openai.request.retry', {
        ...getContextFields(protectionContext),
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
        breakerState: openAICircuitState.state,
        errorName: normalizedError.name,
        errorStatus: normalizedError instanceof APIError ? normalizedError.status : undefined,
      })
      await sleep(delay)
    } finally {
      if (timer) clearTimeout(timer)
      if (onExternalAbort && externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort)
      }
    }
  }

  if (lease.halfOpenProbe) {
    openAICircuitState = {
      ...openAICircuitState,
      halfOpenProbeActive: false,
    }
  }

  throw lastError
}

export async function callOpenAIWithRetry(
  fn: (signal?: AbortSignal) => Promise<OpenAI.Chat.Completions.ChatCompletion>,
  maxRetries = 3,
  timeoutMs?: number,
  externalSignal?: AbortSignal,
  protectionContext?: OpenAIProtectionContext,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return callOpenAIWithRetryGeneric(
    fn,
    maxRetries,
    timeoutMs,
    externalSignal,
    {
      requestKind: 'completion',
      ...protectionContext,
    },
  )
}

async function createChatCompletionWithRetry(
  openaiClient: OpenAI,
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  maxRetries = 3,
  timeoutMs?: number,
  externalSignal?: AbortSignal,
  protectionContext?: OpenAIProtectionContext,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return callOpenAIWithRetryGeneric(
    (signal) => openaiClient.chat.completions.create(params, { signal }),
    maxRetries,
    timeoutMs,
    externalSignal,
    {
      requestKind: 'completion',
      ...protectionContext,
    },
  )
}

export async function createChatCompletionStreamWithRetry(
  openaiClient: OpenAI,
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
  maxRetries = 3,
  timeoutMs?: number,
  externalSignal?: AbortSignal,
  protectionContext?: OpenAIProtectionContext,
): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  return callOpenAIWithRetryGeneric(
    (signal) => openaiClient.chat.completions.create(params, { signal }) as Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>,
    maxRetries,
    timeoutMs,
    externalSignal,
    {
      requestKind: 'stream',
      ...protectionContext,
    },
  )
}

export function getChatCompletionText(response: OpenAI.Chat.Completions.ChatCompletion): string {
  return response.choices[0]?.message?.content ?? ''
}

export function getChatCompletionUsage(response: OpenAI.Chat.Completions.ChatCompletion): {
  inputTokens: number
  outputTokens: number
} {
  return {
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }
}

export function resetOpenAICircuitBreakerForTest(): void {
  openAICircuitState = {
    state: 'closed',
    consecutiveFailures: 0,
    halfOpenProbeActive: false,
  }
}

export function getOpenAICircuitSnapshotForTest(): OpenAICircuitSnapshot {
  return { ...openAICircuitState }
}

export { createChatCompletionWithRetry }
