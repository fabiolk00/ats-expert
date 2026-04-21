import { describe, expect, it } from 'vitest'

import { toSessionCompareResponse } from './response'

describe('session-compare response', () => {
  it('preserves locked decisions without adding diff output', async () => {
    const response = toSessionCompareResponse({
      kind: 'locked',
      body: {
        sessionId: 'sess_1',
        locked: true,
        reason: 'preview_locked',
        left: { kind: 'base', label: 'Base', previewLocked: false },
        right: { kind: 'version', id: 'ver_1', label: 'Version', previewLocked: true },
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      sessionId: 'sess_1',
      locked: true,
      reason: 'preview_locked',
      left: { kind: 'base', label: 'Base', previewLocked: false },
      right: { kind: 'version', id: 'ver_1', label: 'Version', previewLocked: true },
    })
  })
})
