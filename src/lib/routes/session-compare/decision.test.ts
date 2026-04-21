import { beforeEach, describe, expect, it, vi } from 'vitest'

import { decideSessionCompare } from './decision'

vi.mock('@/lib/cv/compare', () => ({
  compareCVStates: vi.fn(() => ({ changed: [] })),
}))

vi.mock('@/lib/db/cv-versions', () => ({
  getCvVersionForSession: vi.fn(),
  toTimelineEntry: vi.fn(() => ({
    label: 'ATS Enhancement Created',
    timestamp: '2026-01-01T00:00:00.000Z',
  })),
}))

vi.mock('@/lib/db/resume-targets', () => ({
  getResumeTargetForSession: vi.fn(),
  getResumeTargetsForSession: vi.fn(async () => []),
}))

describe('session-compare decision helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a locked decision without diff output when preview access is locked', async () => {
    const { getCvVersionForSession } = await import('@/lib/db/cv-versions')
    vi.mocked(getCvVersionForSession).mockResolvedValue({
      id: 'ver_1',
      sessionId: 'sess_1',
      source: 'rewrite',
      snapshot: {
        fullName: 'Ana',
        email: 'ana@example.com',
        phone: '1',
        summary: 'real summary',
        experience: [],
        skills: [],
        education: [],
      },
    } as never)

    const decision = await decideSessionCompare({
      request: new Request('https://example.com/api/session/sess_1/compare') as never,
      params: { id: 'sess_1' },
      appUser: { id: 'usr_1' } as never,
      session: {
        id: 'sess_1',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: [],
          education: [],
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
          },
        },
      } as never,
      body: {
        left: { kind: 'base' },
        right: { kind: 'version', id: 'ver_1' },
      },
    })

    expect(decision.kind).toBe('locked')
    expect(decision.body).not.toHaveProperty('diff')
  })
})
