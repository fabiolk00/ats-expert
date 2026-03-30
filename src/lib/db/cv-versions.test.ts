import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVVersion } from '@/types/agent'
import type { CVState } from '@/types/cv'

import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'

import {
  createCvVersion,
  getCvTimelineForSession,
  shouldSkipCvVersionInsert,
  toTimelineEntry,
} from './cv-versions'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

describe('cv versions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function buildSnapshot(overrides: Partial<CVState> = {}): CVState {
    return {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Backend engineer',
      experience: [],
      skills: ['TypeScript'],
      education: [],
      ...overrides,
    }
  }

  function buildVersion(input: {
    id: string
    createdAt: string
    snapshot?: CVState
    source?: CVVersion['source']
    targetResumeId?: string
  }): CVVersion {
    return {
      id: input.id,
      sessionId: 'sess_123',
      targetResumeId: input.targetResumeId,
      snapshot: input.snapshot ?? buildSnapshot(),
      source: input.source ?? (input.targetResumeId ? 'target-derived' : 'rewrite'),
      createdAt: new Date(input.createdAt),
    }
  }

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

  it('skips an identical consecutive base snapshot', () => {
    const versions = [
      buildVersion({
        id: 'ver_base_2',
        createdAt: '2026-03-27T12:10:00.000Z',
        source: 'rewrite',
      }),
      buildVersion({
        id: 'ver_base_1',
        createdAt: '2026-03-27T12:00:00.000Z',
        snapshot: buildSnapshot({ summary: 'Imported summary' }),
        source: 'ingestion',
      }),
    ]

    expect(shouldSkipCvVersionInsert(versions, buildSnapshot())).toBe(true)
  })

  it('skips an identical consecutive target-derived snapshot', () => {
    const versions = [
      buildVersion({
        id: 'ver_target_2',
        createdAt: '2026-03-27T12:10:00.000Z',
        targetResumeId: 'target_123',
      }),
      buildVersion({
        id: 'ver_target_other',
        createdAt: '2026-03-27T12:09:00.000Z',
        targetResumeId: 'target_other',
        snapshot: buildSnapshot({ summary: 'Other target summary' }),
      }),
    ]

    expect(shouldSkipCvVersionInsert(versions, buildSnapshot(), 'target_123')).toBe(true)
  })

  it('creates a new version when the canonical snapshot changed', () => {
    const versions = [
      buildVersion({
        id: 'ver_base_2',
        createdAt: '2026-03-27T12:10:00.000Z',
        snapshot: buildSnapshot({ summary: 'Original summary' }),
      }),
      buildVersion({
        id: 'ver_base_1',
        createdAt: '2026-03-27T12:00:00.000Z',
        snapshot: buildSnapshot({ summary: 'Imported summary' }),
        source: 'ingestion',
      }),
    ]

    expect(
      shouldSkipCvVersionInsert(
        versions,
        buildSnapshot({ summary: 'Updated summary with AWS ownership' }),
      ),
    ).toBe(false)
  })

  it('ignores unrelated target history when deciding whether to insert for the current target', () => {
    const nextSnapshot = buildSnapshot({ summary: 'Platform engineer focused on AWS.' })
    const versions = [
      buildVersion({
        id: 'ver_target_other',
        createdAt: '2026-03-27T12:15:00.000Z',
        targetResumeId: 'target_other',
        snapshot: nextSnapshot,
      }),
      buildVersion({
        id: 'ver_target_current',
        createdAt: '2026-03-27T12:10:00.000Z',
        targetResumeId: 'target_current',
        snapshot: buildSnapshot({ summary: 'Platform engineer focused on APIs.' }),
      }),
    ]

    expect(shouldSkipCvVersionInsert(versions, nextSnapshot, 'target_current')).toBe(false)
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
