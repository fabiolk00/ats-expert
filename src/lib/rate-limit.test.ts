import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockLimit,
  mockRedisConstructor,
  mockRatelimitConstructor,
  mockSlidingWindow,
} = vi.hoisted(() => ({
  mockLimit: vi.fn(async (_identifier: unknown) => ({
    success: true,
    limit: 30,
    remaining: 29,
    reset: 0,
    pending: Promise.resolve(),
  })),
  mockRedisConstructor: vi.fn(),
  mockRatelimitConstructor: vi.fn(),
  mockSlidingWindow: vi.fn((limit: number, window: string) => ({ limit, window })),
}))

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor(options: unknown) {
      mockRedisConstructor(options)
    }
  },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow(limit: number, window: string) {
      return mockSlidingWindow(limit, window)
    }

    constructor(options: unknown) {
      mockRatelimitConstructor(options)
    }

    limit(identifier: unknown) {
      return mockLimit(identifier)
    }
  },
}))

const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL
const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetModules()

  if (originalRedisUrl === undefined) {
    delete process.env.UPSTASH_REDIS_REST_URL
  } else {
    process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl
  }

  if (originalRedisToken === undefined) {
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  } else {
    process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken
  }
})

describe('rate limiter config', () => {
  it('stays importable until a limiter is used and then fails with the missing Redis URL', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { agentLimiter } = await import('./rate-limit')

    expect(mockRedisConstructor).not.toHaveBeenCalled()
    expect(mockRatelimitConstructor).not.toHaveBeenCalled()

    expect(() => agentLimiter.limit('usr_123')).toThrowError(
      'Missing required environment variable UPSTASH_REDIS_REST_URL for rate limiter.',
    )

    expect(mockRedisConstructor).not.toHaveBeenCalled()
    expect(mockRatelimitConstructor).not.toHaveBeenCalled()
  })

  it('throws an actionable error when the Redis token is missing', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io'
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { webhookLimiter } = await import('./rate-limit')

    expect(() => webhookLimiter.limit('token_123')).toThrowError(
      'Missing required environment variable UPSTASH_REDIS_REST_TOKEN for rate limiter.',
    )
  })
})
