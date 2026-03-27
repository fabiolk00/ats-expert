import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState, GapAnalysisResult } from '@/types/cv'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

import { createResumeTarget, updateResumeTargetGeneratedOutput } from './resume-targets'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

function buildDerivedCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Backend engineer optimized for cloud roles.',
    experience: [],
    skills: ['TypeScript', 'AWS'],
    education: [],
  }
}

function buildGapAnalysis(): GapAnalysisResult {
  return {
    matchScore: 74,
    missingSkills: ['Terraform'],
    weakAreas: ['summary'],
    improvementSuggestions: ['Highlight infrastructure ownership'],
  }
}

describe('resume targets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the target and version snapshot through a single transactional RPC', async () => {
    const persistedTargets: string[] = []

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      rpc: vi.fn((fn: string, args: {
        p_session_id: string
        p_user_id: string
        p_target_job_description: string
        p_derived_cv_state: CVState
        p_gap_analysis: GapAnalysisResult | null
      }) => {
        if (fn !== 'create_resume_target_with_version') {
          throw new Error(`Unexpected RPC: ${fn}`)
        }

        persistedTargets.push(args.p_target_job_description)

        return Promise.resolve({
          data: {
            id: 'target_123',
            session_id: args.p_session_id,
            target_job_description: args.p_target_job_description,
            derived_cv_state: args.p_derived_cv_state,
            gap_analysis: args.p_gap_analysis,
            created_at: '2026-03-27T12:00:00.000Z',
            updated_at: '2026-03-27T12:00:00.000Z',
          },
          error: null,
        })
      }),
    } as unknown as ReturnType<typeof getSupabaseAdminClient>)

    const target = await createResumeTarget({
      sessionId: 'sess_123',
      userId: 'usr_123',
      targetJobDescription: 'AWS backend role',
      derivedCvState: buildDerivedCvState(),
      gapAnalysis: buildGapAnalysis(),
    })

    expect(target.id).toBe('target_123')
    expect(persistedTargets).toEqual(['AWS backend role'])
  })

  it('does not leave a target behind when the transactional RPC fails', async () => {
    const persistedTargets: string[] = []

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      rpc: vi.fn(() => Promise.resolve({
        data: null,
        error: {
          message: 'transaction failed after target insert attempt',
        },
      })),
    } as unknown as ReturnType<typeof getSupabaseAdminClient>)

    await expect(createResumeTarget({
      sessionId: 'sess_123',
      userId: 'usr_123',
      targetJobDescription: 'AWS backend role',
      derivedCvState: buildDerivedCvState(),
      gapAnalysis: buildGapAnalysis(),
    })).rejects.toThrow('Failed to create resume target')

    expect(persistedTargets).toEqual([])
  })

  it('persists generated artifact metadata on the target record', async () => {
    const updateEqId = vi.fn().mockResolvedValue({ error: null })
    const updateEqSession = vi.fn(() => ({
      eq: updateEqId,
    }))

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      rpc: vi.fn(),
      from: vi.fn((table: string) => {
        if (table !== 'resume_targets') {
          throw new Error(`Unexpected table: ${table}`)
        }

        return {
          update: vi.fn(() => ({
            eq: updateEqSession,
          })),
        }
      }),
    } as unknown as ReturnType<typeof getSupabaseAdminClient>)

    await updateResumeTargetGeneratedOutput('sess_123', 'target_123', {
      status: 'ready',
      docxPath: 'usr_123/sess_123/targets/target_123/resume.docx',
      pdfPath: 'usr_123/sess_123/targets/target_123/resume.pdf',
      generatedAt: '2026-03-27T12:30:00.000Z',
    })

    expect(updateEqSession).toHaveBeenCalledWith('session_id', 'sess_123')
    expect(updateEqId).toHaveBeenCalledWith('id', 'target_123')
  })
})
