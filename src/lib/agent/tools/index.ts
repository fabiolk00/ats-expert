import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import type { Session } from '@/types/agent'
import { parseFile }    from './parse-file'
import { generateFile } from './generate-file'
import { scoreATS }     from '@/lib/ats/score'
import { updateSession } from '@/lib/db/sessions'
import { AGENT_CONFIG } from '@/lib/agent/config'
import { trackApiUsage } from '@/lib/agent/usage-tracker'
import type Anthropic from '@anthropic-ai/sdk'

async function callAnthropicWithRetry(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  maxRetries: number = 3
): Promise<Anthropic.Message> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params) as Anthropic.Message
    } catch (error) {
      lastError = error as Error

      const AnthropicSDK = (await import('@anthropic-ai/sdk')).default
      // Only retry on transient errors
      const isRetryable =
        error instanceof AnthropicSDK.APIError &&
        (error.status === 429 || error.status === 500 || error.status === 503 || error.status === 529)

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'parse_file',
    description: 'Extract text from an uploaded resume file (PDF, DOCX, or image).',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_base64: { type: 'string', description: 'Base64-encoded file content' },
        mime_type: {
          type: 'string',
          enum: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
          ],
        },
      },
      required: ['file_base64', 'mime_type'],
    },
  },
  {
    name: 'score_ats',
    description: 'Score a resume for ATS compatibility and return section-level feedback.',
    input_schema: {
      type: 'object' as const,
      properties: {
        resume_text:      { type: 'string' },
        job_description:  { type: 'string', description: 'Optional — improves keyword analysis' },
      },
      required: ['resume_text'],
    },
  },
  {
    name: 'rewrite_section',
    description: 'Rewrite a specific resume section to improve ATS score and impact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        section:          { type: 'string', enum: ['summary', 'experience', 'skills', 'education', 'certifications'] },
        current_content:  { type: 'string' },
        instructions:     { type: 'string' },
        target_keywords:  { type: 'array', items: { type: 'string' } },
      },
      required: ['section', 'current_content', 'instructions'],
    },
  },
  {
    name: 'set_phase',
    description: 'Advance the conversation to the next phase of the agent.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phase:  { type: 'string', enum: ['intake', 'analysis', 'dialog', 'confirm', 'generation'] },
        reason: { type: 'string' },
      },
      required: ['phase'],
    },
  },
  {
    name: 'generate_file',
    description: 'Generate the final ATS-optimized DOCX and PDF files for download.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cv_state: { type: 'object', description: 'Final structured resume data' },
      },
      required: ['cv_state'],
    },
  },
]

export async function dispatchTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  session: Session,
): Promise<string> {
  try {
    switch (toolName) {
      case 'parse_file': {
        const result = await parseFile(
          toolInput as Parameters<typeof parseFile>[0],
          session.userId,
          session.id
        )
        if (result.success) {
          // Store only the extracted text, not the base64 file data
          session.cvState.rawText = result.text
          await updateSession(session.id, { cvState: session.cvState })
        }
        return JSON.stringify(result)
      }

      case 'score_ats': {
        const { resume_text, job_description } = toolInput as { resume_text: string; job_description?: string }
        const result = scoreATS(resume_text, job_description)
        session.atsScore = result
        if (job_description) session.cvState.targetJobDescription = job_description
        await updateSession(session.id, { atsScore: result, cvState: session.cvState })
        return JSON.stringify({ success: true, result })
      }

      case 'rewrite_section': {
        // Delegate to section-rewriter subagent
        const result = await callSectionRewriter(
          toolInput as Parameters<typeof callSectionRewriter>[0],
          session.userId,
          session.id
        )
        return JSON.stringify(result)
      }

      case 'set_phase': {
        const { phase } = toolInput as { phase: Session['phase'] }
        session.phase = phase
        await updateSession(session.id, { phase })
        return JSON.stringify({ success: true, phase })
      }

      case 'generate_file': {
        const result = await generateFile(
          toolInput as Parameters<typeof generateFile>[0],
          session.userId,
          session.id,
        )
        return JSON.stringify(result)
      }

      default:
        return JSON.stringify({ success: false, error: `Unknown tool: ${toolName}` })
    }
  } catch (err) {
    console.error(`[dispatchTool:${toolName}]`, err)
    return JSON.stringify({ success: false, error: 'Tool execution failed.' })
  }
}

async function callSectionRewriter(
  input: {
    section: string
    current_content: string
    instructions: string
    target_keywords?: string[]
  },
  userId: string,
  sessionId: string
): Promise<unknown> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client    = new Anthropic({
    timeout: AGENT_CONFIG.timeout,
  })

  const response = await callAnthropicWithRetry(client, {
    model: AGENT_CONFIG.model,
    max_tokens: AGENT_CONFIG.rewriterMaxTokens,
    system: `You are an expert ATS resume writer. Rewrite the provided resume section following the instructions.
Output ONLY valid JSON matching this shape exactly:
{
  "rewritten_content": string,
  "keywords_added": string[],
  "changes_made": string[]
}
No markdown, no preamble, no explanation — just the JSON object.`,
    messages: [{
      role: 'user',
      content: JSON.stringify(input),
    }],
  })

  // Track API usage (non-blocking)
  trackApiUsage({
    userId,
    sessionId,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    endpoint: 'rewriter',
  }).catch(() => {})

  const text = response.content.find((b: Anthropic.ContentBlock) => b.type === 'text' && 'text' in b)?.text ?? '{}'
  try {
    return { success: true, ...JSON.parse(text) }
  } catch {
    return { success: false, error: 'Section rewriter returned invalid JSON.' }
  }
}
