import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

import { getExistingUserProfile, saveImportedUserProfile } from './user-profiles'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/db/ids', () => ({
  createDatabaseId: () => 'profile_new',
}))

vi.mock('@/lib/db/timestamps', () => ({
  createUpdatedAtTimestamp: () => ({
    updated_at: '2026-04-15T01:00:00.000Z',
  }),
}))

function buildValidCvState() {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Backend engineer',
    experience: [],
    skills: ['TypeScript'],
    education: [],
  }
}

describe('user profile repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses imported profile cv_state into a typed CVState contract', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'profile_123',
        user_id: 'usr_123',
        cv_state: buildValidCvState(),
        source: 'pdf',
        linkedin_url: null,
        profile_photo_url: null,
        extracted_at: '2026-04-15T01:00:00.000Z',
        created_at: '2026-04-15T01:00:00.000Z',
        updated_at: '2026-04-15T01:00:00.000Z',
      },
      error: null,
    })

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single,
          })),
        })),
      })),
    } as never)

    const profile = await getExistingUserProfile('usr_123')

    expect(profile?.cv_state.fullName).toBe('Ana Silva')
    expect(profile?.cv_state.skills).toEqual(['TypeScript'])
  })

  it('rejects malformed imported profile cv_state rows', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'profile_123',
        user_id: 'usr_123',
        cv_state: {
          fullName: 'Ana Silva',
          phone: '555-0100',
          summary: 'Backend engineer',
          experience: [],
          skills: [],
          education: [],
        },
        source: 'pdf',
        linkedin_url: null,
        profile_photo_url: null,
        extracted_at: '2026-04-15T01:00:00.000Z',
        created_at: '2026-04-15T01:00:00.000Z',
        updated_at: '2026-04-15T01:00:00.000Z',
      },
      error: null,
    })

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single,
          })),
        })),
      })),
    } as never)

    await expect(getExistingUserProfile('usr_123')).rejects.toThrow()
  })

  it('returns a typed fallback row after save when the read-after-write lookup misses', async () => {
    const single = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const upsert = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single,
          })),
        })),
        upsert,
      })),
    } as never)

    const profile = await saveImportedUserProfile({
      appUserId: 'usr_123',
      cvState: buildValidCvState(),
      source: 'pdf',
    })

    expect(profile.cv_state.email).toBe('ana@example.com')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cv_state: expect.objectContaining({ fullName: 'Ana Silva' }),
      }),
      { onConflict: 'user_id' },
    )
  })
})
