import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(() => ({ __brand: 'supabase-admin-client' })),
}))

vi.mock('server-only', () => ({}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

beforeEach(() => {
  vi.clearAllMocks()
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
    )
  })
})
