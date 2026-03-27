import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState } from '@/types/cv'

import { analyzeGap } from './gap-analysis'

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

function buildCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Backend engineer focused on APIs.',
    experience: [],
    skills: ['TypeScript', 'PostgreSQL'],
    education: [],
  }
}

describe('gap analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validated structured output', async () => {
    createMessage.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          matchScore: 72,
          missingSkills: ['AWS'],
          weakAreas: ['summary'],
          improvementSuggestions: ['Add AWS experience to the summary and skills sections'],
        }),
      }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })

    const result = await analyzeGap(
      buildCvState(),
      'Looking for AWS and backend API experience',
      'usr_123',
      'sess_123',
    )

    expect(result).toEqual({
      output: {
        success: true,
        result: {
          matchScore: 72,
          missingSkills: ['AWS'],
          weakAreas: ['summary'],
          improvementSuggestions: ['Add AWS experience to the summary and skills sections'],
        },
      },
      result: {
        matchScore: 72,
        missingSkills: ['AWS'],
        weakAreas: ['summary'],
        improvementSuggestions: ['Add AWS experience to the summary and skills sections'],
      },
    })
  })

  it('rejects invalid gap analysis output', async () => {
    createMessage.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          matchScore: 120,
          missingSkills: 'AWS',
        }),
      }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })

    const result = await analyzeGap(
      buildCvState(),
      'Looking for AWS and backend API experience',
      'usr_123',
      'sess_123',
    )

    expect(result).toEqual({
      output: {
        success: false,
        error: 'Invalid gap analysis payload.',
      },
    })
  })
})
