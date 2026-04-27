import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'
import { runJobTargetingPipeline } from '@/lib/agent/job-targeting-pipeline'
import { dispatchToolWithContext } from '@/lib/agent/tools'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { createCvVersion } from '@/lib/db/cv-versions'
import { getSession, updateSession } from '@/lib/db/sessions'

vi.mock('@/lib/auth/app-user', () => ({
  getCurrentAppUser: vi.fn(),
}))

vi.mock('@/lib/db/sessions', () => ({
  getSession: vi.fn(),
  updateSession: vi.fn(),
}))

vi.mock('@/lib/db/cv-versions', () => ({
  createCvVersion: vi.fn(),
}))

vi.mock('@/lib/agent/tools', () => ({
  dispatchToolWithContext: vi.fn(),
}))

vi.mock('@/lib/agent/job-targeting-pipeline', () => ({
  runJobTargetingPipeline: vi.fn(),
}))

function buildCvState() {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    linkedin: 'https://linkedin.com/in/ana',
    location: 'Sao Paulo',
    summary: 'Profissional de BI e dados com foco em automacao.',
    experience: [{
      title: 'Analista de Dados',
      company: 'Acme',
      startDate: '2022',
      endDate: '2024',
      bullets: ['Automatizei dashboards e integrações.'],
    }],
    skills: ['SQL', 'Power BI', 'Power Automate'],
    education: [],
    certifications: [],
  }
}

