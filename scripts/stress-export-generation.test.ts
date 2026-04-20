import { Writable } from 'node:stream'

import { describe, expect, it, vi } from 'vitest'

import {
  formatStressResult,
  parseStressArgs,
  runCli,
  stressExportGeneration,
  summarizeStressResults,
  type ExportStressRequestResult,
} from './stress-export-generation'

function createBufferStream() {
  let buffer = ''

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      buffer += chunk.toString()
      callback()
    },
  })

  return {
    stream,
    read: () => buffer,
  }
}

function buildRequestResult(overrides: {
  index?: number
  sessionId?: string
  response?: Partial<ExportStressRequestResult['response']>
} = {}): ExportStressRequestResult {
  return {
    index: overrides.index ?? 0,
    request: {
      sessionId: overrides.sessionId ?? 'sess_123',
      scope: 'base',
    },
    response: {
      status: overrides.response?.status ?? 202,
      latencyMs: overrides.response?.latencyMs ?? 100,
      billingStage: overrides.response?.billingStage ?? 'reserve_credit',
      success: overrides.response?.success ?? true,
      inProgress: overrides.response?.inProgress ?? true,
      jobId: overrides.response?.jobId ?? 'job_123',
      code: overrides.response?.code,
      error: overrides.response?.error,
      rawBodyPreview: overrides.response?.rawBodyPreview ?? '{"success":true}',
    },
  }
}

describe('stress-export-generation', () => {
  it('parses defaults for base-scope export stress and reuses session ids', () => {
    const parsed = parseStressArgs([
      '--url', 'https://curria.example.com',
      '--cookie', '__session=test-cookie',
      '--session-ids', 'sess_a,sess_b',
      '--requests', '6',
      '--concurrency', '3',
    ])

    if ('help' in parsed) {
      throw new Error('Expected parsed options, received help result.')
    }

    expect(parsed.url).toBe('https://curria.example.com')
    expect(parsed.cookie).toBe('__session=test-cookie')
    expect(parsed.sessionIds).toEqual(['sess_a', 'sess_b'])
    expect(parsed.scope).toBe('base')
    expect(parsed.requests).toBe(6)
    expect(parsed.concurrency).toBe(3)
    expect(parsed.settleTimeoutMs).toBe(30_000)
  })

  it('summarizes safe responses, reconciliation blocks, and terminal anomalies', () => {
    const summary = summarizeStressResults([
      buildRequestResult({
        index: 0,
        response: {
          status: 202,
          jobId: 'job_a',
          billingStage: 'reserve_credit',
        },
      }),
      buildRequestResult({
        index: 1,
        response: {
          status: 409,
          success: false,
          inProgress: false,
          code: 'BILLING_RECONCILIATION_PENDING',
          error: 'Previous generation billing is still being reconciled.',
          jobId: undefined,
          billingStage: undefined,
          rawBodyPreview: '{"success":false,"code":"BILLING_RECONCILIATION_PENDING"}',
        },
      }),
    ], [
      {
        jobId: 'job_a',
        status: 'completed',
        finalStage: 'finalize_credit',
        stageHistory: ['reserve_credit', 'render_artifact', 'finalize_credit'],
      },
    ])

    expect(summary.totalRequests).toBe(2)
    expect(summary.acceptedResponses).toBe(2)
    expect(summary.reconciliationPendingResponses).toBe(1)
    expect(summary.unexpectedResponses).toBe(0)
    expect(summary.jobStatusCounts).toEqual({ completed: 1 })
    expect(summary.jobStageCounts.finalize_credit).toBe(1)
    expect(summary.anomalousJobs).toBe(0)
  })

  it('exits non-zero when the stress run finds unexpected responses or anomalous jobs', async () => {
    const stdout = createBufferStream()
    const stderr = createBufferStream()
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'set-cookie': 'curria_e2e_auth=test-cookie; Path=/; HttpOnly',
        },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        inProgress: true,
        jobId: 'job_123',
        billingStage: 'reserve_credit',
      }), {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
        },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jobId: 'job_123',
        status: 'failed',
        stage: 'needs_reconciliation',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }))

    const exitCode = await runCli([
      '--url', 'http://127.0.0.1:3000',
      '--e2e-secret', 'curria-e2e-secret',
      '--session-id', 'sess_123',
      '--requests', '1',
      '--concurrency', '1',
      '--poll-ms', '1',
      '--settle-timeout-ms', '5',
      '--format', 'markdown',
    ], {
      fetchImpl,
      stdout: stdout.stream,
      stderr: stderr.stream,
    })

    expect(exitCode).toBe(1)
    expect(stdout.read()).toBe('')
    expect(stderr.read()).toContain('# Export Generation Stress')
    expect(stderr.read()).toContain('FAIL')
  })

  it('formats a passing run with stage visibility', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        inProgress: true,
        jobId: 'job_123',
        billingStage: 'reserve_credit',
      }), {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
        },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jobId: 'job_123',
        status: 'completed',
        stage: 'finalize_credit',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }))

    const result = await stressExportGeneration({
      url: 'https://curria.example.com',
      cookie: '__session=test-cookie',
      sessionIds: ['sess_123'],
      scope: 'base',
      concurrency: 1,
      requests: 1,
      timeoutMs: 10_000,
      settleTimeoutMs: 10_000,
      pollMs: 1,
      captureLimit: 5,
      format: 'markdown',
      e2eAppUser: 'usr_e2e_stress',
      e2eCredits: 60,
    }, {
      fetchImpl,
    })

    expect(result.ok).toBe(true)
    expect(result.summary.jobStageCounts.finalize_credit).toBe(1)
    expect(formatStressResult(result, 'markdown')).toContain('## Job Outcomes')

    const generateCall = fetchImpl.mock.calls[0]
    expect(generateCall?.[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        cookie: '__session=test-cookie',
        origin: 'https://curria.example.com',
        referer: 'https://curria.example.com/',
      }),
    })
  })
})
