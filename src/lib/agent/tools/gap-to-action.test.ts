import { describe, expect, it } from 'vitest'

import type { Session } from '@/types/agent'

import { buildGapRewriteInput, mapGapItemToSection } from './gap-to-action'

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
      targetJobDescription: 'Senior AWS backend engineer',
      gapAnalysis: {
        analyzedAt: '2026-03-27T12:00:00.000Z',
        result: {
          matchScore: 72,
          missingSkills: ['AWS'],
          weakAreas: ['summary lacks target-role alignment'],
          improvementSuggestions: ['Add AWS emphasis to the summary'],
        },
      },
      rewriteHistory: {},
    },
    generatedOutput: {
      status: 'idle',
    },
    creditsUsed: 1,
    messageCount: 2,
    creditConsumed: true,
    createdAt: new Date('2026-03-27T12:00:00.000Z'),
    updatedAt: new Date('2026-03-27T12:00:00.000Z'),
  }
}

describe('gap-to-action', () => {
  it('maps a gap item to a valid target section', () => {
    const section = mapGapItemToSection('missing_skill', 'AWS', buildSession().cvState)

    expect(section).toBe('skills')
  })

  it('builds a targeted rewrite input from structured gap analysis', () => {
    const session = buildSession()

    expect(buildGapRewriteInput({
      item_type: 'suggestion',
      item_value: 'Add AWS emphasis to the summary',
    }, session)).toEqual({
      section: 'summary',
      current_content: 'Backend engineer',
      instructions: expect.stringContaining('Improve only the summary section'),
      target_keywords: ['AWS'],
    })
  })
})
