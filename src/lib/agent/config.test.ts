import { describe, it, expect } from 'vitest'
import { AGENT_CONFIG } from './config'

describe('AGENT_CONFIG', () => {
  it('uses claude-haiku-4-5-20251001 model', () => {
    expect(AGENT_CONFIG.model).toBe('claude-haiku-4-5-20251001')
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
