import { describe, expect, it } from 'vitest'

import { buildActiveExportConflictBody } from './outcome-builders'
import { isBillingReconciliationPending } from './policy'

describe('session-generate policy helpers', () => {
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
})
