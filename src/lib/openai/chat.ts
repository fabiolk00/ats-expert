import OpenAI, { APIError } from 'openai'

export const OPENAI_RETRYABLE_STATUS_CODES = [429, 500, 502, 503] as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function callOpenAIWithRetry(
  fn: () => Promise<OpenAI.Chat.Completions.ChatCompletion>,
  maxRetries = 3,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      const isRetryable =
        error instanceof APIError &&
        OPENAI_RETRYABLE_STATUS_CODES.includes(error.status as (typeof OPENAI_RETRYABLE_STATUS_CODES)[number])

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = Math.pow(2, attempt - 1) * 1000
      await sleep(delay)
    }
  }

  throw lastError
}

export function getChatCompletionText(response: OpenAI.Chat.Completions.ChatCompletion): string {
  return response.choices[0]?.message?.content ?? ''
}

export function getChatCompletionUsage(response: OpenAI.Chat.Completions.ChatCompletion): {
  inputTokens: number
  outputTokens: number
} {
  return {
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }
}
