import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
})
