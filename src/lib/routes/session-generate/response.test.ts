import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  toSessionGenerateExecutionResponse,
  toSessionGeneratePolicyResponse,
} from './response'
import type { SessionGenerateContext } from './types'

vi.mock('@/lib/observability/structured-log', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}))

function buildContext(overrides: Partial<SessionGenerateContext> = {}): SessionGenerateContext {
  return {
    request: new Request('https://example.com/api/session/sess_1/generate', { method: 'POST' }) as never,
    requestStartedAt: Date.now(),
    requestPath: '/api/session/sess_1/generate',
    params: { id: 'sess_1' },
    appUser: { id: 'usr_1' } as never,
    session: { id: 'sess_1' } as never,
    body: { scope: 'base' },
    scope: 'base',
    target: null,
    effectiveSource: { ref: { kind: 'session_cv_state', sessionId: 'sess_1', snapshotSource: 'base' } } as never,
    primaryIdempotencyKey: 'key',
    ...overrides,
  }
}

describe('session-generate response', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps career-fit policy blocks through the explicit policy decision', async () => {
    const response = toSessionGeneratePolicyResponse(buildContext({
      body: { scope: 'target', targetId: 'target_1' },
      scope: 'target',
    }), {
      kind: 'blocked_career_fit_confirmation',
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      success: false,
      error: 'A vaga parece um encaixe fraco para o perfil atual. Confirme explicitamente no chat que deseja continuar antes de gerar esta versão.',
      code: 'CAREER_FIT_CONFIRMATION_REQUIRED',
    })
  })

  it('maps blocked reconciliation without inferring from raw route state', async () => {
    const response = toSessionGenerateExecutionResponse(buildContext(), {
      kind: 'blocked_reconciliation',
      job: {
        jobId: 'job_1',
        userId: 'usr_1',
        idempotencyKey: 'key',
        type: 'artifact_generation',
        status: 'failed',
        stage: 'needs_reconciliation',
        dispatchInputRef: {
          kind: 'session_cv_state',
          sessionId: 'sess_1',
          snapshotSource: 'base',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      success: false,
      code: 'BILLING_RECONCILIATION_PENDING',
      error: 'Previous generation billing is still being reconciled.',
    })
  })
})
