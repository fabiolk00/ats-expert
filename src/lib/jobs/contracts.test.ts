import { describe, expect, it } from 'vitest'

import {
  AGENT_ACTION_TYPES,
  JOB_STATUSES,
  JOB_TYPES,
  resolveExecutionMode,
  type DurableJobDispatchPayload,
  type JobStatusSnapshot,
} from '@/types/jobs'

describe('AgentActionType', () => {
  it('keeps chat synchronous while durable actions stay explicit', () => {
    expect(AGENT_ACTION_TYPES).toEqual([
      'chat',
      'ats_enhancement',
      'job_targeting',
      'artifact_generation',
    ])
    expect(resolveExecutionMode('chat')).toBe('sync')
    expect(resolveExecutionMode('artifact_generation')).toBe('async')
  })
})

describe('JobStatus', () => {
  it('freezes the durable lifecycle vocabulary', () => {
    expect(JOB_STATUSES).toEqual([
      'queued',
      'running',
      'completed',
      'failed',
      'cancelled',
    ])
  })
})

describe('JobType', () => {
  it('limits durable work to the async-capable actions', () => {
    expect(JOB_TYPES).toEqual([
      'ats_enhancement',
      'job_targeting',
      'artifact_generation',
    ])
  })
})

describe('JobStatusSnapshot', () => {
  it('exposes one canonical read DTO for polling and SSE consumers', () => {
    const snapshot: JobStatusSnapshot = {
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      idempotencyKey: 'job:sess_123:artifact_generation',
      type: 'artifact_generation',
      status: 'running',
      stage: 'rendering',
      progress: {
        percent: 50,
        label: 'Rendering PDF',
      },
      dispatchInputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'optimized',
      },
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:01:00.000Z',
      claimedAt: '2026-04-16T10:00:30.000Z',
      startedAt: '2026-04-16T10:00:30.000Z',
    }

    expect(snapshot).toMatchObject({
      jobId: 'job_123',
      status: 'running',
      progress: {
        percent: 50,
        label: 'Rendering PDF',
      },
      dispatchInputRef: {
        kind: 'session_cv_state',
        snapshotSource: 'optimized',
      },
    })
  })
})

describe('DurableJobDispatchPayload', () => {
  it('requires an idempotency key and carries typed refs', () => {
    const payload: DurableJobDispatchPayload = {
      jobId: 'job_123',
      userId: 'usr_123',
      sessionId: 'sess_123',
      actionType: 'artifact_generation',
      executionMode: 'async',
      idempotencyKey: 'job:sess_123:artifact_generation',
      requestedAt: '2026-04-16T10:00:00.000Z',
      inputRef: {
        kind: 'session_cv_state',
        sessionId: 'sess_123',
        snapshotSource: 'optimized',
      },
      resultRef: {
        kind: 'resume_generation',
        resumeGenerationId: 'gen_123',
        sessionId: 'sess_123',
        versionNumber: 4,
        snapshotSource: 'generated',
      },
    }

    expect(payload.idempotencyKey).toBe('job:sess_123:artifact_generation')
    expect(payload.resultRef?.kind).toBe('resume_generation')
  })
})
