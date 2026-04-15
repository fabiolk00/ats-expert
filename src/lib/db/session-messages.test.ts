import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appendMessage, getMessages, incrementMessageCount } from '@/lib/db/session-messages'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

const selectSingle = vi.fn()
const maybeSingle = vi.fn()
const selectLimit = vi.fn()
const order = vi.fn(() => ({
  limit: selectLimit,
}))
const update = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle,
      })),
    })),
  })),
}))
const insert = vi.fn()

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'sessions') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: selectSingle,
          })),
        })),
        update,
      }
    }

    if (table === 'messages') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order,
          })),
        })),
        insert,
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}

describe('session messages persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getSupabaseAdminClient>,
    )
  })

  it('increments the message count with optimistic retries', async () => {
    selectSingle.mockResolvedValueOnce({
      data: {
        message_count: 2,
      },
      error: null,
    })
    maybeSingle.mockResolvedValueOnce({
      data: {
        message_count: 3,
      },
      error: null,
    })

    await expect(incrementMessageCount('sess_123')).resolves.toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        message_count: 3,
      }),
    )
  })

  it('returns chronologically ordered messages', async () => {
    selectLimit.mockResolvedValueOnce({
      data: [
        { role: 'assistant', content: 'segundo', created_at: '2026-04-14T12:01:00.000Z' },
        { role: 'user', content: 'primeiro', created_at: '2026-04-14T12:00:00.000Z' },
      ],
    })

    await expect(getMessages('sess_123')).resolves.toEqual([
      { role: 'user', content: 'primeiro', createdAt: new Date('2026-04-14T12:00:00.000Z') },
      {
        role: 'assistant',
        content: 'segundo',
        createdAt: new Date('2026-04-14T12:01:00.000Z'),
      },
    ])
  })

  it('appends messages with explicit ids and timestamps', async () => {
    insert.mockResolvedValueOnce({ error: null })

    await appendMessage('sess_123', 'assistant', 'resposta')

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        created_at: expect.any(String),
        session_id: 'sess_123',
        role: 'assistant',
        content: 'resposta',
      }),
    )
  })
})
