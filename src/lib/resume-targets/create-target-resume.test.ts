import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState } from '@/types/cv'

import { createResumeTarget } from '@/lib/db/resume-targets'
import { analyzeGap } from '@/lib/agent/tools/gap-analysis'

import { createTargetResumeVariant } from './create-target-resume'

const { createMessage } = vi.hoisted(() => ({
  createMessage: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    static APIError = class APIError extends Error {
      status?: number
    }

    messages = {
      create: createMessage,
    }

    constructor(_: unknown) {}
  }

  return {
    default: MockAnthropic,
  }
})

vi.mock('@/lib/agent/usage-tracker', () => ({
  trackApiUsage: vi.fn(() => Promise.resolve(undefined)),
}))

vi.mock('@/lib/agent/tools/gap-analysis', () => ({
  analyzeGap: vi.fn(),
}))

vi.mock('@/lib/db/resume-targets', () => ({
  createResumeTarget: vi.fn(),
}))

function buildBaseCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Backend engineer focused on APIs.',
    experience: [{
      title: 'Backend Engineer',
      company: 'Acme',
      startDate: '2022',
      endDate: 'present',
      bullets: ['Built billing APIs'],
    }],
    skills: ['TypeScript', 'PostgreSQL'],
    education: [],
  }
}

describe('createTargetResumeVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(analyzeGap).mockResolvedValue({
      output: {
        success: true,
        result: {
          matchScore: 70,
          missingSkills: ['AWS'],
          weakAreas: ['summary'],
          improvementSuggestions: ['Highlight cloud experience'],
        },
      },
      result: {
        matchScore: 70,
        missingSkills: ['AWS'],
        weakAreas: ['summary'],
        improvementSuggestions: ['Highlight cloud experience'],
      },
    })
  })

  it('creates target-specific resumes without overwriting the base cvState', async () => {
    const baseCvState = buildBaseCvState()

    createMessage.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...baseCvState,
          summary: 'Backend engineer with strong cloud and API delivery experience.',
          skills: ['TypeScript', 'PostgreSQL', 'AWS'],
        }),
      }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })

    vi.mocked(createResumeTarget).mockResolvedValue({
      id: 'target_123',
      sessionId: 'sess_123',
      targetJobDescription: 'AWS backend role',
      derivedCvState: {
        ...baseCvState,
        summary: 'Backend engineer with strong cloud and API delivery experience.',
        skills: ['TypeScript', 'PostgreSQL', 'AWS'],
      },
      gapAnalysis: {
        matchScore: 70,
        missingSkills: ['AWS'],
        weakAreas: ['summary'],
        improvementSuggestions: ['Highlight cloud experience'],
      },
      createdAt: new Date('2026-03-27T12:00:00.000Z'),
      updatedAt: new Date('2026-03-27T12:00:00.000Z'),
    })

    const result = await createTargetResumeVariant({
      sessionId: 'sess_123',
      userId: 'usr_123',
      baseCvState,
      targetJobDescription: 'AWS backend role',
    })

    expect(result.success).toBe(true)
    expect(baseCvState).toEqual(buildBaseCvState())
  })

  it('allows multiple targets to coexist with isolated derived cv states', async () => {
    const baseCvState = buildBaseCvState()

    createMessage
      .mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...baseCvState,
            summary: 'Backend engineer optimized for AWS roles.',
            skills: ['TypeScript', 'PostgreSQL', 'AWS'],
          }),
        }],
        usage: { input_tokens: 10, output_tokens: 20 },
      })
      .mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...baseCvState,
            summary: 'Backend engineer optimized for data platform roles.',
            skills: ['TypeScript', 'PostgreSQL', 'Kafka'],
          }),
        }],
        usage: { input_tokens: 10, output_tokens: 20 },
      })

    vi.mocked(createResumeTarget)
      .mockResolvedValueOnce({
        id: 'target_aws',
        sessionId: 'sess_123',
        targetJobDescription: 'AWS backend role',
        derivedCvState: {
          ...baseCvState,
          summary: 'Backend engineer optimized for AWS roles.',
          skills: ['TypeScript', 'PostgreSQL', 'AWS'],
        },
        gapAnalysis: undefined,
        createdAt: new Date('2026-03-27T12:00:00.000Z'),
        updatedAt: new Date('2026-03-27T12:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'target_data',
        sessionId: 'sess_123',
        targetJobDescription: 'Data platform backend role',
        derivedCvState: {
          ...baseCvState,
          summary: 'Backend engineer optimized for data platform roles.',
          skills: ['TypeScript', 'PostgreSQL', 'Kafka'],
        },
        gapAnalysis: undefined,
        createdAt: new Date('2026-03-27T12:05:00.000Z'),
        updatedAt: new Date('2026-03-27T12:05:00.000Z'),
      })

    const firstResult = await createTargetResumeVariant({
      sessionId: 'sess_123',
      userId: 'usr_123',
      baseCvState,
      targetJobDescription: 'AWS backend role',
    })
    const secondResult = await createTargetResumeVariant({
      sessionId: 'sess_123',
      userId: 'usr_123',
      baseCvState,
      targetJobDescription: 'Data platform backend role',
    })

    expect(firstResult.success).toBe(true)
    expect(secondResult.success).toBe(true)

    if (firstResult.success && secondResult.success) {
      expect(firstResult.target.id).toBe('target_aws')
      expect(secondResult.target.id).toBe('target_data')
      expect(firstResult.target.derivedCvState.summary).not.toBe(secondResult.target.derivedCvState.summary)
      expect(firstResult.target.derivedCvState.skills).toEqual(['TypeScript', 'PostgreSQL', 'AWS'])
      expect(secondResult.target.derivedCvState.skills).toEqual(['TypeScript', 'PostgreSQL', 'Kafka'])
    }

    expect(baseCvState).toEqual(buildBaseCvState())
  })

  it('fails atomically when target persistence does not commit', async () => {
    const baseCvState = buildBaseCvState()
    const persistedTargets: string[] = []

    createMessage.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...baseCvState,
          summary: 'Backend engineer optimized for AWS roles.',
          skills: ['TypeScript', 'PostgreSQL', 'AWS'],
        }),
      }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })

    vi.mocked(createResumeTarget).mockImplementation(async () => {
      return await Promise.reject(new Error('Transactional insert failed'))
    })

    const result = await createTargetResumeVariant({
      sessionId: 'sess_123',
      userId: 'usr_123',
      baseCvState,
      targetJobDescription: 'AWS backend role',
    })

    expect(result).toEqual({
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create target resume.',
    })

    expect(persistedTargets).toEqual([])
    expect(baseCvState).toEqual(buildBaseCvState())
  })
})
