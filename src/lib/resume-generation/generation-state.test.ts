import { describe, expect, it } from 'vitest'

import {
  assertOptimizedCvStateReady,
  buildGenerationStatePatch,
  getGenerationState,
  hasRecoverableGenerationBlock,
  resolveGenerationModeFromState,
} from './generation-state'
import type { AgentState, Session } from '@/types/agent'
import type { CVState } from '@/types/cv'

const cvState: CVState = {
  fullName: 'Fabio Silva',
  email: 'fabio@example.com',
  phone: '11999999999',
  summary: 'Analista de dados com foco em BI.',
  experience: [],
  skills: ['SQL', 'Power BI'],
  education: [],
}

function buildSession(agentState: Partial<AgentState> = {}): Session {
  return {
    id: 'sess_generation_state',
    userId: 'usr_123',
    stateVersion: 1,
    phase: 'dialog',
    cvState,
    agentState: {
      parseStatus: 'parsed',
      rewriteHistory: {},
      ...agentState,
    },
    generatedOutput: { status: 'idle' },
    creditsUsed: 0,
    messageCount: 0,
    creditConsumed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('generation-state compatibility helpers', () => {
  it('reads only generation-state fields from the legacy agentState container', () => {
    const session = buildSession({
      sourceResumeText: 'legacy chat/runtime source',
      workflowMode: 'job_targeting',
      targetJobDescription: 'Analista de BI Senior com SQL.',
      optimizedCvState: cvState,
    })

    expect(getGenerationState(session)).toEqual(expect.objectContaining({
      workflowMode: 'job_targeting',
      targetJobDescription: 'Analista de BI Senior com SQL.',
      optimizedCvState: cvState,
    }))
    expect(getGenerationState(session)).not.toHaveProperty('sourceResumeText')
  })

  it('builds a typed agentState patch for generation orchestration writes', () => {
    expect(buildGenerationStatePatch({
      workflowMode: 'ats_enhancement',
      optimizedCvState: cvState,
      optimizationSummary: {
        changedSections: ['summary'],
        notes: ['Resumo fortalecido para ATS.'],
      },
    })).toEqual({
      agentState: {
        workflowMode: 'ats_enhancement',
        optimizedCvState: cvState,
        optimizationSummary: {
          changedSections: ['summary'],
          notes: ['Resumo fortalecido para ATS.'],
        },
      },
    })
  })

  it('asserts that an optimized CV snapshot is ready before artifact handoff', () => {
    expect(assertOptimizedCvStateReady(buildSession({ optimizedCvState: cvState }))).toBe(cvState)
    expect(() => assertOptimizedCvStateReady(buildSession())).toThrow(
      'Optimized CV state is not ready for resume generation session sess_generation_state.',
    )
  })

  it('resolves only official generation modes from state', () => {
    expect(resolveGenerationModeFromState(buildSession({ workflowMode: 'ats_enhancement' }))).toBe('ats_enhancement')
    expect(resolveGenerationModeFromState(buildSession({ workflowMode: 'job_targeting' }))).toBe('job_targeting')
    expect(resolveGenerationModeFromState(buildSession({ workflowMode: 'resume_review' }))).toBeNull()
  })

  it('detects recoverable generation blocks across current and legacy draft fields', () => {
    expect(hasRecoverableGenerationBlock(buildSession())).toBe(false)
    expect(hasRecoverableGenerationBlock(buildSession({
      recoverableValidationBlock: {
        status: 'validation_blocked_recoverable',
        overrideToken: 'token_123',
        modal: {
          title: 'Revisar antes de gerar',
          description: 'A geracao precisa de revisao.',
          primaryProblem: 'Lacuna detectada.',
          problemBullets: [],
          reassurance: 'Nada foi cobrado ainda.',
          actions: {
            secondary: {
              label: 'Fechar',
              action: 'close',
            },
          },
        },
        expiresAt: '2026-04-29T12:00:00.000Z',
      },
    }))).toBe(true)
    expect(hasRecoverableGenerationBlock(buildSession({
      blockedTargetedRewriteDraft: {
        id: 'draft_123',
        token: 'token_123',
        sessionId: 'sess_generation_state',
        userId: 'usr_123',
        originalCvState: cvState,
        targetJobDescription: 'Analista de BI Senior com SQL.',
        validationIssues: [],
        recoverable: true,
        createdAt: '2026-04-29T11:00:00.000Z',
        expiresAt: '2026-04-29T12:00:00.000Z',
      },
    }))).toBe(true)
  })
})
