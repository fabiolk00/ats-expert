import { afterEach, describe, expect, it, vi } from 'vitest'

import { logError, logInfo, serializeError } from './structured-log'

describe('structured-log', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes structured JSON and omits undefined fields', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    logInfo('agent.request.completed', {
      sessionId: 'sess_123',
      appUserId: 'usr_123',
      latencyMs: 123,
      optionalField: undefined,
    })

    expect(infoSpy).toHaveBeenCalledTimes(1)

    const rawPayload = infoSpy.mock.calls[0]?.[0]
    expect(typeof rawPayload).toBe('string')

    const payload = JSON.parse(rawPayload as string) as Record<string, unknown>

    expect(payload).toMatchObject({
      level: 'info',
      event: 'agent.request.completed',
      sessionId: 'sess_123',
      appUserId: 'usr_123',
      latencyMs: 123,
    })
    expect(payload.timestamp).toEqual(expect.any(String))
    expect(payload).not.toHaveProperty('optionalField')
  })

  it('serializes errors without exposing stacks or arbitrary fields', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logError('agent.request.failed', {
      sessionId: 'sess_123',
      ...serializeError({
        name: 'RateLimitError',
        message: 'Too many requests',
        code: 'RL_429',
        status: 429,
        stack: 'sensitive stack trace',
        rawBody: 'sensitive raw body',
      }),
    })

    expect(errorSpy).toHaveBeenCalledTimes(1)

    const rawPayload = errorSpy.mock.calls[0]?.[0]
    expect(typeof rawPayload).toBe('string')

    const payload = JSON.parse(rawPayload as string) as Record<string, unknown>

    expect(payload).toMatchObject({
      level: 'error',
      event: 'agent.request.failed',
      sessionId: 'sess_123',
      errorName: 'RateLimitError',
      errorMessage: 'Too many requests',
      errorCode: 'RL_429',
      errorStatus: 429,
    })
    expect(payload).not.toHaveProperty('stack')
    expect(payload).not.toHaveProperty('rawBody')
  })
})
