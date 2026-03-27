import { createClient } from '@supabase/supabase-js'
import { AGENT_CONFIG } from '@/lib/agent/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Approximate costs per million tokens (check Anthropic pricing page for current rates)
// Claude Sonnet 4.5 pricing as of 2025
const COST_PER_MILLION_INPUT = 300  // $3.00 per 1M input tokens
const COST_PER_MILLION_OUTPUT = 1500 // $15.00 per 1M output tokens

export async function trackApiUsage(params: {
  userId: string
  sessionId?: string
  inputTokens: number
  outputTokens: number
  endpoint: 'agent' | 'rewriter' | 'ocr'
}): Promise<void> {
  const totalTokens = params.inputTokens + params.outputTokens
  const costCents = Math.ceil(
    (params.inputTokens / 1_000_000) * COST_PER_MILLION_INPUT +
    (params.outputTokens / 1_000_000) * COST_PER_MILLION_OUTPUT
  )

  try {
    await supabase.from('api_usage').insert({
      user_id: params.userId,
      session_id: params.sessionId ?? null,
      model: AGENT_CONFIG.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      total_tokens: totalTokens,
      cost_cents: costCents,
      endpoint: params.endpoint,
    })
  } catch (error) {
    // Never fail the request because of tracking errors
    console.error('[usage-tracker] Failed to track usage:', error)
  }
}
