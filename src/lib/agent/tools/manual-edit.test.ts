import { describe, expect, it } from 'vitest'

import { mergeToolPatch } from '@/lib/db/sessions'
import type { Session } from '@/types/agent'

import { manualEditSection } from './manual-edit'

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
      linkedin: 'linkedin.com/in/anasilva',
      location: 'Sao Paulo',
      summary: 'Backend engineer',
      experience: [],
      skills: ['TypeScript'],
      education: [],
      certifications: [{
        name: 'AWS SAA',
        issuer: 'AWS',
        year: '2024',
      }],
    },
    agentState: {
      parseStatus: 'parsed',
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

describe('manualEditSection', () => {
  it('updates only the intended canonical section', async () => {
    const session = buildSession()

    const result = await manualEditSection({
      section: 'skills',
      value: ['TypeScript', 'PostgreSQL'],
    })

    expect(result.output.success).toBe(true)
    const merged = mergeToolPatch(session, result.patch ?? {})

    expect(merged.cvState.skills).toEqual(['TypeScript', 'PostgreSQL'])
    expect(merged.cvState.summary).toBe('Backend engineer')
    expect(merged.cvState.certifications).toEqual(session.cvState.certifications)
  })

  it('rejects invalid manual edits', async () => {
    const result = await manualEditSection({
      section: 'experience',
      value: [{ company: 'Acme' }],
    } as never)

    expect(result).toEqual({
      output: {
        success: false,
        error: 'Invalid manual edit payload.',
      },
    })
  })
})
