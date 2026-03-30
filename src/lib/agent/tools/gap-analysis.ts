import Anthropic from '@anthropic-ai/sdk'

import { AGENT_CONFIG } from '@/lib/agent/config'
import { TOOL_ERROR_CODES, toolFailure, toolFailureFromUnknown } from '@/lib/agent/tool-errors'
import { trackApiUsage } from '@/lib/agent/usage-tracker'
import { GapAnalysisResultSchema } from '@/lib/cv/schema'
import type { AnalyzeGapOutput } from '@/types/agent'
import type { CVState, GapAnalysisResult } from '@/types/cv'

type GapAnalysisExecutionResult = {
  output: AnalyzeGapOutput
  result?: GapAnalysisResult
}

async function callAnthropicWithRetry(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  maxRetries: number = 3,
): Promise<Anthropic.Message> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params) as Anthropic.Message
    } catch (error) {
      lastError = error as Error

      const isRetryable =
        error instanceof Anthropic.APIError &&
        (error.status === 429 || error.status === 500 || error.status === 503 || error.status === 529)

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

function parseGapAnalysis(rawText: string): GapAnalysisResult | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawText)
  } catch {
    return null
  }

  const result = GapAnalysisResultSchema.safeParse(parsed)
  return result.success ? result.data : null
}

export async function analyzeGap(
  cvState: CVState,
  targetJobDescription: string,
  userId: string,
  sessionId: string,
): Promise<GapAnalysisExecutionResult> {
  try {
    const client = new Anthropic({
      timeout: AGENT_CONFIG.timeout,
    })

    const response = await callAnthropicWithRetry(client, {
      model: AGENT_CONFIG.model,
      max_tokens: AGENT_CONFIG.rewriterMaxTokens,
      system: `Compare the provided canonical resume JSON against the target job description.
Output ONLY valid JSON matching this exact shape:
{
  "matchScore": number,
  "missingSkills": string[],
  "weakAreas": string[],
  "improvementSuggestions": string[]
}
Rules:
- matchScore must be between 0 and 100
- missingSkills must contain concrete missing or underrepresented skills
- weakAreas must describe resume sections or competency gaps, not raw prose
- improvementSuggestions must be concise, actionable resume improvements
- do not include markdown or explanation outside the JSON object`,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          cvState,
          targetJobDescription,
        }),
      }],
    })

    trackApiUsage({
      userId,
      sessionId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      endpoint: 'gap_analysis',
    }).catch(() => {})

    const responseText = response.content.find((block: Anthropic.ContentBlock) => block.type === 'text' && 'text' in block)?.text ?? '{}'
    const result = parseGapAnalysis(responseText)

    if (!result) {
      return {
        output: toolFailure(TOOL_ERROR_CODES.LLM_INVALID_OUTPUT, 'Invalid gap analysis payload.'),
      }
    }

    return {
      output: {
        success: true,
        result,
      },
      result,
    }
  } catch (error) {
    return {
      output: toolFailureFromUnknown(error, 'Failed to analyze resume gap.'),
    }
  }
}

export {
  parseGapAnalysis,
}
