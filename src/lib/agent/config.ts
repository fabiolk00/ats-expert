export const AGENT_CONFIG = {
  /** Anthropic model identifier — single place to change */
  model: 'claude-haiku-4-5-20251001' as const,

  /** Max tokens for main agent responses */
  maxTokens: 2000,

  /** Max tokens for section rewriter subagent */
  rewriterMaxTokens: 1200,

  /** Max tokens for image OCR */
  ocrMaxTokens: 2000,

  /** API call timeout in milliseconds (30 seconds) */
  timeout: 30_000,

  /** Maximum tool use loop iterations before force-stopping */
  maxToolIterations: 10,

  /** Rate limit: requests per minute per user */
  rateLimitPerMinute: 30,

  /** Message history: max messages kept in context */
  maxHistoryMessages: 12,

  /** Maximum messages per session before requiring new session (credit model) */
  maxMessagesPerSession: 15,
} as const

export type AgentConfig = typeof AGENT_CONFIG
