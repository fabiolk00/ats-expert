import { describe, expect, it } from 'vitest'

import { toSessionComparisonResponse } from './response'

describe('session-comparison response', () => {
  it('maps no-optimized decisions to 409 responses', async () => {
    const response = toSessionComparisonResponse({
      kind: 'no_optimized_resume',
      status: 409,
      body: { error: 'No optimized resume found for this session.' },
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'No optimized resume found for this session.' })
  })

  it('maps success decisions to 200 responses without reshaping the payload', async () => {
    const response = toSessionComparisonResponse({
      kind: 'success',
      body: {
        sessionId: 'sess_1',
        generationType: 'ATS_ENHANCEMENT',
        originalCvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'base summary',
          experience: [],
          skills: [],
          education: [],
        },
        optimizedCvState: {
          fullName: 'Ana',
          email: 'ana@example.com',
          phone: '1',
          summary: 'optimized summary',
          experience: [],
          skills: ['Python'],
          education: [],
        },
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      sessionId: 'sess_1',
      generationType: 'ATS_ENHANCEMENT',
      optimizedCvState: {
        summary: 'optimized summary',
      },
    })
  })
})
