import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getJob } from '@/lib/jobs/repository'

import { GET } from './route'

vi.mock('@/lib/auth/app-user', () => ({
  getCurrentAppUser: vi.fn(),
}))

vi.mock('@/lib/jobs/repository', () => ({
  getJob: vi.fn(),
}))

vi.mock('@/lib/observability/structured-log', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  serializeError: (error: unknown) => ({
    errorMessage: error instanceof Error ? error.message : String(error),
  }),
}))

function buildAppUser(id: string) {
  return {
    id,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    authIdentity: {
      id: `identity_${id}`,
      userId: id,
      provider: 'clerk' as const,
      providerSubject: `clerk_${id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    creditAccount: {
      id: `cred_${id}`,
      userId: id,
      creditsRemaining: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

describe('GET /api/jobs/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 before any job lookup when unauthenticated', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(null)

    const response = await GET(
      new NextRequest('https://example.com/api/jobs/job_123'),
      { params: { jobId: 'job_123' } },
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(getJob).not.toHaveBeenCalled()
  })

  it('returns 404 when the job does not belong to the authenticated app user', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(buildAppUser('usr_123'))
    vi.mocked(getJob).mockResolvedValue(null)

    const response = await GET(
      new NextRequest('https://example.com/api/jobs/job_123'),
      { params: { jobId: 'job_123' } },
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
    expect(getJob).toHaveBeenCalledWith('job_123', 'usr_123')
  })

  it('returns the canonical durable job snapshot unchanged for the owner', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(buildAppUser('usr_123'))
    vi.mocked(getJob).mockResolvedValue({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'artifact:sess_123:abc',
      type: 'artifact_generation',
      status: 'running',
      stage: 'rendering',
      progress: {
        percent: 60,
        label: 'rendering',
      },
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
      createdAt: '2026-04-17T00:00:00.000Z',
      updatedAt: '2026-04-17T00:00:10.000Z',
      claimedAt: '2026-04-17T00:00:01.000Z',
      startedAt: '2026-04-17T00:00:01.000Z',
    })

    const response = await GET(
      new NextRequest('https://example.com/api/jobs/job_123'),
      { params: { jobId: 'job_123' } },
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'artifact:sess_123:abc',
      type: 'artifact_generation',
      status: 'running',
      stage: 'rendering',
      progress: {
        percent: 60,
        label: 'rendering',
      },
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
      createdAt: '2026-04-17T00:00:00.000Z',
      updatedAt: '2026-04-17T00:00:10.000Z',
      claimedAt: '2026-04-17T00:00:01.000Z',
      startedAt: '2026-04-17T00:00:01.000Z',
    })
  })
})
