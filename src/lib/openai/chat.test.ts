import { APIError } from 'openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  callOpenAIWithRetry,
  getOpenAICircuitSnapshotForTest,
  OpenAICircuitOpenError,
  OpenAIRequestTimeoutError,
  resetOpenAICircuitBreakerForTest,
  resolveOpenAIProtectionConfig,
} from './chat'

const { logInfo, logWarn } = vi.hoisted(() => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}))

vi.mock('@/lib/observability/structured-log', () => ({
  logInfo,
  logWarn,
}))

function buildRetryableApiError(status = 503, retryAfterSeconds?: number): APIError {
  const headers = new Headers()
  if (retryAfterSeconds !== undefined) {
    headers.set('retry-after', String(retryAfterSeconds))
  }

  return new APIError(status, { message: 'retry later' }, undefined, headers)
}

describe('openai chat resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetOpenAICircuitBreakerForTest()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves protection config from env with safe fallbacks', () => {
    expect(resolveOpenAIProtectionConfig({
      OPENAI_CIRCUIT_FAILURE_THRESHOLD: '5',
      OPENAI_CIRCUIT_OPEN_MS: '45000',
      OPENAI_MAX_BACKOFF_MS: '12000',
    } as unknown as NodeJS.ProcessEnv)).toEqual({
      circuitFailureThreshold: 5,
      circuitOpenMs: 45000,
      maxBackoffMs: 12000,
    })

    expect(resolveOpenAIProtectionConfig({
      OPENAI_CIRCUIT_FAILURE_THRESHOLD: '0',
      OPENAI_CIRCUIT_OPEN_MS: '-1',
      OPENAI_MAX_BACKOFF_MS: 'abc',
    } as unknown as NodeJS.ProcessEnv)).toEqual({
      circuitFailureThreshold: 3,
      circuitOpenMs: 30000,
      maxBackoffMs: 30000,
    })
  })

  it('times out slow provider calls instead of hanging indefinitely', async () => {
    const promise = callOpenAIWithRetry(
      (signal) => new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Request aborted', 'AbortError'))
        })
      }),
      1,
      50,
      undefined,
      { operation: 'resume_ingestion', stage: 'structured_extraction' },
    )
    const capturedErrorPromise = promise.catch((error) => error)
    await vi.advanceTimersByTimeAsync(50)
    const capturedError = await capturedErrorPromise

    expect(capturedError).toBeInstanceOf(OpenAIRequestTimeoutError)
    expect(logWarn).toHaveBeenCalledWith(
      'openai.request.timeout',
      expect.objectContaining({
        operation: 'resume_ingestion',
        stage: 'structured_extraction',
        timeoutMs: 50,
      }),
    )
  })

  it('opens the circuit after repeated retryable provider failures and short-circuits subsequent calls', async () => {
    const request = () => callOpenAIWithRetry(
      () => Promise.reject(buildRetryableApiError()),
      1,
      1000,
      undefined,
      { operation: 'gap_analysis', workflowMode: 'job_targeting' },
    )

    await expect(request()).rejects.toBeInstanceOf(APIError)
    await expect(request()).rejects.toBeInstanceOf(APIError)
    await expect(request()).rejects.toBeInstanceOf(APIError)

    expect(getOpenAICircuitSnapshotForTest()).toMatchObject({
      state: 'open',
      consecutiveFailures: 3,
    })

    await expect(request()).rejects.toBeInstanceOf(OpenAICircuitOpenError)
    expect(logWarn).toHaveBeenCalledWith(
      'openai.circuit.open',
      expect.objectContaining({
        operation: 'gap_analysis',
        workflowMode: 'job_targeting',
        breakerState: 'open',
      }),
    )
    expect(logWarn).toHaveBeenCalledWith(
      'openai.circuit.short_circuit',
      expect.objectContaining({
        operation: 'gap_analysis',
        workflowMode: 'job_targeting',
      }),
    )
  })

  it('moves to half-open after the cooldown and closes again when a probe succeeds', async () => {
    const failingRequest = () => callOpenAIWithRetry(
      () => Promise.reject(buildRetryableApiError()),
      1,
      1000,
      undefined,
      { operation: 'rewrite_section', workflowMode: 'ats_enhancement' },
    )

    await expect(failingRequest()).rejects.toBeInstanceOf(APIError)
    await expect(failingRequest()).rejects.toBeInstanceOf(APIError)
    await expect(failingRequest()).rejects.toBeInstanceOf(APIError)

    await vi.advanceTimersByTimeAsync(30_000)

    const success = await callOpenAIWithRetry(
      () => Promise.resolve({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      } as never),
      1,
      1000,
      undefined,
      { operation: 'rewrite_section', workflowMode: 'ats_enhancement' },
    )

    expect(success).toBeTruthy()
    expect(getOpenAICircuitSnapshotForTest()).toMatchObject({
      state: 'closed',
      consecutiveFailures: 0,
    })
    expect(logInfo).toHaveBeenCalledWith(
      'openai.circuit.half_open',
      expect.objectContaining({
        operation: 'rewrite_section',
        workflowMode: 'ats_enhancement',
        breakerState: 'half_open',
      }),
    )
    expect(logInfo).toHaveBeenCalledWith(
      'openai.circuit.closed',
      expect.objectContaining({
        operation: 'rewrite_section',
        workflowMode: 'ats_enhancement',
        breakerState: 'closed',
      }),
    )
  })

  it('honors retry ceilings and logs retry attempts for transient provider errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(buildRetryableApiError(429, 1))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      })

    const promise = callOpenAIWithRetry(
      () => fn(),
      2,
      1000,
      undefined,
      { operation: 'agent_stream', requestKind: 'stream' },
    )

    await vi.advanceTimersByTimeAsync(1000)
    const result = await promise

    expect(result).toBeTruthy()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(logWarn).toHaveBeenCalledWith(
      'openai.request.retry',
      expect.objectContaining({
        operation: 'agent_stream',
        requestKind: 'stream',
        attempt: 1,
        nextAttempt: 2,
        delayMs: 1000,
        errorStatus: 429,
      }),
    )
  })
})
