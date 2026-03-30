import { describe, expect, it } from 'vitest'

import { AGENT_CONFIG, MODEL_CONFIG } from './config'

describe('AGENT_CONFIG', () => {
  it('uses OpenAI model routing', () => {
    expect(MODEL_CONFIG).toEqual({
      agent: 'gpt-5.4-mini',
      structured: 'gpt-5-mini',
      vision: 'gpt-5-mini',
    })
  })

  it('has maxMessagesPerSession set to 15', () => {
    expect(AGENT_CONFIG.maxMessagesPerSession).toBe(15)
  })

  it('has maxToolIterations to prevent infinite loops', () => {
    expect(AGENT_CONFIG.maxToolIterations).toBe(10)
  })

  it('has reasonable timeout (30 seconds)', () => {
    expect(AGENT_CONFIG.timeout).toBe(30_000)
  })

  it('keeps max 12 messages in history', () => {
    expect(AGENT_CONFIG.maxHistoryMessages).toBe(12)
  })
})
