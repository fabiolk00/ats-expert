import Anthropic from '@anthropic-ai/sdk'

import { AGENT_CONFIG } from '@/lib/agent/config'
import { TOOL_ERROR_CODES, toolFailure, toolFailureFromUnknown } from '@/lib/agent/tool-errors'
import { analyzeGap } from '@/lib/agent/tools/gap-analysis'
import { trackApiUsage } from '@/lib/agent/usage-tracker'
import { CVStateSchema } from '@/lib/cv/schema'
import { createResumeTarget } from '@/lib/db/resume-targets'
import type { ResumeTarget, ToolFailure } from '@/types/agent'
import type { CVState, GapAnalysisResult } from '@/types/cv'

type CreateTargetResumeResult =
  | {
      success: true
      target: ResumeTarget
      gapAnalysis?: GapAnalysisResult
    }
  | ToolFailure

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

function parseDerivedCvState(rawText: string): CVState | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawText)
  } catch {
    return null
  }

  const result = CVStateSchema.safeParse(parsed)
  return result.success ? result.data : null
}

export async function createTargetResumeVariant(input: {
  sessionId: string
  userId: string
  baseCvState: CVState
  targetJobDescription: string
}): Promise<CreateTargetResumeResult> {
  try {
    const gapAnalysisExecution = await analyzeGap(
      input.baseCvState,
      input.targetJobDescription,
      input.userId,
      input.sessionId,
    )

    if (!gapAnalysisExecution.result) {
      return gapAnalysisExecution.output.success
        ? toolFailure(TOOL_ERROR_CODES.INTERNAL_ERROR, 'Gap analysis did not return a validated result.')
        : gapAnalysisExecution.output
    }

    const client = new Anthropic({
      timeout: AGENT_CONFIG.timeout,
    })

    const response = await callAnthropicWithRetry(client, {
      model: AGENT_CONFIG.model,
      max_tokens: AGENT_CONFIG.rewriterMaxTokens,
      system: `Create a target-specific resume variant from the canonical base resume.
Output ONLY valid JSON matching this exact CV state shape:
{
  "fullName": string,
  "email": string,
  "phone": string,
  "linkedin"?: string,
  "location"?: string,
  "summary": string,
  "experience": Array<{
    "title": string,
    "company": string,
    "location"?: string,
    "startDate": string,
    "endDate": string | "present",
    "bullets": string[]
  }>,
  "skills": string[],
  "education": Array<{
    "degree": string,
    "institution": string,
    "year": string,
    "gpa"?: string
  }>,
  "certifications"?: Array<{
    "name": string,
    "issuer": string,
    "year"?: string
  }>
}
Rules:
- preserve factual accuracy from the base resume
- optimize emphasis, ordering, and wording for the target job description
- do not invent companies, dates, degrees, certifications, or metrics
- keep the output fully structured and valid JSON only`,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          baseCvState: input.baseCvState,
          targetJobDescription: input.targetJobDescription,
          gapAnalysis: gapAnalysisExecution.result,
        }),
      }],
    })

    trackApiUsage({
      userId: input.userId,
      sessionId: input.sessionId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      endpoint: 'target_resume',
    }).catch(() => {})

    const responseText = response.content.find((block: Anthropic.ContentBlock) => block.type === 'text' && 'text' in block)?.text ?? '{}'
    const derivedCvState = parseDerivedCvState(responseText)

    if (!derivedCvState) {
      return toolFailure(TOOL_ERROR_CODES.LLM_INVALID_OUTPUT, 'Invalid target resume payload.')
    }

    const target = await createResumeTarget({
      sessionId: input.sessionId,
      userId: input.userId,
      targetJobDescription: input.targetJobDescription,
      derivedCvState,
      gapAnalysis: gapAnalysisExecution.result,
    })

    return {
      success: true,
      target,
      gapAnalysis: gapAnalysisExecution.result,
    }
  } catch (error) {
    return toolFailureFromUnknown(error, 'Failed to create target resume.')
  }
}

export {
  parseDerivedCvState,
}
