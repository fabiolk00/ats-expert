import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState } from '@/types/cv'

import { analyzeGap } from './gap-analysis'

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}))

vi.mock('@/lib/openai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: createCompletion,
      },
    },
  },
}))

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

function buildOpenAIResponse(content: string) {
  return {
    choices: [{
      message: {
        content,
      },
    }],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
    },
  }
}

describe('gap analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validated structured output', async () => {
    createCompletion.mockResolvedValue(buildOpenAIResponse(JSON.stringify({
      matchScore: 72,
      missingSkills: ['AWS'],
      weakAreas: ['summary'],
      improvementSuggestions: ['Add AWS experience to the summary and skills sections'],
    })))

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
    createCompletion.mockResolvedValue(buildOpenAIResponse(JSON.stringify({
      matchScore: 120,
      missingSkills: 'AWS',
    })))

    const result = await analyzeGap(
      buildCvState(),
      'Looking for AWS and backend API experience',
      'usr_123',
      'sess_123',
    )

    expect(result).toEqual({
      output: {
        success: false,
        code: 'LLM_INVALID_OUTPUT',
        error: 'Invalid gap analysis payload.',
      },
    })
  })
})
