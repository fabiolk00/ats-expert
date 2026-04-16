import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  cancelJob,
  claimJob,
  completeJob,
  createJob,
  failJob,
  getJob,
  listJobsForUser,
  mapJobRowToStatusSnapshot,
} from './repository'

vi.mock('@/lib/db/supabase-admin', () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/db/ids', () => ({
  createDatabaseId: vi.fn(() => 'job_test_123'),
}))

vi.mock('@/lib/db/timestamps', () => ({
  createInsertTimestamps: vi.fn(() => ({
    created_at: '2026-04-16T10:00:00.000Z',
    updated_at: '2026-04-16T10:00:00.000Z',
  })),
  createUpdatedAtTimestamp: vi.fn(() => ({
    updated_at: '2026-04-16T10:01:00.000Z',
  })),
}))

function createChainMock(result: { data: unknown; error: unknown }): any {
  const calls: { method: string; args: unknown[] }[] = []

  const chain: Record<string, (...args: unknown[]) => Record<string, unknown>> = {}

  const self = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === '_calls') return calls
      if (prop === 'then') {
        return (resolve: (value: unknown) => void, reject: (error: unknown) => void) =>
          Promise.resolve(result).then(resolve, reject)
      }

      return (...args: unknown[]) => {
        calls.push({ method: prop, args })

        if (prop === 'single' || prop === 'maybeSingle') {
          return Promise.resolve(result)
        }

        return self
      }
    },
  })

  return self as unknown as ReturnType<typeof createChainMock>
}

let chainsByKey: Record<string, ReturnType<typeof createChainMock>[]>

function resetChains() {
  chainsByKey = {}
}

function makeFrom(overrides: Record<string, () => ReturnType<typeof createChainMock>> = {}) {
  return vi.fn((table: string) => {
    const ops: Record<string, (...args: unknown[]) => unknown> = {}

    for (const op of ['insert', 'select', 'update'] as const) {
      ops[op] = (...args: unknown[]) => {
        const key = `${table}.${op}`
        const chain = overrides[key]
          ? overrides[key]()
          : createChainMock({ data: null, error: null })

        chainsByKey[key] ??= []
        chainsByKey[key].push(chain)
        ;(chain as unknown as { _calls: { method: string; args: unknown[] }[] })._calls.push({
          method: op,
          args,
        })

        return chain
      }
    }

    return ops
  })
}

let mockSupabase: { from: ReturnType<typeof makeFrom> }

type JobRow = {
  id: string
  user_id: string
  session_id: string | null
  resume_target_id: string | null
  idempotency_key: string
  type: 'artifact_generation' | 'ats_enhancement' | 'job_targeting'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  stage: string | null
  progress: unknown
  dispatch_input_ref: unknown
  terminal_result_ref: unknown
  terminal_error_ref: unknown
  metadata: unknown
  claimed_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

function buildJobRow(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: 'job_123',
    user_id: 'usr_123',
    session_id: 'sess_123',
    resume_target_id: null,
    idempotency_key: 'artifact:sess_123',
    type: 'artifact_generation',
    status: 'queued',
    stage: 'queued',
    progress: {
      percent: 0,
      label: 'Queued',
    },
    dispatch_input_ref: {
      kind: 'session_cv_state',
      sessionId: 'sess_123',
      snapshotSource: 'optimized',
    },
    terminal_result_ref: null,
    terminal_error_ref: null,
    metadata: {
      requestId: 'req_123',
    },
    claimed_at: null,
    started_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2026-04-16T10:00:00.000Z',
    updated_at: '2026-04-16T10:00:00.000Z',
    ...overrides,
  }
}

function staleClaimedAt(): string {
  return new Date(Date.now() - 10 * 60 * 1000).toISOString()
}

describe('createJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChains()
  })

  it('rejects a missing idempotency key', async () => {
    mockSupabase = {
      from: makeFrom(),
    }

    await expect(createJob({
      userId: 'usr_123',
      type: 'artifact_generation',
      idempotencyKey: '   ',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'base',
      },
    })).rejects.toThrow('Durable jobs require a non-empty idempotency key.')
  })

  it('dedupes duplicate dispatches by idempotencyKey', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.insert': () => createChainMock({
          data: null,
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "jobs_user_type_idempotency_key_idx"',
          },
        }),
        'jobs.select': () => createChainMock({
          data: buildJobRow({ status: 'running', stage: 'rendering' }),
          error: null,
        }),
      }),
    }

    const result = await createJob({
      userId: 'usr_123',
      sessionId: 'sess_123',
      type: 'artifact_generation',
      idempotencyKey: 'artifact:sess_123',
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'optimized',
      },
    })

    expect(result.wasCreated).toBe(false)
    expect(result.job.status).toBe('running')

    const selectCalls = chainsByKey['jobs.select'][0]._calls
    expect(selectCalls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['user_id', 'usr_123'] },
      { method: 'eq', args: ['type', 'artifact_generation'] },
      { method: 'eq', args: ['idempotency_key', 'artifact:sess_123'] },
    ]))
  })
})

describe('getJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChains()
  })

  it('scopes reads to user_id', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.select': () => createChainMock({
          data: buildJobRow(),
          error: null,
        }),
      }),
    }

    const result = await getJob('job_123', 'usr_123')

    expect(result?.jobId).toBe('job_123')
    expect(chainsByKey['jobs.select'][0]._calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['id', 'job_123'] },
      { method: 'eq', args: ['user_id', 'usr_123'] },
    ]))
  })
})