function buildSession() {
  const optimizedCvState = {
    ...buildCvState(),
    summary: 'Profissional de BI e dados com experiência em dashboards, automação e integração de dados.',
  }

  return {
    id: 'sess_123',
    userId: 'usr_123',
    stateVersion: 1,
    phase: 'intake',
    cvState: buildCvState(),
    agentState: {
      parseStatus: 'parsed',
      rewriteHistory: {},
      workflowMode: 'job_targeting',
      targetJobDescription: 'Vaga para Analista de Sistemas de RH',
      rewriteStatus: 'failed',
      rewriteValidation: {
        blocked: true,
        valid: false,
        hardIssues: [{
          severity: 'high',
          section: 'summary',
          issueType: 'target_role_overclaim',
          message: 'O resumo assumiu o cargo alvo diretamente.',
        }],
        softWarnings: [],
        issues: [{
          severity: 'high',
          section: 'summary',
          issueType: 'target_role_overclaim',
          message: 'O resumo assumiu o cargo alvo diretamente.',
        }],
      },
      blockedTargetedRewriteDraft: {
        id: 'draft_123',
        token: 'override_token_123',
        sessionId: 'sess_123',
        userId: 'usr_123',
        optimizedCvState,
        originalCvState: buildCvState(),
        optimizationSummary: {
          changedSections: ['summary'],
          notes: ['Resumo reescrito para a vaga alvo.'],
        },
        targetJobDescription: 'Vaga para Analista de Sistemas de RH',
        targetRole: 'Analista de Sistemas de RH',
        validationIssues: [{
          severity: 'high',
          section: 'summary',
          issueType: 'target_role_overclaim',
          message: 'O resumo assumiu o cargo alvo diretamente.',
        }],
        recoverable: true,
        createdAt: '2026-04-27T15:00:00.000Z',
        expiresAt: '2099-04-27T15:20:00.000Z',
      },
      recoverableValidationBlock: {
        status: 'validation_blocked_recoverable',
        overrideToken: 'override_token_123',
        expiresAt: '2099-04-27T15:20:00.000Z',
        modal: {
          title: 'Encontramos pontos que podem exagerar sua experiência',
          description: 'A adaptação ficou mais agressiva do que o seu currículo original comprova.',
          primaryProblem: 'O resumo tentou assumir diretamente o cargo alvo.',
          problemBullets: ['People Analytics apareceu como experiência direta.'],
          reassurance: 'Você ainda pode gerar o currículo, mas recomendamos revisar.',
          actions: {
            secondary: {
              label: 'Fechar',
              action: 'close',
            },
            primary: {
              label: 'Gerar mesmo assim (1 crédito)',
              action: 'override_generate',
              creditCost: 1,
            },
          },
        },
      },
    },
    generatedOutput: { status: 'idle' },
    creditsUsed: 0,
    messageCount: 0,
    creditConsumed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function buildPreRewriteLowFitSession() {
  return {
    ...buildSession(),
    agentState: {
      ...buildSession().agentState,
      rewriteValidation: {
        blocked: true,
        valid: false,
        hardIssues: [{
          severity: 'high',
          section: 'summary',
          issueType: 'low_fit_target_role',
          message: 'Esta vaga parece muito distante do seu currículo atual.',
        }],
        softWarnings: [],
        issues: [{
          severity: 'high',
          section: 'summary',
          issueType: 'low_fit_target_role',
          message: 'Esta vaga parece muito distante do seu currículo atual.',
        }],
      },
      blockedTargetedRewriteDraft: {
        ...buildSession().agentState.blockedTargetedRewriteDraft,
        kind: 'pre_rewrite_low_fit_block' as const,
        optimizedCvState: undefined,
      },
      recoverableValidationBlock: {
        ...buildSession().agentState.recoverableValidationBlock,
        kind: 'pre_rewrite_low_fit_block' as const,
      },
    },
  }
}

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('https://example.com/api/session/sess_123/job-targeting/override', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://example.com',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/session/[id]/job-targeting/override', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentAppUser).mockResolvedValue({
      id: 'usr_123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      authIdentity: {
        id: 'identity_123',
        userId: 'usr_123',
        provider: 'clerk',
        providerSubject: 'clerk_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      creditAccount: {
        id: 'cred_123',
        userId: 'usr_123',
        creditsRemaining: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as never)
    vi.mocked(getSession).mockResolvedValue(buildSession() as never)
    vi.mocked(updateSession).mockResolvedValue(undefined)
    vi.mocked(runJobTargetingPipeline).mockResolvedValue({
      success: true,
      optimizedCvState: buildCvState(),
      validation: {
        blocked: false,
        valid: true,
        hardIssues: [],
        softWarnings: [],
        issues: [],
      },
    } as never)
    vi.mocked(createCvVersion).mockResolvedValue({
      id: 'ver_123',
      sessionId: 'sess_123',
      snapshot: buildCvState(),
      source: 'job-targeting',
      createdAt: new Date(),
    } as never)
  })

  it('persists the blocked rewrite and generates the override through the billable path', async () => {
    vi.mocked(dispatchToolWithContext).mockResolvedValue({
      output: {
        success: true,
        creditsUsed: 1,
        resumeGenerationId: 'gen_123',
      },
      outputJson: JSON.stringify({
        success: true,
        creditsUsed: 1,
        resumeGenerationId: 'gen_123',
      }),
    } as never)

    const response = await POST(buildRequest({
      overrideToken: 'override_token_123',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      sessionId: 'sess_123',
      creditsUsed: 1,
      resumeGenerationId: 'gen_123',
      generationType: 'JOB_TARGETING',
    })
    expect(createCvVersion).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'sess_123',
      source: 'job-targeting',
    }))
    expect(dispatchToolWithContext).toHaveBeenCalledWith(
      'generate_file',
      expect.objectContaining({
        idempotency_key: 'profile-target-override:sess_123:draft_123',
      }),
      expect.objectContaining({
        id: 'sess_123',
        agentState: expect.objectContaining({
          optimizedCvState: expect.objectContaining({
            summary: expect.stringContaining('dashboards'),
          }),
        }),
      }),
    )
    expect(updateSession).toHaveBeenLastCalledWith('sess_123', expect.objectContaining({
      agentState: expect.objectContaining({
        rewriteStatus: 'completed',
        validationOverride: expect.objectContaining({
          enabled: true,
          targetRole: 'Analista de Sistemas de RH',
        }),
        blockedTargetedRewriteDraft: undefined,
        recoverableValidationBlock: undefined,
      }),
    }))
  })

  it('runs the targeted pipeline only after confirmation for pre-rewrite low-fit blocks', async () => {
    vi.mocked(getSession).mockResolvedValue(buildPreRewriteLowFitSession() as never)
    vi.mocked(runJobTargetingPipeline).mockResolvedValue({
      success: true,
      optimizedCvState: {
        ...buildCvState(),
        summary: 'Versão gerada após confirmação explícita de low-fit.',
      },
      validation: {
        blocked: false,
        valid: true,
        hardIssues: [],
        softWarnings: [],
        issues: [],
      },
    } as never)
    vi.mocked(dispatchToolWithContext).mockResolvedValue({
      output: {
        success: true,
        creditsUsed: 1,
        resumeGenerationId: 'gen_low_fit_123',
      },
      outputJson: JSON.stringify({
        success: true,
        creditsUsed: 1,
        resumeGenerationId: 'gen_low_fit_123',
      }),
    } as never)

    const response = await POST(buildRequest({
      overrideToken: 'override_token_123',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      sessionId: 'sess_123',
      creditsUsed: 1,
      resumeGenerationId: 'gen_low_fit_123',
      generationType: 'JOB_TARGETING',
    })
    expect(runJobTargetingPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sess_123',
      }),
      expect.objectContaining({
        userAcceptedLowFit: true,
        overrideReason: 'pre_rewrite_low_fit_block',
      }),
    )
    expect(createCvVersion).not.toHaveBeenCalled()
    expect(dispatchToolWithContext).toHaveBeenCalledWith(
      'generate_file',
      expect.objectContaining({
        idempotency_key: 'profile-target-override:sess_123:draft_123',
      }),
      expect.objectContaining({
        id: 'sess_123',
      }),
    )
  })

  it('rejects override tokens that do not belong to the blocked draft', async () => {
    const response = await POST(buildRequest({
      overrideToken: 'wrong_token',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: 'O token de override não corresponde à sessão atual.',
    })
    expect(createCvVersion).not.toHaveBeenCalled()
    expect(dispatchToolWithContext).not.toHaveBeenCalled()
  })

  it('returns insufficient_credits without consuming draft state or creating a version', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValue({
      id: 'usr_123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      authIdentity: {
        id: 'identity_123',
        userId: 'usr_123',
        provider: 'clerk',
        providerSubject: 'clerk_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      creditAccount: {
        id: 'cred_123',
        userId: 'usr_123',
        creditsRemaining: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as never)

    const response = await POST(buildRequest({
      overrideToken: 'override_token_123',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(402)
    expect(await response.json()).toEqual({
      error: 'insufficient_credits',
      code: 'INSUFFICIENT_CREDITS',
      message: 'Você não tem créditos suficientes para gerar esta versão.',
      requiredCredits: 1,
      availableCredits: 0,
      openPricing: true,
    })
    expect(updateSession).not.toHaveBeenCalled()
    expect(createCvVersion).not.toHaveBeenCalled()
    expect(dispatchToolWithContext).not.toHaveBeenCalled()
  })

  it('returns a human message when the recoverable override token has expired', async () => {
    vi.mocked(getSession).mockResolvedValue({
      ...buildSession(),
      agentState: {
        ...buildSession().agentState,
        blockedTargetedRewriteDraft: {
          ...buildSession().agentState.blockedTargetedRewriteDraft,
          expiresAt: '2000-04-27T15:20:00.000Z',
        },
      },
    } as never)

    const response = await POST(buildRequest({
      overrideToken: 'override_token_123',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      error: 'Esta confirmação expirou. Gere uma nova versão para continuar.',
    })
    expect(updateSession).not.toHaveBeenCalled()
    expect(createCvVersion).not.toHaveBeenCalled()
    expect(dispatchToolWithContext).not.toHaveBeenCalled()
  })

  it('does not charge or finalize the override when the billable generation fails', async () => {
    vi.mocked(dispatchToolWithContext).mockResolvedValue({
      output: {
        success: false,
        error: 'Falha técnica ao gerar artefato.',
        code: 'INTERNAL_ERROR',
      },
      outputJson: JSON.stringify({
        success: false,
        error: 'Falha técnica ao gerar artefato.',
        code: 'INTERNAL_ERROR',
      }),
      outputFailure: {
        error: 'Falha técnica ao gerar artefato.',
        code: 'INTERNAL_ERROR',
      },
    } as never)

    const response = await POST(buildRequest({
      overrideToken: 'override_token_123',
      consumeCredit: true,
    }), {
      params: { id: 'sess_123' },
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Falha técnica ao gerar artefato.',
      code: 'INTERNAL_ERROR',
    })
    expect(updateSession).not.toHaveBeenLastCalledWith('sess_123', expect.objectContaining({
      agentState: expect.objectContaining({
        validationOverride: expect.anything(),
      }),
    }))
  })
})
