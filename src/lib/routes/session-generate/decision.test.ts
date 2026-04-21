import { describe, expect, it } from 'vitest'

import { buildFailedJobResponse, buildSuccessResponseBody } from './outcome-builders'

describe('session-generate decision helpers', () => {
  it('returns the current completed success payload', () => {
    expect(buildSuccessResponseBody({
      job: {
        jobId: 'job_1',
        userId: 'usr_1',
        idempotencyKey: 'key',
        type: 'artifact_generation',
        status: 'completed',
        stage: 'processing',
        dispatchInputRef: {
          kind: 'session_cv_state',
          sessionId: 'sess_1',
          snapshotSource: 'base',
        },
        terminalResultRef: {
          kind: 'resume_generation',
          resumeGenerationId: 'gen_1',
          versionNumber: 2,
          snapshotSource: 'generated',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      scope: 'base',
    })).toEqual({
      success: true,
      scope: 'base',
      targetId: undefined,
      creditsUsed: 0,
      generationType: 'ATS_ENHANCEMENT',
      jobId: 'job_1',
      billingStage: 'processing',
      resumeGenerationId: 'gen_1',
    })
  })

  it('returns the current generation failure payload', () => {
    expect(buildFailedJobResponse({
      jobId: 'job_1',
      userId: 'usr_1',
      idempotencyKey: 'key',
      type: 'artifact_generation',
      status: 'failed',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_1',
        snapshotSource: 'base',
      },
      terminalErrorRef: {
        kind: 'resume_generation_failure',
        resumeGenerationId: 'gen_1',
        failureReason: 'File generation failed.',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })).toEqual({
      status: 500,
      body: {
        success: false,
        code: 'GENERATION_ERROR',
        error: 'File generation failed.',
        resumeGenerationId: 'gen_1',
      },
    })
  })
})
