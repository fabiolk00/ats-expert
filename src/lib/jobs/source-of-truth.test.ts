import { describe, expect, it } from 'vitest'

import {
  buildResumeGenerationResultRef,
  buildSnapshotResultRef,
  resolveCanonicalResumeSource,
  resolveEffectiveResumeSource,
} from './source-of-truth'
import type { CVState } from '@/types/cv'

function buildCvState(summary: string): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    linkedin: 'https://linkedin.com/in/ana',
    location: 'Sao Paulo, BR',
    summary,
    experience: [],
    skills: ['TypeScript'],
    education: [],
    certifications: [],
  }
}

describe('resolveCanonicalResumeSource', () => {
  it('treats cvState as the canonical base truth', () => {
    const session = {
      id: 'sess_123',
      cvState: buildCvState('Base summary'),
      agentState: {},
    }

    const result = resolveCanonicalResumeSource(session)

    expect(result.cvState.summary).toBe('Base summary')
    expect(result.ref).toEqual({
      kind: 'session_cv_state',
      sessionId: 'sess_123',
      snapshotSource: 'base',
    })
  })
})

describe('resolveEffectiveResumeSource', () => {
  it('prefers optimizedCvState before cvState', () => {
    const session = {
      id: 'sess_123',
      cvState: buildCvState('Base summary'),
      agentState: {
        optimizedCvState: buildCvState('Optimized summary'),
      },
    }

    const result = resolveEffectiveResumeSource(session)

    expect(result.cvState.summary).toBe('Optimized summary')
    expect(result.ref).toEqual({
      kind: 'session_cv_state',
      sessionId: 'sess_123',
      snapshotSource: 'optimized',
    })
  })

  it('falls back to base cvState when there is no optimized state', () => {
    const session = {
      id: 'sess_123',
      cvState: buildCvState('Base summary'),
      agentState: {},
    }

    const result = resolveEffectiveResumeSource(session)

    expect(result.cvState.summary).toBe('Base summary')
    expect(result.ref.snapshotSource).toBe('base')
  })

  it('uses target-derived cvState when a resume target exists', () => {
    const session = {
      id: 'sess_123',
      cvState: buildCvState('Base summary'),
      agentState: {
        optimizedCvState: buildCvState('Optimized summary'),
      },
    }
    const resumeTarget = {
      id: 'target_123',
      sessionId: 'sess_123',
      derivedCvState: buildCvState('Target summary'),
    }

    const result = resolveEffectiveResumeSource(session, resumeTarget)

    expect(result.cvState.summary).toBe('Target summary')
    expect(result.ref).toEqual({
      kind: 'resume_target_cv_state',
      sessionId: 'sess_123',
      resumeTargetId: 'target_123',
      snapshotSource: 'target_derived',
    })
  })
})

describe('artifact result refs', () => {
  it('points artifact results at resumeGenerationId instead of signed URLs', () => {
    const resultRef = buildResumeGenerationResultRef({
      id: 'gen_123',
      sessionId: 'sess_123',
      resumeTargetId: 'target_123',
      versionNumber: 7,
    })

    expect(resultRef).toEqual({
      kind: 'resume_generation',
      resumeGenerationId: 'gen_123',
      sessionId: 'sess_123',
      resumeTargetId: 'target_123',
      versionNumber: 7,
      snapshotSource: 'generated',
    })
    expect(JSON.stringify(resultRef)).not.toContain('http')
  })

  it('can encode exact snapshot metadata without signed URLs', () => {
    const resultRef = buildSnapshotResultRef({
      sessionId: 'sess_123',
      snapshotSource: 'optimized',
    })

    expect(resultRef).toEqual({
      kind: 'session_cv_state',
      sessionId: 'sess_123',
      snapshotSource: 'optimized',
    })
  })
})
