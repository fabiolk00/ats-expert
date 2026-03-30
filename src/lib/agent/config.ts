export const AGENT_CONFIG = {
  maxTokens: 2000,
  rewriterMaxTokens: 1200,
  ocrMaxTokens: 2000,
  timeout: 30_000,
  maxToolIterations: 10,
  rateLimitPerMinute: 30,
  maxHistoryMessages: 12,
  maxMessagesPerSession: 15,
} as const

export const MODEL_CONFIG = {
  agent: 'gpt-5.4-mini',
  structured: 'gpt-5-mini',
  vision: 'gpt-5-mini',
} as const

export type AgentConfig = typeof AGENT_CONFIG
export type ModelConfig = typeof MODEL_CONFIG
