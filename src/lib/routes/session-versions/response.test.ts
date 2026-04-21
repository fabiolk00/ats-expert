import { describe, expect, it } from 'vitest'

import { toSessionVersionsResponse } from './response'

describe('session-versions response', () => {
  it('returns the explicit decision unchanged', async () => {
    const response = toSessionVersionsResponse({
      sessionId: 'sess_1',
      versions: [],
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      sessionId: 'sess_1',
      versions: [],
    })
  })
})
