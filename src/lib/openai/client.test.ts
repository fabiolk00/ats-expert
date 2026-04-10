import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveOpenAIBaseUrl } from './client'

const originalOpenAIKey = process.env.OPENAI_API_KEY

afterEach(() => {
  vi.resetModules()

  if (originalOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = originalOpenAIKey
  }
})

describe('resolveOpenAIBaseUrl', () => {
  it('returns the default base URL when the env is empty', () => {
    expect(resolveOpenAIBaseUrl(undefined)).toBe('https://api.openai.com/v1')
    expect(resolveOpenAIBaseUrl('')).toBe('https://api.openai.com/v1')
  })

  it('accepts absolute http and https URLs', () => {
    expect(resolveOpenAIBaseUrl('https://example.com/v1')).toBe('https://example.com/v1')
    expect(resolveOpenAIBaseUrl('http://localhost:4000/proxy')).toBe('http://localhost:4000/proxy')
  })

  it('falls back when the env contains a relative URL like /pipeline', () => {
    expect(resolveOpenAIBaseUrl('/pipeline')).toBe('https://api.openai.com/v1')
  })

  it('strips trailing slashes from valid absolute URLs', () => {
    expect(resolveOpenAIBaseUrl('https://example.com/v1///')).toBe('https://example.com/v1')
  })
})

describe('openai client config', () => {
  it('throws an actionable error when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY
    vi.resetModules()

    const { openai } = await import('./client')

    expect(() => Reflect.get(openai, 'chat')).toThrowError(
      'Missing required environment variable OPENAI_API_KEY for OpenAI client.',
    )
  })
})
