import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockHeaders,
  mockRedisConstructor,
  mockRedisSet,
  mockRedisDel,
  mockWebhookConstructor,
  mockWebhookVerify,
  mockGetOrCreateAppUserByClerkUserId,
  mockSyncClerkUserProfile,
  mockDisableAppUserByClerkUserId,
} = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockRedisConstructor: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
  mockWebhookConstructor: vi.fn(),
  mockWebhookVerify: vi.fn(),
  mockGetOrCreateAppUserByClerkUserId: vi.fn(),
  mockSyncClerkUserProfile: vi.fn(),
  mockDisableAppUserByClerkUserId: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}))

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor(options: unknown) {
      mockRedisConstructor(options)
    }

    set(...args: unknown[]) {
      return mockRedisSet(...args)
    }

    del(...args: unknown[]) {
      return mockRedisDel(...args)
    }
  },
}))

vi.mock('svix', () => ({
  Webhook: class MockWebhook {
    constructor(secret: string) {
      mockWebhookConstructor(secret)
    }

    verify(...args: unknown[]) {
      return mockWebhookVerify(...args)
    }
  },
}))

vi.mock('@/lib/auth/app-user', () => ({
  getOrCreateAppUserByClerkUserId: mockGetOrCreateAppUserByClerkUserId,
  syncClerkUserProfile: mockSyncClerkUserProfile,
  disableAppUserByClerkUserId: mockDisableAppUserByClerkUserId,
}))

const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL
const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const originalClerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET

function setSvixHeaders(): void {
  mockHeaders.mockReturnValue(new Headers({
    'svix-id': 'evt_123',
    'svix-timestamp': String(Math.floor(Date.now() / 1000)),
    'svix-signature': 'sig_123',
  }))
}

async function loadRoute() {
  vi.resetModules()
  return import('./route')
}

beforeEach(() => {
  vi.clearAllMocks()
  setSvixHeaders()
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'token_123'
  process.env.CLERK_WEBHOOK_SECRET = 'whsec_123'
  mockRedisSet.mockResolvedValue('OK')
  mockRedisDel.mockResolvedValue(1)
  mockWebhookVerify.mockReturnValue({
    type: 'user.created',
    data: { id: 'user_123' },
  })
  mockGetOrCreateAppUserByClerkUserId.mockResolvedValue(undefined)
  mockSyncClerkUserProfile.mockResolvedValue(undefined)
  mockDisableAppUserByClerkUserId.mockResolvedValue(undefined)
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

  if (originalClerkWebhookSecret === undefined) {
    delete process.env.CLERK_WEBHOOK_SECRET
  } else {
    process.env.CLERK_WEBHOOK_SECRET = originalClerkWebhookSecret
  }
})

describe('clerk webhook route', () => {
  it('returns 500 when CLERK_WEBHOOK_SECRET is missing', async () => {
    delete process.env.CLERK_WEBHOOK_SECRET
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { POST } = await loadRoute()
    const response = await POST(new Request('http://localhost/api/webhook/clerk', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Missing required environment variable CLERK_WEBHOOK_SECRET for Clerk webhook.',
    })
    expect(mockWebhookConstructor).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('returns 500 when the Upstash Redis URL is missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { POST } = await loadRoute()
    const response = await POST(new Request('http://localhost/api/webhook/clerk', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Missing required environment variable UPSTASH_REDIS_REST_URL for Clerk webhook.',
    })
    expect(mockRedisConstructor).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('returns a duplicate response before signature verification when the event was already seen', async () => {
    mockRedisSet.mockResolvedValue(null)

    const { POST } = await loadRoute()
    const response = await POST(new Request('http://localhost/api/webhook/clerk', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, duplicate: true })
    expect(mockWebhookConstructor).toHaveBeenCalledWith('whsec_123')
    expect(mockWebhookVerify).not.toHaveBeenCalled()
  })

  it('processes a verified user.created event', async () => {
    const { POST } = await loadRoute()
    const response = await POST(new Request('http://localhost/api/webhook/clerk', {
      method: 'POST',
      body: JSON.stringify({ type: 'user.created' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(mockWebhookConstructor).toHaveBeenCalledWith('whsec_123')
    expect(mockWebhookVerify).toHaveBeenCalled()
    expect(mockGetOrCreateAppUserByClerkUserId).toHaveBeenCalledWith('user_123')
  })
})
