import { describe, expect, it } from 'vitest'

import {
  getRequestQueryContext,
  recordQuery,
  runWithRequestQueryContext,
} from './request-query-context'

describe('request-query-context', () => {
  it('increments query count inside an active request context', async () => {
    await runWithRequestQueryContext(
      {
        requestId: 'req_123',
        requestMethod: 'GET',
        requestPath: '/api/session/sess_123',
      },
      async () => {
        recordQuery('GET /rest/v1/sessions?id=eq.sess_123')
        recordQuery('GET /rest/v1/resume_targets?session_id=eq.sess_123')

        expect(getRequestQueryContext()).toMatchObject({
          requestId: 'req_123',
          queryCount: 2,
          queries: [
            'GET /rest/v1/sessions?id=eq.sess_123',
            'GET /rest/v1/resume_targets?session_id=eq.sess_123',
          ],
        })
        expect(getRequestQueryContext()?.patternStats.size).toBe(2)
      },
    )
  })

  it('does nothing when no request context is active', () => {
    recordQuery('GET /rest/v1/sessions?id=eq.sess_123')

    expect(getRequestQueryContext()).toBeNull()
  })

  it('caps query sampling and truncates stored query strings', async () => {
    const longQuery = `GET /rest/v1/sessions?select=${'x'.repeat(400)}`

    await runWithRequestQueryContext(
      {
        requestId: 'req_123',
        requestMethod: 'GET',
        requestPath: '/api/session/sess_123',
      },
      async () => {
        for (let index = 0; index < 25; index += 1) {
          recordQuery(`${longQuery}-${index}`)
        }

        const context = getRequestQueryContext()
        expect(context).not.toBeNull()
        expect(context?.queryCount).toBe(25)
        expect(context?.queries).toHaveLength(20)
        expect(context?.queries[0]).toHaveLength(300)
      },
    )
  })

  it('stops recording once the request context is marked completed', async () => {
    await runWithRequestQueryContext(
      {
        requestId: 'req_123',
        requestMethod: 'GET',
        requestPath: '/api/session/sess_123',
      },
      async () => {
        recordQuery('GET /rest/v1/sessions?id=eq.sess_123')

        const context = getRequestQueryContext()
        expect(context).not.toBeNull()

        if (!context) {
          return
        }

        context.completed = true
        recordQuery('GET /rest/v1/resume_targets?session_id=eq.sess_123')

        expect(context.queryCount).toBe(1)
        expect(context.queries).toEqual([
          'GET /rest/v1/sessions?id=eq.sess_123',
        ])
      },
    )
  })

  it('aggregates repeated query patterns under the same fingerprint', async () => {
    await runWithRequestQueryContext(
      {
        requestId: 'req_123',
        requestMethod: 'GET',
        requestPath: '/api/jobs',
      },
      async () => {
        recordQuery('GET /rest/v1/jobs?id=eq.123&select=*')
        recordQuery('GET /rest/v1/jobs?id=eq.456&select=*')
        recordQuery('GET /rest/v1/jobs?id=eq.789&select=*')

        const patternStats = Array.from(getRequestQueryContext()?.patternStats.values() ?? [])

        expect(patternStats).toEqual([{
          fingerprint: 'GET /rest/v1/jobs?id=eq.:number&select=*',
          sample: 'GET /rest/v1/jobs?id=eq.123&select=*',
          count: 3,
        }])
      },
    )
  })
})
