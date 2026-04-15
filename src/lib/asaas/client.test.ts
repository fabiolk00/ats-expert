import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const originalAsaasAccessToken = process.env.ASAAS_ACCESS_TOKEN
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  global.fetch = originalFetch

  if (originalAsaasAccessToken === undefined) {
    delete process.env.ASAAS_ACCESS_TOKEN
  } else {
    process.env.ASAAS_ACCESS_TOKEN = originalAsaasAccessToken
  }
})

describe('asaas client config', () => {
  it('throws an actionable error when ASAAS_ACCESS_TOKEN is missing', async () => {
    delete process.env.ASAAS_ACCESS_TOKEN

    const { asaas } = await import('./client')

    await expect(asaas.get('/customers')).rejects.toThrowError(
      'Missing required environment variable ASAAS_ACCESS_TOKEN for Asaas client.',
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('uses the trimmed server token on outbound provider requests', async () => {
    process.env.ASAAS_ACCESS_TOKEN = '  token_123  '
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{}'),
    } as unknown as Response)

    const { asaas } = await import('./client')

    await asaas.get('/customers')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.asaas.com/api/v3/customers',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          access_token: 'token_123',
        }),
      }),
    )
  })
})
