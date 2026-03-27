import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVVersion } from '@/types/agent'
import type { CVState } from '@/types/cv'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

import { createCvVersion, getCvTimelineForSession, toTimelineEntry } from './cv-versions'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

describe('cv versions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores immutable snapshots', async () => {
    let insertedSnapshot: CVState | null = null

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      rpc: vi.fn((fn: string, args: { p_snapshot: CVState }) => {
        if (fn !== 'create_cv_version_record') {
          throw new Error(`Unexpected RPC: ${fn}`)
        }

        insertedSnapshot = structuredClone(args.p_snapshot)

        return Promise.resolve({
          data: {
            id: 'ver_123',
            session_id: 'sess_123',
            snapshot: args.p_snapshot,
            source: 'rewrite',
            created_at: '2026-03-27T12:00:00.000Z',
          },
          error: null,
        })
      }),
    } as unknown as ReturnType<typeof getSupabaseAdminClient>)

    const snapshot: CVState = {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Original summary',
      experience: [],
      skills: ['TypeScript'],
      education: [],
    }

    const version = await createCvVersion({
      sessionId: 'sess_123',
      snapshot,
      source: 'rewrite',
    })

    snapshot.summary = 'Mutated later'
    snapshot.skills.push('GraphQL')

    expect(insertedSnapshot).toEqual({
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Original summary',
      experience: [],
      skills: ['TypeScript'],
      education: [],
    })
    expect(version.snapshot).toEqual(insertedSnapshot)
  })

  it('sorts timeline entries in descending timestamp order', async () => {
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              returns: vi.fn(async () => ({
                data: [
                  {
                    id: 'ver_new',
                    session_id: 'sess_123',
                    snapshot: {
                      fullName: 'Ana Silva',
                      email: 'ana@example.com',
                      phone: '555-0100',
                      summary: 'Updated',
                      experience: [],
                      skills: [],
                      education: [],
                    },
                    source: 'rewrite',
                    created_at: '2026-03-27T12:10:00.000Z',
                  },
                  {
                    id: 'ver_old',
                    session_id: 'sess_123',
                    snapshot: {
                      fullName: 'Ana Silva',
                      email: 'ana@example.com',
                      phone: '555-0100',
                      summary: 'Imported',
                      experience: [],
                      skills: [],
                      education: [],
                    },
                    source: 'ingestion',
                    created_at: '2026-03-27T12:00:00.000Z',
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as unknown as ReturnType<typeof getSupabaseAdminClient>)

    const versions = await getCvTimelineForSession('sess_123')

    expect(versions.map((version) => version.id)).toEqual(['ver_new', 'ver_old'])
    expect(versions.map((version) => version.timestamp)).toEqual([
      '2026-03-27T12:10:00.000Z',
      '2026-03-27T12:00:00.000Z',
    ])
  })

  it('builds consistent timeline labels', () => {
    const baseVersion: CVVersion = {
      id: 'ver_base',
      sessionId: 'sess_123',
      snapshot: {
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '555-0100',
        summary: 'Imported',
        experience: [],
        skills: [],
        education: [],
      },
      source: 'ingestion',
      createdAt: new Date('2026-03-27T12:00:00.000Z'),
    }

    const targetVersion: CVVersion = {
      id: 'ver_target',
      sessionId: 'sess_123',
      targetResumeId: 'target_123',
      snapshot: {
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '555-0100',
        summary: 'Targeted',
        experience: [],
        skills: [],
        education: [],
      },
      source: 'target-derived',
      createdAt: new Date('2026-03-27T12:05:00.000Z'),
    }

    expect(toTimelineEntry(baseVersion)).toMatchObject({
      label: 'Base Resume Imported',
      source: 'ingestion',
      scope: 'base',
      timestamp: '2026-03-27T12:00:00.000Z',
    })
    expect(toTimelineEntry(targetVersion)).toMatchObject({
      label: 'Target Resume Created (target_123)',
      source: 'target-derived',
      scope: 'target-derived',
      timestamp: '2026-03-27T12:05:00.000Z',
    })
  })
})
