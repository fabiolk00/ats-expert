import type { ParseFileInput, ParseFileOutput } from '@/types/agent'
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

export async function parseFile(
  input: ParseFileInput,
  userId?: string,
  sessionId?: string
): Promise<ParseFileOutput> {
  try {
    const buffer = Buffer.from(input.file_base64, 'base64')

    if (input.mime_type === 'application/pdf') {
      return await parsePDF(buffer)
    }

    if (input.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await parseDOCX(buffer)
    }

    if (input.mime_type.startsWith('image/')) {
      return await parseImageOCR(buffer, input.mime_type, userId, sessionId)
    }

    return { success: false, error: `Unsupported mime type: ${input.mime_type}` }
  } catch (err) {
    console.error('[parseFile]', err)
    return { success: false, error: 'Failed to extract text from file.' }
  }
}

async function parsePDF(buffer: Buffer): Promise<ParseFileOutput> {
  const pdfParse = (await import('pdf-parse')).default
  const data     = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 100) {
    return { success: false, error: 'PDF_SCANNED — very little text extracted. The file may be image-based. Try uploading a DOCX or use our image upload option.' }
  }

  return { success: true, text: data.text.trim(), pageCount: data.numpages }
}

async function parseDOCX(buffer: Buffer): Promise<ParseFileOutput> {
  const mammoth = await import('mammoth')
  const result  = await mammoth.extractRawText({ buffer })

  if (!result.value || result.value.trim().length < 100) {
    return { success: false, error: 'Could not extract text from DOCX file.' }
  }

  return { success: true, text: result.value.trim(), pageCount: 1 }
}

async function parseImageOCR(
  buffer: Buffer,
  mime: string,
  userId?: string,
  sessionId?: string
): Promise<ParseFileOutput> {
  // Use Claude's vision capability for OCR on resume images
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client    = new Anthropic({
    timeout: AGENT_CONFIG.timeout,
  })

  const mediaType = mime as 'image/png' | 'image/jpeg'

  const response = await callAnthropicWithRetry(client, {
    model: AGENT_CONFIG.model,
    max_tokens: AGENT_CONFIG.ocrMaxTokens,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') },
        },
        {
          type: 'text',
          text: 'Extract all text from this resume image. Output only the raw text, preserving the logical reading order. No commentary.',
        },
      ],
    }],
  })

  // Track API usage (non-blocking)
  if (userId) {
    trackApiUsage({
      userId,
      sessionId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      endpoint: 'ocr',
    }).catch(() => {})
  }

  const text = response.content.find((b: Anthropic.ContentBlock) => b.type === 'text' && 'text' in b)?.text ?? ''

  if (text.length < 100) {
    return { success: false, error: 'Could not read text from image.' }
  }

  return { success: true, text: text.trim(), pageCount: 1 }
}
