import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(() => ({ __brand: 'supabase-admin-client' })),
}))

const { mockRecordQuery } = vi.hoisted(() => ({
  mockRecordQuery: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/observability/request-query-context', () => ({
  recordQuery: mockRecordQuery,
}))

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
})

afterEach(() => {
  vi.resetModules()

  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  }

  if (originalSupabaseServiceRoleKey === undefined) {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  } else {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseServiceRoleKey
  }
})

describe('supabase admin client config', () => {
  it('throws an actionable error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

    const { getSupabaseAdminClient } = await import('./supabase-admin')

    expect(() => getSupabaseAdminClient()).toThrowError(
      'Missing required environment variable NEXT_PUBLIC_SUPABASE_URL for Supabase admin client.',
    )
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('throws an actionable error when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { getSupabaseAdminClient } = await import('./supabase-admin')

    expect(() => getSupabaseAdminClient()).toThrowError(
      'Missing required environment variable SUPABASE_SERVICE_ROLE_KEY for Supabase admin client.',
    )
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('trims env values and caches the admin client instance', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' https://project.supabase.co '
    process.env.SUPABASE_SERVICE_ROLE_KEY = ' service-role-key '

    const { getSupabaseAdminClient } = await import('./supabase-admin')

    const first = getSupabaseAdminClient()
    const second = getSupabaseAdminClient()

    expect(first).toBe(second)
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'service-role-key',
      expect.objectContaining({
        global: expect.objectContaining({
          fetch: expect.any(Function),
        }),
      }),
    )
  })

  it('records only PostgREST DB requests through the instrumented global fetch', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

    const { getSupabaseAdminClient } = await import('./supabase-admin')

    getSupabaseAdminClient()

    const createClientCall = mockCreateClient.mock.calls[0] as unknown as [
      string,
      string,
      { global: { fetch: typeof fetch } },
    ]
    const options = createClientCall[2]
    const trackedFetch = options.global.fetch as typeof fetch

    await trackedFetch('https://project.supabase.co/rest/v1/sessions?select=*')
    await trackedFetch('https://project.supabase.co/storage/v1/object/sign/resume.pdf')

    expect(mockRecordQuery).toHaveBeenCalledTimes(1)
    expect(mockRecordQuery).toHaveBeenCalledWith(
      'GET /rest/v1/sessions?select=*',
    )
  })

  it('passes the full PostgREST descriptor to tracking so fingerprinting is not based on a pre-truncated URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

    const { getSupabaseAdminClient } = await import('./supabase-admin')

    getSupabaseAdminClient()

    const createClientCall = mockCreateClient.mock.calls[0] as unknown as [
      string,
      string,
      { global: { fetch: typeof fetch } },
    ]
    const trackedFetch = createClientCall[2].global.fetch as typeof fetch
    const longFilterValue = 'x'.repeat(240)

    await trackedFetch(`https://project.supabase.co/rest/v1/sessions?select=*&id=eq.${longFilterValue}`)

    expect(mockRecordQuery).toHaveBeenCalledWith(
      `GET /rest/v1/sessions?select=*&id=eq.${longFilterValue}`,
    )
  })
})
