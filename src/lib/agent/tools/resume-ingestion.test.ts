import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState } from '@/types/cv'

import { ingestResumeText } from './resume-ingestion'

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

function buildEmptyCvState(): CVState {
  return {
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    experience: [],
    skills: [],
    education: [],
  }
}

function buildOpenAIResponse(text: string) {
  return {
    choices: [{ message: { content: text } }],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
    },
  }
}

describe('ingestResumeText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('populates an empty cvState from parsed resume text', async () => {
    createCompletion.mockResolvedValue(buildOpenAIResponse(JSON.stringify({
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '+55 11 99999-9999',
      linkedin: 'linkedin.com/in/ana-silva',
      location: 'Sao Paulo, BR',
      summary: 'Backend engineer focused on billing systems.',
      experience: [
        {
          title: 'Backend Engineer',
          company: 'Acme',
          startDate: '2022',
          endDate: 'present',
          bullets: ['Built billing APIs', 'Reduced latency by 30%'],
        },
      ],
      skills: ['TypeScript', 'PostgreSQL'],
      education: [
        {
          degree: 'BSc Computer Science',
          institution: 'USP',
          year: '2021',
        },
      ],
      certifications: [
        {
          name: 'AWS SAA',
          issuer: 'AWS',
          year: '2024',
        },
      ],
      confidenceScore: 0.91,
    })))

    const result = await ingestResumeText(
      'resume text',
      buildEmptyCvState(),
      'usr_123',
      'sess_123',
    )

    expect(result.strategy).toBe('populate_empty')
    expect(result.confidenceScore).toBe(0.91)
    expect(result.patch).toEqual({
      cvState: {
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '+55 11 99999-9999',
        linkedin: 'linkedin.com/in/ana-silva',
        location: 'Sao Paulo, BR',
        summary: 'Backend engineer focused on billing systems.',
        experience: [
          {
            title: 'Backend Engineer',
            company: 'Acme',
            startDate: '2022',
            endDate: 'present',
            bullets: ['Built billing APIs', 'Reduced latency by 30%'],
          },
        ],
        skills: ['TypeScript', 'PostgreSQL'],
        education: [
          {
            degree: 'BSc Computer Science',
            institution: 'USP',
            year: '2021',
          },
        ],
        certifications: [
          {
            name: 'AWS SAA',
            issuer: 'AWS',
            year: '2024',
          },
        ],
      },
    })
  })

  it('merges into a partial cvState without data loss', async () => {
    createCompletion.mockResolvedValue(buildOpenAIResponse(JSON.stringify({
      fullName: 'Ana Silva',
      email: 'ana.updated@example.com',
      phone: '+55 11 99999-9999',
      linkedin: 'linkedin.com/in/ana-silva',
      location: 'Sao Paulo, BR',
      summary: 'Generated summary that should not overwrite.',
      experience: [
        {
          title: 'Backend Engineer',
          company: 'Acme',
          startDate: '2022',
          endDate: 'present',
          bullets: ['Built billing APIs'],
        },
      ],
      skills: ['TypeScript', 'Redis', 'PostgreSQL'],
      education: [
        {
          degree: 'BSc Computer Science',
          institution: 'USP',
          year: '2021',
        },
      ],
      certifications: [],
      confidenceScore: 0.83,
    })))

    const result = await ingestResumeText(
      'resume text',
      {
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '',
        summary: 'Existing trusted summary.',
        experience: [],
        skills: ['TypeScript'],
        education: [],
      },
      'usr_123',
      'sess_123',
    )

    expect(result.strategy).toBe('merge_preserving_existing')
    expect(result.confidenceScore).toBe(0.83)
    expect(result.patch).toEqual({
      cvState: {
        phone: '+55 11 99999-9999',
        linkedin: 'linkedin.com/in/ana-silva',
        location: 'Sao Paulo, BR',
        experience: [
          {
            title: 'Backend Engineer',
            company: 'Acme',
            startDate: '2022',
            endDate: 'present',
            bullets: ['Built billing APIs'],
          },
        ],
        skills: ['TypeScript', 'Redis', 'PostgreSQL'],
        education: [
          {
            degree: 'BSc Computer Science',
            institution: 'USP',
            year: '2021',
          },
        ],
      },
    })
    expect(result.preservedFields).toContain('summary')
    expect(result.preservedFields).toContain('email')
  })

  it('returns no patch for invalid structured output', async () => {
    createCompletion.mockResolvedValue(buildOpenAIResponse(JSON.stringify({
      fullName: 'Ana Silva',
      email: ['ana@example.com'],
      phone: '+55 11 99999-9999',
      summary: 'Backend engineer',
      experience: [],
      skills: [],
      education: [],
      confidenceScore: 0.8,
    })))

    const result = await ingestResumeText(
      'resume text',
      buildEmptyCvState(),
      'usr_123',
      'sess_123',
    )

    expect(result).toEqual({
      patch: undefined,
      confidenceScore: undefined,
      strategy: 'unstructured_only',
      changedFields: [],
      preservedFields: [],
    })
  })
})
