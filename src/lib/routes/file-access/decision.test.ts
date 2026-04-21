import { describe, expect, it } from 'vitest'

import { decideFileAccess } from './decision'
import type { FileAccessContext } from './types'

function buildContext(overrides: Partial<FileAccessContext> = {}): FileAccessContext {
  return {
    request: new Request('https://example.com/api/file/sess_1') as never,
    requestStartedAt: Date.now(),
    requestPath: '/api/file/sess_1',
    params: { sessionId: 'sess_1' },
    targetId: null,
    appUser: { id: 'usr_1' } as never,
    session: { id: 'sess_1', generatedOutput: { status: 'ready', pdfPath: 'file.pdf' } } as never,
    target: null,
    artifactMetadata: { status: 'ready', pdfPath: 'file.pdf' },
    latestArtifactJob: null,
    ...overrides,
  }
}

describe('file-access decision', () => {
  it('returns a locked preview decision when preview access is locked', () => {
    const decision = decideFileAccess(buildContext({
      artifactMetadata: {
        status: 'ready',
        pdfPath: 'file.pdf',
        previewAccess: {
          locked: true,
          blurred: true,
          canViewRealContent: false,
          requiresUpgrade: true,
          requiresRegenerationAfterUnlock: true,
          reason: 'free_trial_locked',
        },
      },
    }))

    expect(decision.kind).toBe('locked_preview')
    expect(decision.body.pdfUrl).toBe('/api/file/sess_1/locked-preview')
  })

  it('returns unavailable when the artifact is not ready', () => {
    const decision = decideFileAccess(buildContext({
      artifactMetadata: { status: 'failed', error: 'boom' },
    }))

    expect(decision).toEqual({
      kind: 'artifact_unavailable',
      body: {
        docxUrl: null,
        pdfUrl: null,
        available: false,
        generationStatus: 'failed',
        jobId: undefined,
        stage: undefined,
        progress: undefined,
        errorMessage: 'boom',
        previewLock: undefined,
        reconciliation: undefined,
      },
      log: {
        generationStatus: 'failed',
        lifecycleStatus: 'failed',
        jobId: undefined,
        stage: undefined,
      },
    })
  })

  it('only carries a real artifact path for artifact_available decisions', () => {
    const decision = decideFileAccess(buildContext())

    expect(decision.kind).toBe('artifact_available')
    if (decision.kind === 'artifact_available') {
      expect(decision.pdfPath).toBe('file.pdf')
    }
  })
})
