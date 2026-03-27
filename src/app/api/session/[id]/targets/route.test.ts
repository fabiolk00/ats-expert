import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/types/agent'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'
import { createTargetResumeVariant } from '@/lib/resume-targets/create-target-resume'

import { GET, POST } from './route'

vi.mock('@/lib/auth/app-user', () => ({
  getCurrentAppUser: vi.fn(),
}))

vi.mock('@/lib/db/sessions', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db/resume-targets', () => ({
  getResumeTargetsForSession: vi.fn(),
}))

vi.mock('@/lib/resume-targets/create-target-resume', () => ({
  createTargetResumeVariant: vi.fn(),
}))

function buildSession(): Session {
  return {
    id: 'sess_123',
    userId: 'usr_123',
    stateVersion: 1,
    phase: 'dialog',
    cvState: {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Backend engineer',
      experience: [],
      skills: ['TypeScript'],
      education: [],
    },
    agentState: {
      parseStatus: 'parsed',
      rewriteHistory: {},
    },
    generatedOutput: {
      status: 'idle',
    },
    creditsUsed: 1,
    messageCount: 3,
    creditConsumed: true,
    createdAt: new Date('2026-03-27T12:00:00.000Z'),
    updatedAt: new Date('2026-03-27T12:10:00.000Z'),
  }
}

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

describe('session targets route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-owners', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue(buildAppUser('usr_other'))
    vi.mocked(getSession).mockResolvedValue(null)

    const response = await POST(
      new NextRequest('https://example.com/api/session/sess_123/targets', {
        method: 'POST',
        body: JSON.stringify({ targetJobDescription: 'AWS backend role' }),
      }),
      { params: { id: 'sess_123' } },
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
    expect(createTargetResumeVariant).not.toHaveBeenCalled()
  })

  it('allows the owner to create and list targets', async () => {
    const session = buildSession()

    vi.mocked(getCurrentAppUser).mockResolvedValue(buildAppUser('usr_123'))
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(createTargetResumeVariant).mockResolvedValue({
      success: true,
      target: {
        id: 'target_123',
        sessionId: session.id,
        targetJobDescription: 'AWS backend role',
        derivedCvState: {
          ...session.cvState,
          summary: 'Backend engineer optimized for AWS roles.',
        },
        gapAnalysis: {
          matchScore: 72,
          missingSkills: ['AWS'],
          weakAreas: ['summary'],
          improvementSuggestions: ['Highlight AWS experience'],
        },
        createdAt: new Date('2026-03-27T12:00:00.000Z'),
        updatedAt: new Date('2026-03-27T12:00:00.000Z'),
      },
      gapAnalysis: {
        matchScore: 72,
        missingSkills: ['AWS'],
        weakAreas: ['summary'],
        improvementSuggestions: ['Highlight AWS experience'],
      },
    })
    vi.mocked(getResumeTargetsForSession).mockResolvedValue([{
      id: 'target_123',
      sessionId: session.id,
      targetJobDescription: 'AWS backend role',
      derivedCvState: {
        ...session.cvState,
        summary: 'Backend engineer optimized for AWS roles.',
      },
      gapAnalysis: {
        matchScore: 72,
        missingSkills: ['AWS'],
        weakAreas: ['summary'],
        improvementSuggestions: ['Highlight AWS experience'],
      },
      createdAt: new Date('2026-03-27T12:00:00.000Z'),
      updatedAt: new Date('2026-03-27T12:00:00.000Z'),
    }])

    const postResponse = await POST(
      new NextRequest('https://example.com/api/session/sess_123/targets', {
        method: 'POST',
        body: JSON.stringify({ targetJobDescription: 'AWS backend role' }),
      }),
      { params: { id: 'sess_123' } },
    )

    expect(postResponse.status).toBe(200)
    expect(getSession).toHaveBeenCalledWith('sess_123', 'usr_123')

    const getResponse = await GET(
      new NextRequest('https://example.com/api/session/sess_123/targets'),
      { params: { id: 'sess_123' } },
    )

    expect(getResponse.status).toBe(200)
    expect(await getResponse.json()).toEqual({
      targets: [{
        id: 'target_123',
        sessionId: session.id,
        targetJobDescription: 'AWS backend role',
        derivedCvState: {
          ...session.cvState,
          summary: 'Backend engineer optimized for AWS roles.',
        },
        gapAnalysis: {
          matchScore: 72,
          missingSkills: ['AWS'],
          weakAreas: ['summary'],
          improvementSuggestions: ['Highlight AWS experience'],
        },
        createdAt: '2026-03-27T12:00:00.000Z',
        updatedAt: '2026-03-27T12:00:00.000Z',
      }],
    })
  })
})
