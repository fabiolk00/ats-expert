import { describe, expect, it } from 'vitest'

import type { Session } from '@/types/agent'

import { buildSystemPrompt } from './context-builder'
import { CURRENT_SESSION_STATE_VERSION } from '@/lib/db/sessions'

function buildSession(): Session {
  return {
    id: 'sess_123',
    userId: 'usr_123',
    stateVersion: CURRENT_SESSION_STATE_VERSION,
    phase: 'analysis',
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
      sourceResumeText: 'Raw extracted resume text',
      targetJobDescription: 'Backend engineer with TypeScript and PostgreSQL',
      rewriteHistory: {},
    },
    generatedOutput: {
      status: 'idle',
    },
    atsScore: {
      total: 80,
      breakdown: {
        format: 16,
        structure: 16,
        keywords: 24,
        contact: 10,
        impact: 14,
      },
      issues: [],
      suggestions: [],
    },
    creditsUsed: 0,
    messageCount: 0,
    creditConsumed: false,
    createdAt: new Date('2026-03-25T12:00:00.000Z'),
    updatedAt: new Date('2026-03-25T12:00:00.000Z'),
  }
}

describe('buildSystemPrompt', () => {
  it('uses canonical cvState plus explicit agent context', () => {
    const prompt = buildSystemPrompt(buildSession())

    expect(prompt).toContain('"fullName": "Ana Silva"')
    expect(prompt).toContain('Raw extracted resume text')
    expect(prompt).toContain('Backend engineer with TypeScript and PostgreSQL')
    expect(prompt).toContain('Current ATS score: 80/100')
  })

  it('does not reference removed legacy cvState fields', () => {
    const prompt = buildSystemPrompt(buildSession())

    expect(prompt).not.toContain('rawText')
    expect(prompt).not.toContain('targetJobDescription')
  })
})
