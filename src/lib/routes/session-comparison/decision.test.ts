import { beforeEach, describe, expect, it, vi } from 'vitest'

import { decideSessionComparison } from './decision'

vi.mock('@/lib/agent/tools/ats-analysis', () => ({
  analyzeAtsGeneral: vi.fn(),
}))

vi.mock('@/lib/ats/score', () => ({
  scoreATS: vi.fn(),
}))

describe('session-comparison decision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a conflict decision when no optimized resume is available', async () => {
    const decision = await decideSessionComparison({
      request: new Request('https://example.com/api/session/sess_1/comparison') as never,
      params: { id: 'sess_1' },
      appUser: { id: 'usr_1' } as never,
      session: {
        id: 'sess_1',
        userId: 'usr_1',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: [],
          education: [],
        },
        agentState: {
          workflowMode: 'ats_enhancement',
          lastRewriteMode: 'ats_enhancement',
        },
        generatedOutput: {
          status: 'idle',
        },
      } as never,
    })

    expect(decision).toEqual({
      kind: 'no_optimized_resume',
      status: 409,
      body: { error: 'No optimized resume found for this session.' },
    })
  })

  it('preserves preview-lock sanitization and score labels for ATS enhancement flows', async () => {
    const { analyzeAtsGeneral } = await import('@/lib/agent/tools/ats-analysis')
    vi.mocked(analyzeAtsGeneral)
      .mockResolvedValueOnce({
        success: true,
        result: { overallScore: 58 },
      } as never)
      .mockResolvedValueOnce({
        success: true,
        result: { overallScore: 61 },
      } as never)

    const decision = await decideSessionComparison({
      request: new Request('https://example.com/api/session/sess_1/comparison') as never,
      params: { id: 'sess_1' },
      appUser: { id: 'usr_1' } as never,
      session: {
        id: 'sess_1',
        userId: 'usr_1',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: ['SQL'],
          education: [],
        },
        agentState: {
          workflowMode: 'ats_enhancement',
          lastRewriteMode: 'ats_enhancement',
          optimizedCvState: {
            fullName: 'Ana',
            email: 'ana@example.com',
            phone: '1',
            summary: 'real summary',
            experience: [],
            skills: ['SQL', 'Python'],
            education: [],
          },
        },
        generatedOutput: {
          status: 'ready',
          previewAccess: {
            locked: true,
            blurred: true,
            canViewRealContent: false,
            requiresUpgrade: true,
            requiresRegenerationAfterUnlock: true,
            reason: 'free_trial_locked',
            message: 'locked',
          },
        },
      } as never,
    })

    expect(decision.kind).toBe('success')
    if (decision.kind !== 'success') {
      throw new Error('expected success decision')
    }

    expect(decision.body.optimizedCvState).toMatchObject({
      fullName: 'Preview bloqueado',
    })
    expect(decision.body.previewLock).toMatchObject({
      locked: true,
      reason: 'free_trial_locked',
    })
    expect(decision.body.originalScore.label).toBe('Score ATS')
    expect(decision.body.optimizedScore.label).toBe('Score ATS')
  })

  it('uses ATS fallback scoring and job-targeting labels when ATS analysis is unavailable', async () => {
    const { scoreATS } = await import('@/lib/ats/score')
    vi.mocked(scoreATS)
      .mockReturnValueOnce({ total: 44 } as never)
      .mockReturnValueOnce({ total: 81 } as never)

    const decision = await decideSessionComparison({
      request: new Request('https://example.com/api/session/sess_1/comparison') as never,
      params: { id: 'sess_1' },
      appUser: { id: 'usr_1' } as never,
      session: {
        id: 'sess_1',
        userId: 'usr_1',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: ['SQL'],
          education: [],
        },
        agentState: {
          workflowMode: 'job_targeting',
          lastRewriteMode: 'job_targeting',
          targetJobDescription: 'Data role',
          optimizedCvState: {
            fullName: 'Ana',
            email: 'ana@example.com',
            phone: '1',
            summary: 'optimized summary',
            experience: [],
            skills: ['SQL', 'Python'],
            education: [],
          },
        },
        generatedOutput: {
          status: 'ready',
        },
      } as never,
    })

    expect(decision.kind).toBe('success')
    if (decision.kind !== 'success') {
      throw new Error('expected success decision')
    }

    expect(decision.body.generationType).toBe('JOB_TARGETING')
    expect(decision.body.originalScore).toEqual({
      total: 44,
      label: 'AderÃªncia Ã  vaga',
    })
    expect(decision.body.optimizedScore).toEqual({
      total: 81,
      label: 'AderÃªncia Ã  vaga',
    })
  })

  it('returns an internal-error decision when scoring fails unexpectedly', async () => {
    const { analyzeAtsGeneral } = await import('@/lib/agent/tools/ats-analysis')
    vi.mocked(analyzeAtsGeneral).mockRejectedValue(new Error('boom'))

    const decision = await decideSessionComparison({
      request: new Request('https://example.com/api/session/sess_1/comparison') as never,
      params: { id: 'sess_1' },
      appUser: { id: 'usr_1' } as never,
      session: {
        id: 'sess_1',
        userId: 'usr_1',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: ['SQL'],
          education: [],
        },
        agentState: {
          workflowMode: 'ats_enhancement',
          lastRewriteMode: 'ats_enhancement',
          optimizedCvState: {
            fullName: 'Ana',
            email: 'ana@example.com',
            phone: '1',
            summary: 'optimized summary',
            experience: [],
            skills: ['SQL', 'Python'],
            education: [],
          },
        },
        generatedOutput: {
          status: 'ready',
        },
      } as never,
    })

    expect(decision).toEqual({
      kind: 'internal_error',
      status: 500,
      body: { error: 'Internal server error' },
    })
  })
})
