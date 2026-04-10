import { Writable } from 'node:stream'

import { describe, expect, it, vi } from 'vitest'

import { checkAgentRuntimeParity, parseParityArgs, runCli } from './check-agent-runtime-parity'

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

describe('check-agent-runtime-parity', () => {
  it('parses the required expectation flags', () => {
    const parsed = parseParityArgs([
      '--url', 'https://curria.example.com',
      '--expected-release', 'abc123',
      '--expected-release-source', 'vercel_commit',
      '--expected-agent-model', 'gpt-5-mini',
      '--expected-dialog-model', 'gpt-5.4-mini',
    ])

    if ('help' in parsed) {
      throw new Error('Expected parsed options, received help result.')
    }

    expect(parsed).toEqual({
      url: 'https://curria.example.com/api/agent',
      expected: {
        release: 'abc123',
        releaseSource: 'vercel_commit',
        agentModel: 'gpt-5-mini',
        dialogModel: 'gpt-5.4-mini',
      },
      timeoutMs: 10_000,
    })
  })

  it('passes when the live headers match the expected parity contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, {
      status: 401,
      headers: {
        'X-Agent-Release': 'abc123',
        'X-Agent-Release-Source': 'vercel_commit',
        'X-Agent-Resolved-Agent-Model': 'gpt-5-mini',
        'X-Agent-Resolved-Dialog-Model': 'gpt-5.4-mini',
      },
    }))

    const result = await checkAgentRuntimeParity({
      url: 'https://curria.example.com/api/agent',
      expected: {
        release: 'abc123',
        releaseSource: 'vercel_commit',
        agentModel: 'gpt-5-mini',
        dialogModel: 'gpt-5.4-mini',
      },
      timeoutMs: 10_000,
    }, { fetchImpl })

    expect(result.ok).toBe(true)
    expect(result.mismatches).toEqual([])
    expect(result.missingHeaders).toEqual([])
  })

  it('reports mismatches and exits non-zero when live parity drifts', async () => {
    const stdout = createBufferStream()
    const stderr = createBufferStream()
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, {
      status: 401,
      headers: {
        'X-Agent-Release': 'wrong-release',
        'X-Agent-Release-Source': 'vercel_commit',
        'X-Agent-Resolved-Agent-Model': 'gpt-5-nano',
        'X-Agent-Resolved-Dialog-Model': 'gpt-5-mini',
      },
    }))

    const exitCode = await runCli([
      '--url', 'https://curria.example.com/api/agent',
      '--expected-release', 'abc123',
      '--expected-release-source', 'vercel_commit',
      '--expected-agent-model', 'gpt-5-mini',
      '--expected-dialog-model', 'gpt-5-mini',
    ], {
      fetchImpl,
      stdout: stdout.stream,
      stderr: stderr.stream,
    })

    expect(exitCode).toBe(1)
    expect(stdout.read()).toBe('')
    expect(stderr.read()).toContain('FAIL: deployed /api/agent parity mismatch detected.')
    expect(stderr.read()).toContain('release: expected abc123, received wrong-release')
    expect(stderr.read()).toContain('agentModel: expected gpt-5-mini, received gpt-5-nano')
  })

  it('fails loudly when required provenance headers are missing', async () => {
    const stdout = createBufferStream()
    const stderr = createBufferStream()
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, {
      status: 401,
      headers: {
        'X-Agent-Release': 'abc123',
      },
    }))

    const exitCode = await runCli([
      '--url', 'https://curria.example.com/api/agent',
      '--expected-release', 'abc123',
      '--expected-release-source', 'vercel_commit',
      '--expected-agent-model', 'gpt-5-mini',
      '--expected-dialog-model', 'gpt-5-mini',
    ], {
      fetchImpl,
      stdout: stdout.stream,
      stderr: stderr.stream,
    })

    expect(exitCode).toBe(1)
    expect(stderr.read()).toContain('Missing headers: X-Agent-Release-Source, X-Agent-Resolved-Agent-Model, X-Agent-Resolved-Dialog-Model')
  })
})
