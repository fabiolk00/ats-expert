import { Writable } from 'node:stream'

import { describe, expect, it, vi } from 'vitest'

import {
  formatStressResult,
  parseStressArgs,
  runCli,
  stressAgentRoute,
  summarizeStressResults,
  type StressRequestResult,
} from './stress-agent-route'

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

function buildSsePayload(events: unknown[]): string {
  return events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join('')
}

function buildStressResult(overrides: {
  index?: number
  request?: Partial<StressRequestResult['request']>
  response?: Partial<StressRequestResult['response']>
} = {}): StressRequestResult {
  return {
    index: overrides.index ?? 0,
    request: {
      sessionId: overrides.request?.sessionId,
      messageLength: overrides.request?.messageLength ?? 120,
    },
    response: {
      status: overrides.response?.status ?? 200,
      latencyMs: overrides.response?.latencyMs ?? 100,
      contentType: overrides.response?.contentType ?? 'text/event-stream',
      headers: overrides.response?.headers ?? {
        release: 'abc123',
        releaseSource: 'vercel_commit',
        agentModel: 'gpt-5-mini',
        dialogModel: 'gpt-5-mini',
      },
      sessionId: overrides.response?.sessionId ?? 'sess_123',
      newSessionCreated: overrides.response?.newSessionCreated ?? false,
      done: overrides.response?.done ?? true,
      toolStartCount: overrides.response?.toolStartCount ?? 0,
      finalAssistantTextChars: overrides.response?.finalAssistantTextChars ?? 80,
      finalAssistantTextPreview: overrides.response?.finalAssistantTextPreview ?? 'Resposta final',
      errorCode: overrides.response?.errorCode,
      errorMessage: overrides.response?.errorMessage,
      rawBodyPreview: overrides.response?.rawBodyPreview ?? 'data: {"type":"done"}',
    },
  }
}

describe('stress-agent-route', () => {
  it('parses defaults, reuse session ids, and long vacancy profile', () => {
    const parsed = parseStressArgs([
      '--url', 'https://curria.example.com',
      '--cookie', '__session=test-cookie',
      '--session-ids', 'sess_a,sess_b',
      '--message-profile', 'long_vacancy',
      '--concurrency', '6',
      '--requests', '18',
    ])

    if ('help' in parsed) {
      throw new Error('Expected parsed options, received help result.')
    }

    expect(parsed.url).toBe('https://curria.example.com/api/agent')
    expect(parsed.cookie).toBe('__session=test-cookie')
    expect(parsed.sessionIds).toEqual(['sess_a', 'sess_b'])
    expect(parsed.messageProfile).toBe('long_vacancy')
    expect(parsed.concurrency).toBe(6)
    expect(parsed.requests).toBe(18)
    expect(parsed.timeoutMs).toBe(45_000)
  })

  it('summarizes success, failures, and latency percentiles', () => {
    const summary = summarizeStressResults([
      buildStressResult({
        index: 0,
        response: {
          status: 200,
          latencyMs: 120,
          sessionId: 'sess_a',
          done: true,
          finalAssistantTextChars: 90,
        },
      }),
      buildStressResult({
        index: 1,
        response: {
          status: 429,
          latencyMs: 250,
          sessionId: 'sess_a',
          done: false,
          finalAssistantTextChars: 0,
          errorCode: 'RATE_LIMITED',
          errorMessage: 'Too many requests.',
          rawBodyPreview: '{"error":"Too many requests."}',
        },
      }),
      buildStressResult({
        index: 2,
        response: {
          status: 200,
          latencyMs: 180,
          sessionId: 'sess_b',
          newSessionCreated: true,
          done: true,
          finalAssistantTextChars: 110,
        },
      }),
    ])

    expect(summary.totalRequests).toBe(3)
    expect(summary.successRequests).toBe(2)
    expect(summary.failedRequests).toBe(1)
    expect(summary.statusCounts).toEqual({ '200': 2, '429': 1 })
    expect(summary.newSessionCount).toBe(1)
    expect(summary.streamErrorCount).toBe(1)
    expect(summary.emptyAssistantTextCount).toBe(1)
    expect(summary.latencyMs.p50).toBe(180)
    expect(summary.latencyMs.p95).toBe(250)
    expect(summary.sessionIdsSeen).toEqual(['sess_a', 'sess_b'])
  })

  it('bootstraps local e2e auth, runs one stress request, and writes the artifact', async () => {
    const stdout = createBufferStream()
    const stderr = createBufferStream()
    const writeFileImpl = vi.fn().mockResolvedValue(undefined)
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, appUserId: 'usr_e2e_stress' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'set-cookie': 'curria_e2e_auth=test-cookie; Path=/; HttpOnly',
        },
      }))
      .mockResolvedValueOnce(new Response(
        buildSsePayload([
          { type: 'sessionCreated', sessionId: 'sess_stress' },
          { type: 'text', content: 'Resposta estavel sob carga.' },
          { type: 'done', sessionId: 'sess_stress', phase: 'dialog', messageCount: 1 },
        ]),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'X-Session-Id': 'sess_stress',
            'X-Agent-Release': 'abc123',
            'X-Agent-Release-Source': 'vercel_commit',
            'X-Agent-Resolved-Agent-Model': 'gpt-5-mini',
            'X-Agent-Resolved-Dialog-Model': 'gpt-5-mini',
          },
        },
      ))

    const exitCode = await runCli([
      '--url', 'http://127.0.0.1:3000',
      '--e2e-secret', 'curria-e2e-secret',
      '--requests', '1',
      '--concurrency', '1',
      '--format', 'markdown',
      '--output', 'tmp/agent-stress.md',
    ], {
      fetchImpl,
      writeFileImpl,
      stdout: stdout.stream,
      stderr: stderr.stream,
    })

    expect(exitCode).toBe(0)
    expect(stderr.read()).toBe('')
    expect(stdout.read()).toContain('PASS: stress artifact written to tmp/agent-stress.md')
    expect(writeFileImpl).toHaveBeenCalledWith(
      'tmp/agent-stress.md',
      expect.stringContaining('# Agent Route Stress'),
      'utf8',
    )
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('keeps failures visible in the formatted markdown output', async () => {
    const result = await stressAgentRoute({
      url: 'https://curria.example.com/api/agent',
      cookie: '__session=test-cookie',
      sessionIds: ['sess_reuse'],
      message: 'reescreva',
      messageProfile: 'follow_up',
      e2eAppUser: 'usr_e2e_stress',
      e2eCredits: 60,
      concurrency: 1,
      requests: 1,
      timeoutMs: 10_000,
      captureLimit: 5,
      format: 'markdown',
    }, {
      fetchImpl: vi.fn().mockResolvedValue(new Response(
        JSON.stringify({ error: 'Too many requests.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Release': 'abc123',
            'X-Agent-Release-Source': 'vercel_commit',
            'X-Agent-Resolved-Agent-Model': 'gpt-5-mini',
            'X-Agent-Resolved-Dialog-Model': 'gpt-5-mini',
          },
        },
      )),
    })

    expect(result.ok).toBe(false)
    expect(result.summary.failedRequests).toBe(1)
    expect(formatStressResult(result, 'markdown')).toContain('## Sample Failures')
  })
})
