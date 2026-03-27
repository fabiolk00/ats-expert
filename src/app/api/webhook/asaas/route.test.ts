import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from './route'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { grantCredits, revokeSubscription } from '@/lib/asaas/quota'
import { resolveAppUserIdFromReference } from '@/lib/auth/app-user'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/asaas/quota', () => ({
  grantCredits: vi.fn(),
  revokeSubscription: vi.fn(),
}))

vi.mock('@/lib/auth/app-user', () => ({
  resolveAppUserIdFromReference: vi.fn(),
}))

const processedEvents = new Set<string>()

function buildProcessedEventsTable() {
  return {
    select: vi.fn(() => {
      const filters = new Map<string, string>()

      return {
        eq(column: string, value: string) {
          filters.set(column, value)
          return this
        },
        maybeSingle: vi.fn(async () => {
          const eventId = filters.get('event_id')
          const eventType = filters.get('event_type')
          const key = `${eventId}:${eventType}`

          return {
            data: eventId && eventType && processedEvents.has(key) ? { id: key } : null,
            error: null,
          }
        }),
      }
    }),
    insert: vi.fn(async (row: { event_id: string; event_type: string }) => {
      const key = `${row.event_id}:${row.event_type}`
      if (processedEvents.has(key)) {
        return {
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
          },
        }
      }

      processedEvents.add(key)
      return { error: null }
    }),
  }
}

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'processed_events') {
      return buildProcessedEventsTable()
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}

function createRequest(payload: unknown): NextRequest {
  return new NextRequest('http://localhost/api/webhook/asaas', {
    method: 'POST',
    headers: {
      'asaas-access-token': 'test-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

describe('Asaas webhook idempotency', () => {
  beforeEach(() => {
    processedEvents.clear()
    vi.clearAllMocks()

    process.env.ASAAS_WEBHOOK_TOKEN = 'test-token'
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getSupabaseAdminClient>,
    )
    vi.mocked(resolveAppUserIdFromReference).mockResolvedValue('usr_123')
    vi.mocked(grantCredits).mockResolvedValue(undefined)
    vi.mocked(revokeSubscription).mockResolvedValue(undefined)
  })

  it('keeps failed events retryable and skips only after a successful replay', async () => {
    const payload = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        externalReference: 'usr_123:unit',
        subscription: null,
      },
    }

    vi.mocked(grantCredits)
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(undefined)

    const failedResponse = await POST(createRequest(payload))
    expect(failedResponse.status).toBe(500)
    expect(processedEvents.size).toBe(0)

    const successfulResponse = await POST(createRequest(payload))
    expect(successfulResponse.status).toBe(200)
    expect(processedEvents.size).toBe(1)

    const duplicateResponse = await POST(createRequest(payload))
    expect(duplicateResponse.status).toBe(200)
    expect(vi.mocked(grantCredits)).toHaveBeenCalledTimes(2)
  })

  it('does not collapse recurring renewals that share the same subscription id', async () => {
    const firstRenewal = {
      event: 'SUBSCRIPTION_RENEWED',
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123:monthly',
      },
      payment: {
        id: 'pay_1',
        externalReference: 'usr_123:monthly',
      },
    }

    const secondRenewal = {
      event: 'SUBSCRIPTION_RENEWED',
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123:monthly',
      },
      payment: {
        id: 'pay_2',
        externalReference: 'usr_123:monthly',
      },
    }

    const firstResponse = await POST(createRequest(firstRenewal))
    const secondResponse = await POST(createRequest(secondRenewal))

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(processedEvents.size).toBe(2)
    expect(vi.mocked(grantCredits)).toHaveBeenNthCalledWith(1, 'usr_123', 'monthly', 'sub_123')
    expect(vi.mocked(grantCredits)).toHaveBeenNthCalledWith(2, 'usr_123', 'monthly', 'sub_123')
  })
})
