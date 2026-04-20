import { beforeEach, describe, expect, it, vi } from 'vitest'

import { processArtifactGenerationJob } from './artifact-generation'

const {
  mockGetSession,
  mockApplyGeneratedOutputPatch,
  mockGetResumeTargetForSession,
  mockUpdateResumeTargetGeneratedOutput,
  mockGenerateBillableResume,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockApplyGeneratedOutputPatch: vi.fn(),
  mockGetResumeTargetForSession: vi.fn(),
  mockUpdateResumeTargetGeneratedOutput: vi.fn(),
  mockGenerateBillableResume: vi.fn(),
}))

vi.mock('@/lib/db/sessions', () => ({
  getSession: mockGetSession,
  applyGeneratedOutputPatch: mockApplyGeneratedOutputPatch,
}))

vi.mock('@/lib/db/resume-targets', () => ({
  getResumeTargetForSession: mockGetResumeTargetForSession,
  updateResumeTargetGeneratedOutput: mockUpdateResumeTargetGeneratedOutput,
}))

vi.mock('@/lib/resume-generation/generate-billable-resume', () => ({
  generateBillableResume: mockGenerateBillableResume,
}))

function buildSession() {
  return {
    id: 'sess_123',
    userId: 'usr_123',
    phase: 'dialog' as const,
    stateVersion: 1,
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
      parseStatus: 'parsed' as const,
      rewriteHistory: {},
    },
    generatedOutput: { status: 'idle' as const },
    creditsUsed: 1,
    messageCount: 2,
    creditConsumed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function buildJob(overrides: Record<string, unknown> = {}) {
  return {
    jobId: 'job_123',
    userId: 'usr_123',
    sessionId: 'sess_123',
    idempotencyKey: 'session-generate:sess_123:base:abc',
    type: 'artifact_generation' as const,
    status: 'running' as const,
    stage: 'processing',
    dispatchInputRef: {
      kind: 'session_cv_state' as const,
      sessionId: 'sess_123',
      snapshotSource: 'base' as const,
    },
    claimedAt: '2026-04-16T10:00:30.000Z',
    startedAt: '2026-04-16T10:00:30.000Z',
    createdAt: '2026-04-16T10:00:00.000Z',
    updatedAt: '2026-04-16T10:00:30.000Z',
    ...overrides,
  }
}

describe('processArtifactGenerationJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(buildSession())
    mockGetResumeTargetForSession.mockResolvedValue(null)
    mockApplyGeneratedOutputPatch.mockResolvedValue(undefined)
    mockUpdateResumeTargetGeneratedOutput.mockResolvedValue(undefined)
  })

  it('completes successfully when artifact output exists but resumeGenerationId cannot be finalized', async () => {
    mockGenerateBillableResume.mockResolvedValue({
      output: {
        success: true,
        pdfUrl: 'https://example.com/resume.pdf',
        docxUrl: null,
        creditsUsed: 1,
        resumeGenerationId: undefined,
      },
      generatedOutput: {
        status: 'ready',
        pdfPath: 'usr_123/sess_123/resume.pdf',
        docxPath: null,
        generatedAt: '2026-04-16T10:01:00.000Z',
      },
      resumeGeneration: undefined,
    })

    const result = await processArtifactGenerationJob(buildJob())

    expect(result).toEqual({
      ok: true,
      stage: 'completed',
      resultRef: undefined,
    })
    expect(mockApplyGeneratedOutputPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sess_123' }),
      expect.objectContaining({
        status: 'ready',
        pdfPath: 'usr_123/sess_123/resume.pdf',
      }),
    )
  })
})
