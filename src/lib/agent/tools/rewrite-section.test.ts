import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/types/agent'

import { CURRENT_SESSION_STATE_VERSION } from '@/lib/db/sessions'
import { mergeToolPatch } from '@/lib/db/sessions'

import { rewriteSection } from './rewrite-section'

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

function buildSession(): Session {
  return {
    id: 'sess_123',
    userId: 'usr_123',
    stateVersion: CURRENT_SESSION_STATE_VERSION,
    phase: 'dialog',
    cvState: {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Backend engineer',
      experience: [
        {
          title: 'Engineer',
          company: 'Acme',
          startDate: '2022',
          endDate: 'present',
          bullets: ['Built APIs'],
        },
      ],
      skills: ['TypeScript'],
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
          year: '2023',
        },
      ],
    },
    agentState: {
      parseStatus: 'parsed',
      rewriteHistory: {},
    },
    generatedOutput: {
      status: 'idle',
    },
    creditsUsed: 0,
    messageCount: 0,
    creditConsumed: false,
    createdAt: new Date('2026-03-25T12:00:00.000Z'),
    updatedAt: new Date('2026-03-25T12:00:00.000Z'),
  }
}

function buildAnthropicResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
    usage: {
      input_tokens: 10,
      output_tokens: 20,
    },
  }
}

describe('rewriteSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the correct canonical cvState field', async () => {
    createMessage.mockResolvedValue(buildAnthropicResponse(JSON.stringify({
      rewritten_content: 'TypeScript, PostgreSQL, Redis',
      section_data: ['TypeScript', 'PostgreSQL', 'Redis'],
      keywords_added: ['Redis'],
      changes_made: ['Added infrastructure keyword'],
    })))

    const session = buildSession()
    const result = await rewriteSection({
      section: 'skills',
      current_content: 'TypeScript',
      instructions: 'Add relevant backend skills',
    }, session.userId, session.id)

    expect(result.output.success).toBe(true)
    expect(result.patch).toBeDefined()

    const merged = mergeToolPatch(session, result.patch ?? {})
    expect(merged.cvState.skills).toEqual(['TypeScript', 'PostgreSQL', 'Redis'])
  })

  it('keeps unrelated cvState fields unchanged', async () => {
    createMessage.mockResolvedValue(buildAnthropicResponse(JSON.stringify({
      rewritten_content: 'TypeScript, PostgreSQL',
      section_data: ['TypeScript', 'PostgreSQL'],
      keywords_added: ['PostgreSQL'],
      changes_made: ['Expanded database coverage'],
    })))

    const session = buildSession()
    const result = await rewriteSection({
      section: 'skills',
      current_content: 'TypeScript',
      instructions: 'Expand skills',
    }, session.userId, session.id)

    const merged = mergeToolPatch(session, result.patch ?? {})

    expect(merged.cvState.summary).toBe('Backend engineer')
    expect(merged.cvState.experience).toEqual(session.cvState.experience)
    expect(merged.cvState.education).toEqual(session.cvState.education)
    expect(merged.cvState.certifications).toEqual(session.cvState.certifications)
  })

  it('stores rewrite metadata in agentState', async () => {
    createMessage.mockResolvedValue(buildAnthropicResponse(JSON.stringify({
      rewritten_content: 'TypeScript, PostgreSQL',
      section_data: ['TypeScript', 'PostgreSQL'],
      keywords_added: ['PostgreSQL'],
      changes_made: ['Expanded database coverage'],
    })))

    const session = buildSession()
    const result = await rewriteSection({
      section: 'skills',
      current_content: 'TypeScript',
      instructions: 'Expand skills',
    }, session.userId, session.id)

    const merged = mergeToolPatch(session, result.patch ?? {})
    expect(merged.agentState.rewriteHistory.skills).toMatchObject({
      rewrittenContent: 'TypeScript, PostgreSQL',
      keywordsAdded: ['PostgreSQL'],
      changesMade: ['Expanded database coverage'],
    })
    expect(merged.agentState.rewriteHistory.skills?.updatedAt).toEqual(expect.any(String))
  })

  it('rejects invalid rewrite payloads and returns no patch', async () => {
    createMessage.mockResolvedValue(buildAnthropicResponse(JSON.stringify({
      rewritten_content: 'TypeScript, PostgreSQL',
      section_data: 'TypeScript, PostgreSQL',
      keywords_added: ['PostgreSQL'],
      changes_made: ['Expanded database coverage'],
    })))

    const result = await rewriteSection({
      section: 'skills',
      current_content: 'TypeScript',
      instructions: 'Expand skills',
    }, 'usr_123', 'sess_123')

    expect(result).toEqual({
      output: {
        success: false,
        error: 'Invalid rewrite payload for section "skills".',
      },
    })
  })
})
