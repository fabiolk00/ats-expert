import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  assertE2EAuthConfigured,
  createSignedE2EAuthCookie,
  getE2EAuthConfigurationSummary,
  isE2EAuthRuntimeAllowed,
  resolveE2EAppUser,
  verifySignedE2EAuthCookie,
} from '@/lib/auth/e2e-auth'

const originalEnabled = process.env.E2E_AUTH_ENABLED
const originalSecret = process.env.E2E_AUTH_BYPASS_SECRET
const originalNodeEnv = process.env.NODE_ENV
const originalCi = process.env.CI
const originalLocalDev = process.env.E2E_AUTH_ALLOW_LOCAL_DEV

describe('e2e auth helpers', () => {
  beforeEach(() => {
    process.env.E2E_AUTH_ENABLED = 'true'
    process.env.E2E_AUTH_BYPASS_SECRET = 'test-e2e-secret'
    delete process.env.E2E_AUTH_ALLOW_LOCAL_DEV
  })

  afterAll(() => {
    if (originalEnabled === undefined) {
      delete process.env.E2E_AUTH_ENABLED
    } else {
      process.env.E2E_AUTH_ENABLED = originalEnabled
    }

    if (originalSecret === undefined) {
      delete process.env.E2E_AUTH_BYPASS_SECRET
    } else {
      process.env.E2E_AUTH_BYPASS_SECRET = originalSecret
    }

    if (originalNodeEnv === undefined) {
      delete (process.env as Record<string, string | undefined>).NODE_ENV
    } else {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    }

    if (originalCi === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCi
    }

    if (originalLocalDev === undefined) {
      delete process.env.E2E_AUTH_ALLOW_LOCAL_DEV
    } else {
      process.env.E2E_AUTH_ALLOW_LOCAL_DEV = originalLocalDev
    }
  })

  it('allows the bypass in test, CI, or explicit local-dev mode only', () => {
    expect(isE2EAuthRuntimeAllowed('test', undefined, undefined)).toBe(true)
    expect(isE2EAuthRuntimeAllowed('production', 'true', undefined)).toBe(true)
    expect(isE2EAuthRuntimeAllowed('development', 'false', 'true')).toBe(true)
    expect(isE2EAuthRuntimeAllowed('production', 'false', 'false')).toBe(false)
  })

  it('creates and resolves a signed synthetic app user', async () => {
    const cookie = await createSignedE2EAuthCookie({
      appUserId: 'usr_e2e_123',
      creditsRemaining: 9,
      displayName: 'Ana Teste',
      primaryEmail: 'ana@example.com',
    })

    await expect(verifySignedE2EAuthCookie(cookie)).resolves.toMatchObject({
      appUserId: 'usr_e2e_123',
      creditsRemaining: 9,
      displayName: 'Ana Teste',
      primaryEmail: 'ana@example.com',
    })

    await expect(resolveE2EAppUser(cookie)).resolves.toMatchObject({
      id: 'usr_e2e_123',
      displayName: 'Ana Teste',
      primaryEmail: 'ana@example.com',
      creditAccount: {
        creditsRemaining: 9,
      },
    })
  })

  it('rejects tampered cookies', async () => {
    const cookie = await createSignedE2EAuthCookie({
      appUserId: 'usr_e2e_123',
    })
    const tampered = cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a')

    await expect(verifySignedE2EAuthCookie(tampered)).resolves.toBeNull()
    await expect(resolveE2EAppUser(tampered)).resolves.toBeNull()
  })

  it('ignores cookies when E2E auth is disabled', async () => {
    const cookie = await createSignedE2EAuthCookie({
      appUserId: 'usr_e2e_disabled',
    })
    process.env.E2E_AUTH_ENABLED = 'false'

    await expect(verifySignedE2EAuthCookie(cookie)).resolves.toBeNull()
    await expect(resolveE2EAppUser(cookie)).resolves.toBeNull()
  })

  it('fails fast when enabled without a secret', () => {
    delete process.env.E2E_AUTH_BYPASS_SECRET

    expect(() => assertE2EAuthConfigured()).toThrow(
      'Missing required environment variable E2E_AUTH_BYPASS_SECRET when E2E auth is enabled.',
    )
  })

  it('fails fast when bypass is requested in a disallowed runtime', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    process.env.CI = 'false'
    delete process.env.E2E_AUTH_ALLOW_LOCAL_DEV

    expect(() => assertE2EAuthConfigured()).toThrow(
      'E2E auth bypass can only be enabled in CI, NODE_ENV=test, or local development with E2E_AUTH_ALLOW_LOCAL_DEV=true.',
    )
  })

  it('summarizes whether the bypass is active in the current runtime', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    process.env.CI = 'false'
    process.env.E2E_AUTH_ALLOW_LOCAL_DEV = 'true'

    expect(getE2EAuthConfigurationSummary()).toMatchObject({
      requested: true,
      runtimeAllowed: true,
      enabled: true,
    })
  })
})
