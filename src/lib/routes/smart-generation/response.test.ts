import { describe, expect, it } from 'vitest'

import { toSmartGenerationResponse } from './response'

describe('smart-generation response', () => {
  it('maps success decisions to 200 without extra inference', async () => {
    const response = toSmartGenerationResponse({
      kind: 'success',
      body: { success: true, sessionId: 'sess_1' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, sessionId: 'sess_1' })
  })

  it('maps validation errors using the explicit decision status', async () => {
    const response = toSmartGenerationResponse({
      kind: 'validation_error',
      status: 422,
      body: { error: 'invalid' },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'invalid' })
  })
})
