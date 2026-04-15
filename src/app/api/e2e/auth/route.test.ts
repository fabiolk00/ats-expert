import { NextRequest } from 'next/server'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { E2E_AUTH_COOKIE_NAME, verifySignedE2EAuthCookie } from '@/lib/auth/e2e-auth'

import { DELETE, POST } from './route'

const originalEnabled = process.env.E2E_AUTH_ENABLED
const originalSecret = process.env.E2E_AUTH_BYPASS_SECRET
const originalNodeEnv = process.env.NODE_ENV
const originalCi = process.env.CI
const originalLocalDev = process.env.E2E_AUTH_ALLOW_LOCAL_DEV

function buildRequest(
  method: 'POST' | 'DELETE',
  body?: Record<string, unknown>,
  origin = 'http://localhost:3000',
): NextRequest {
  return new NextRequest('http://localhost:3000/api/e2e/auth', {
    method,
    headers: {
      'content-type': 'application/json',
      origin,
      'x-e2e-auth-secret': 'test-e2e-secret',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('e2e auth route', () => {
  beforeEach(() => {
    process.env.E2E_AUTH_ENABLED = 'true'
    process.env.E2E_AUTH_BYPASS_SECRET = 'test-e2e-secret'
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.CI = 'false'
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

  it('issues a signed auth cookie in E2E mode', async () => {
    const response = await POST(buildRequest('POST', {
      appUserId: 'usr_e2e_route',
      creditsRemaining: 7,
      displayName: 'Route Test User',
      email: 'route@example.com',
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, appUserId: 'usr_e2e_route' })

    const cookie = response.cookies.get(E2E_AUTH_COOKIE_NAME)?.value
    expect(cookie).toBeTruthy()
    await expect(verifySignedE2EAuthCookie(cookie)).resolves.toMatchObject({
      appUserId: 'usr_e2e_route',
      creditsRemaining: 7,
      displayName: 'Route Test User',
      primaryEmail: 'route@example.com',
    })
  })

  it('rejects requests when E2E mode is disabled', async () => {
    process.env.E2E_AUTH_ENABLED = 'false'

    const response = await POST(buildRequest('POST'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('rejects requests when bypass is requested outside CI, test, or explicit local dev', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    process.env.CI = 'false'
    delete process.env.E2E_AUTH_ALLOW_LOCAL_DEV

    const response = await POST(buildRequest('POST'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('rejects invalid secrets', async () => {
    const response = await POST(new NextRequest('http://localhost:3000/api/e2e/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        'x-e2e-auth-secret': 'wrong-secret',
      },
      body: JSON.stringify({ appUserId: 'usr_blocked' }),
    }))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('rejects cross-origin bootstrap attempts', async () => {
    const response = await POST(buildRequest('POST', undefined, 'https://evil.example.com'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('rejects requests when the bypass secret is missing even in an allowed runtime', async () => {
    delete process.env.E2E_AUTH_BYPASS_SECRET

    const response = await POST(buildRequest('POST'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('clears the auth cookie on DELETE', async () => {
    const response = await DELETE(buildRequest('DELETE'))

    expect(response.status).toBe(204)
    expect(response.headers.get('set-cookie')).toContain(`${E2E_AUTH_COOKIE_NAME}=;`)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
