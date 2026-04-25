import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fingerprintJD } from '@/lib/agent/jd-fingerprint'
import { listActiveJobsForUser } from '@/lib/jobs/repository'

import { evaluateSessionGeneratePolicy } from './policy'
import { buildActiveExportConflictBody } from './outcome-builders'
import { isBillingReconciliationPending } from './policy'

vi.mock('@/lib/jobs/repository', () => ({
  listActiveJobsForUser: vi.fn(),
}))

describe('session-generate policy helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listActiveJobsForUser).mockResolvedValue([])
  })

  it('detects reconciliation pending for failed release-credit jobs', () => {
    expect(isBillingReconciliationPending({
      jobId: 'job_1',
      userId: 'usr_1',
      idempotencyKey: 'key',
      type: 'artifact_generation',
      status: 'failed',
      stage: 'release_credit',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_1',
        snapshotSource: 'base',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })).toBe(true)
  })

  it('returns the current export conflict payload', () => {
    expect(buildActiveExportConflictBody({
      jobId: 'job_1',
      userId: 'usr_1',
      idempotencyKey: 'key',
      type: 'artifact_generation',
      status: 'running',
      stage: 'processing',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_1',
        snapshotSource: 'base',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })).toEqual({
      success: false,
      code: 'EXPORT_ALREADY_PROCESSING',
      error: 'You already have an export in progress. Aguarde a conclusão antes de iniciar outra exportação.',
      jobId: 'job_1',
      billingStage: 'processing',
    })
  })

  it('ignores unrelated active exports from other sessions', async () => {
    vi.mocked(listActiveJobsForUser).mockResolvedValue([
      {
        jobId: 'job_other_session',
        userId: 'usr_1',
        sessionId: 'sess_other',
        idempotencyKey: 'artifact:other',
        type: 'artifact_generation',
        status: 'running',
        stage: 'rendering',
        dispatchInputRef: {
          kind: 'session_cv_state',
          sessionId: 'sess_other',
          snapshotSource: 'base',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await expect(evaluateSessionGeneratePolicy({
      scope: 'base',
      session: {
        id: 'sess_1',
        agentState: {},
      } as never,
      appUser: { id: 'usr_1' } as never,
      target: null,
      primaryIdempotencyKey: 'artifact:sess_1:base',
    } as never)).resolves.toEqual({ kind: 'allow' })
  })

  it('blocks active exports that belong to the same session scope', async () => {
    vi.mocked(listActiveJobsForUser).mockResolvedValue([
      {
        jobId: 'job_same_session',
        userId: 'usr_1',
        sessionId: 'sess_1',
        idempotencyKey: 'artifact:sess_1:older',
        type: 'artifact_generation',
        status: 'running',
        stage: 'rendering',
        dispatchInputRef: {
          kind: 'session_cv_state',
          sessionId: 'sess_1',
          snapshotSource: 'base',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await expect(evaluateSessionGeneratePolicy({
      scope: 'base',
      session: {
        id: 'sess_1',
        agentState: {},
      } as never,
      appUser: { id: 'usr_1' } as never,
      target: null,
      primaryIdempotencyKey: 'artifact:sess_1:base',
    } as never)).resolves.toEqual({
      kind: 'blocked_active_export',
      conflictingJob: expect.objectContaining({
        jobId: 'job_same_session',
      }),
    })
  })

  it('allows target generation for medium career-fit risk after the warning was shown', async () => {
    await expect(evaluateSessionGeneratePolicy({
      scope: 'target',
      session: {
        id: 'sess_medium',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '555-0100',
          summary: 'Analista de BI com foco em SQL e Power BI.',
          experience: [],
          skills: ['SQL', 'Power BI'],
          education: [],
        },
        agentState: {
          targetJobDescription: 'Growth marketing role with growth analytics, CRM optimization and SEO reporting ownership.',
          careerFitEvaluation: {
            riskLevel: 'medium',
            needsExplicitConfirmation: false,
            summary: 'Alinhamento parcial com lacunas relevantes.',
            reasons: [],
            riskPoints: 4,
            assessedAt: '2026-04-12T12:00:00.000Z',
            signals: {
              matchScore: 52,
              missingSkillsCount: 2,
              weakAreasCount: 2,
              familyDistance: 'adjacent',
              seniorityGapMajor: false,
            },
          },
          phaseMeta: {
            careerFitWarningIssuedAt: '2026-04-12T12:05:00.000Z',
            careerFitRiskLevelAtWarning: 'medium',
            careerFitWarningJDFingerprint: fingerprintJD('Growth marketing role with growth analytics, CRM optimization and SEO reporting ownership.'),
            careerFitWarningTargetJobDescription: 'Growth marketing role with growth analytics, CRM optimization and SEO reporting ownership.',
          },
        },
      } as never,
      appUser: { id: 'usr_1' } as never,
      target: { id: 'target_1' } as never,
      primaryIdempotencyKey: 'artifact:sess_medium:target',
    } as never)).resolves.toEqual({ kind: 'allow' })
  })

  it('blocks target generation for high career-fit risk until explicit confirmation is recorded', async () => {
    await expect(evaluateSessionGeneratePolicy({
      scope: 'target',
      session: {
        id: 'sess_high',
        cvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '555-0100',
          summary: 'Analista de BI com foco em SQL e Power BI.',
          experience: [],
          skills: ['SQL', 'Power BI'],
          education: [],
        },
        agentState: {
          targetJobDescription: 'Senior Platform Engineer com foco em Kubernetes, Go, Terraform e arquitetura distribuida.',
          careerFitEvaluation: {
            riskLevel: 'high',
            needsExplicitConfirmation: true,
            summary: 'Desalinhamento estrutural para a vaga.',
            reasons: [],
            riskPoints: 10,
            assessedAt: '2026-04-12T12:00:00.000Z',
            signals: {
              matchScore: 35,
              missingSkillsCount: 6,
              weakAreasCount: 5,
              familyDistance: 'distant',
              seniorityGapMajor: true,
            },
          },
          phaseMeta: {
            careerFitWarningIssuedAt: '2026-04-12T12:05:00.000Z',
            careerFitRiskLevelAtWarning: 'high',
            careerFitWarningJDFingerprint: fingerprintJD('Senior Platform Engineer com foco em Kubernetes, Go, Terraform e arquitetura distribuida.'),
            careerFitWarningTargetJobDescription: 'Senior Platform Engineer com foco em Kubernetes, Go, Terraform e arquitetura distribuida.',
          },
        },
      } as never,
      appUser: { id: 'usr_1' } as never,
      target: { id: 'target_1' } as never,
      primaryIdempotencyKey: 'artifact:sess_high:target',
    } as never)).resolves.toEqual({ kind: 'blocked_career_fit_confirmation' })
  })
})