describe('listJobsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChains()
  })

  it('keeps list reads scoped to user_id', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.select': () => createChainMock({
          data: [buildJobRow(), buildJobRow({ id: 'job_456' })],
          error: null,
        }),
      }),
    }

    const result = await listJobsForUser({
      userId: 'usr_123',
      type: 'artifact_generation',
    })

    expect(result).toHaveLength(2)
    expect(chainsByKey['jobs.select'][0]._calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['user_id', 'usr_123'] },
      { method: 'eq', args: ['type', 'artifact_generation'] },
    ]))
  })
})

describe('claimJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChains()
  })

  it('fences the initial claim on queued status', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.update': () => createChainMock({
          data: buildJobRow({
            status: 'running',
            stage: 'rendering',
            claimed_at: '2026-04-16T10:00:30.000Z',
            started_at: '2026-04-16T10:00:30.000Z',
          }),
          error: null,
        }),
      }),
    }

    const result = await claimJob({
      jobId: 'job_123',
      userId: 'usr_123',
      stage: 'rendering',
    })

    expect(result?.status).toBe('running')
    expect(chainsByKey['jobs.update'][0]._calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['id', 'job_123'] },
      { method: 'eq', args: ['user_id', 'usr_123'] },
      { method: 'eq', args: ['status', 'queued'] },
    ]))
  })

  it('reclaims stale claimed_at rows with owner fencing', async () => {
    const staleClaim = staleClaimedAt()

    mockSupabase = {
      from: makeFrom({
        'jobs.update': (() => {
          let callCount = 0

          return () => {
            callCount += 1

            if (callCount === 1) {
              return createChainMock({
                data: null,
                error: {
                  code: 'PGRST116',
                  message: 'not found',
                },
              })
            }

            return createChainMock({
              data: buildJobRow({
                status: 'running',
                stage: 'rendering',
                claimed_at: '2026-04-16T10:01:00.000Z',
                started_at: '2026-04-16T10:01:00.000Z',
              }),
              error: null,
            })
          }
        })(),
        'jobs.select': () => createChainMock({
          data: buildJobRow({
            status: 'running',
            stage: 'rendering',
            claimed_at: staleClaim,
            started_at: staleClaim,
          }),
          error: null,
        }),
      }),
    }

    const result = await claimJob({
      jobId: 'job_123',
      userId: 'usr_123',
      stage: 'rendering',
    })

    expect(result?.claimedAt).toBe('2026-04-16T10:01:00.000Z')
    expect(chainsByKey['jobs.update'][1]._calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['status', 'running'] },
      { method: 'eq', args: ['claimed_at', staleClaim] },
    ]))
  })
})

describe('terminal fencing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChains()
  })

  it('completeJob cannot overwrite a newer owner', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.update': () => createChainMock({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'no rows',
          },
        }),
      }),
    }

    await expect(completeJob({
      jobId: 'job_123',
      userId: 'usr_123',
      ownerClaimedAt: '2026-04-16T10:00:30.000Z',
      resultRef: {
        kind: 'resume_generation',
        resumeGenerationId: 'gen_123',
        sessionId: 'sess_123',
        versionNumber: 3,
        snapshotSource: 'generated',
      },
    })).rejects.toThrow(/Failed to persist completed/)

    expect(chainsByKey['jobs.update'][0]._calls).toEqual(expect.arrayContaining([
      { method: 'eq', args: ['claimed_at', '2026-04-16T10:00:30.000Z'] },
    ]))
  })

  it('failJob cannot overwrite a newer owner', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.update': () => createChainMock({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'no rows',
          },
        }),
      }),
    }

    await expect(failJob({
      jobId: 'job_123',
      userId: 'usr_123',
      ownerClaimedAt: '2026-04-16T10:00:30.000Z',
      errorRef: {
        kind: 'job_error',
        code: 'TIMEOUT',
        message: 'Timed out',
      },
    })).rejects.toThrow(/Failed to persist failed/)
  })

  it('cancelJob cannot overwrite a newer owner', async () => {
    mockSupabase = {
      from: makeFrom({
        'jobs.update': () => createChainMock({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'no rows',
          },
        }),
      }),
    }

    await expect(cancelJob({
      jobId: 'job_123',
      userId: 'usr_123',
      ownerClaimedAt: '2026-04-16T10:00:30.000Z',
      errorRef: {
        kind: 'job_error',
        code: 'CANCELLED',
        message: 'Cancelled by user',
      },
    })).rejects.toThrow(/Failed to persist cancelled/)
  })
})

describe('mapJobRowToStatusSnapshot', () => {
  it('returns the canonical status DTO', () => {
    const snapshot = mapJobRowToStatusSnapshot(buildJobRow({
      status: 'completed',
      progress: {
        percent: 100,
        label: 'Completed',
      },
      terminal_result_ref: {
        kind: 'resume_generation',
        resumeGenerationId: 'gen_123',
        sessionId: 'sess_123',
        versionNumber: 5,
        snapshotSource: 'generated',
      },
      completed_at: '2026-04-16T10:05:00.000Z',
      updated_at: '2026-04-16T10:05:00.000Z',
    }))

    expect(snapshot).toEqual({
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      resumeTargetId: undefined,
      idempotencyKey: 'artifact:sess_123',
      type: 'artifact_generation',
      status: 'completed',
      stage: 'queued',
      progress: {
        percent: 100,
        label: 'Completed',
      },
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'optimized',
      },
      terminalResultRef: {
        kind: 'resume_generation',
        resumeGenerationId: 'gen_123',
        sessionId: 'sess_123',
        versionNumber: 5,
        snapshotSource: 'generated',
      },
      terminalErrorRef: undefined,
      claimedAt: undefined,
      startedAt: undefined,
      completedAt: '2026-04-16T10:05:00.000Z',
      cancelledAt: undefined,
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:05:00.000Z',
    })
  })
})
