import { NextRequest }   from 'next/server'
import Anthropic         from '@anthropic-ai/sdk'
import { z }             from 'zod'

import { buildSystemPrompt, trimMessages } from '@/lib/agent/context-builder'
import { TOOL_DEFINITIONS, dispatchTool }  from '@/lib/agent/tools'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import {
  getSession, createSession,
  getMessages, appendMessage,
  checkUserQuota,
  incrementMessageCount,
  updateSession,
} from '@/lib/db/sessions'
import { consumeCredit } from '@/lib/asaas/quota'
import { agentLimiter } from '@/lib/rate-limit'
import { AGENT_CONFIG } from '@/lib/agent/config'
import { trackApiUsage } from '@/lib/agent/usage-tracker'
import { extractUrl } from '@/lib/agent/url-extractor'
import { scrapeJobPosting } from '@/lib/agent/scraper'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'

const client = new Anthropic({
  timeout: AGENT_CONFIG.timeout,
})

async function callAnthropicWithRetry(
  params: Anthropic.MessageCreateParamsNonStreaming,
  maxRetries: number = 3,
  traceContext?: {
    sessionId?: string
    appUserId?: string
    phase?: string
    stateVersion?: number
  },
): Promise<Anthropic.Message> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params) as Anthropic.Message
    } catch (error) {
      lastError = error as Error

      // Only retry on transient errors
      const isRetryable =
        error instanceof Anthropic.APIError &&
        (error.status === 429 || error.status === 500 || error.status === 503 || error.status === 529)

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      logWarn('agent.model.retrying', {
        sessionId: traceContext?.sessionId,
        appUserId: traceContext?.appUserId,
        phase: traceContext?.phase,
        stateVersion: traceContext?.stateVersion,
        attempt,
        maxRetries,
        retryDelayMs: delay,
        success: false,
        ...serializeError(error),
      })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

const BodySchema = z.object({
  sessionId: z.string().optional(),
  message:   z.string().min(1).max(8000),
  file:      z.string().optional(),
  fileMime:  z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
  ]).optional(),
})

function sanitizeUserInput(input: string): string {
  // Remove XML tags that could interfere with prompt delimiters
  return input
    .replace(/<\/?user_resume_data>/gi, '')
    .replace(/<\/?system>/gi, '')
    .replace(/<\/?instructions>/gi, '')
    .replace(/<\/?assistant>/gi, '')
    .trim()
}

export async function POST(req: NextRequest) {
  const requestStartedAt = Date.now()

  // 1. Auth
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    logWarn('agent.request.unauthorized', {
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const appUserId = appUser.id

  // 1.5. Rate limit
  const { success } = await agentLimiter.limit(appUserId)
  if (!success) {
    logWarn('agent.request.rate_limited', {
      appUserId,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), { status: 429 })
  }

  // 2. Parse body
  const raw = BodySchema.safeParse(await req.json())
  if (!raw.success) {
    logWarn('agent.request.invalid_body', {
      appUserId,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return new Response(JSON.stringify({ error: raw.error.flatten() }), { status: 400 })
  }
  const { sessionId, file, fileMime } = raw.data
  let message = sanitizeUserInput(raw.data.message)

  logInfo('agent.request.received', {
    appUserId,
    requestedSessionId: sessionId,
    messageLength: message.length,
    hasFile: Boolean(file && fileMime),
    fileMime,
    success: true,
  })

  // 2.5. Check if user message contains a URL and scrape it
  const detectedUrl = extractUrl(message)
  if (detectedUrl) {
    const scrapeResult = await scrapeJobPosting(detectedUrl)
    const detectedUrlHost = (() => {
      try {
        return new URL(detectedUrl).hostname
      } catch {
        return 'invalid-url'
      }
    })()

    if (scrapeResult.success && scrapeResult.text) {
      // Replace or augment the message with extracted content
      message = message.replace(
        detectedUrl,
        `[Link da vaga: ${detectedUrl}]\n\n[Conteúdo extraído automaticamente]:\n${scrapeResult.text}`
      )
      logInfo('agent.scrape.completed', {
        appUserId,
        detectedUrlHost,
        scrapeSucceeded: true,
        scrapedTextLength: scrapeResult.text.length,
        success: true,
      })
    } else {
      // If scraping failed, let the AI know and ask user to paste manually
      logWarn('agent.scrape.completed', {
        appUserId,
        detectedUrlHost,
        scrapeSucceeded: false,
        success: false,
      })
      message = `${message}\n\n[Nota do sistema: Tentei acessar o link ${detectedUrl} mas não consegui extrair o conteúdo. Motivo: ${scrapeResult.error}]`
    }
  }

  // 3. Load or create session (NEW: credit consumption happens here for new sessions only)
  let session = sessionId
    ? await getSession(sessionId, appUserId)
    : null

  let isNewSession = false

  if (session) {
    logInfo('agent.session.loaded', {
      sessionId: session.id,
      appUserId,
      phase: session.phase,
      stateVersion: session.stateVersion,
      messageCount: session.messageCount,
      isNewSession: false,
      success: true,
    })

    // Existing session - check message cap
    if (session.messageCount >= AGENT_CONFIG.maxMessagesPerSession) {
      logWarn('agent.session.message_cap_reached', {
        sessionId: session.id,
        appUserId,
        phase: session.phase,
        stateVersion: session.stateVersion,
        messageCount: session.messageCount,
        maxMessages: AGENT_CONFIG.maxMessagesPerSession,
        success: false,
      })
      return new Response(JSON.stringify({
        error: 'Esta sessão atingiu o limite de 15 mensagens. Inicie uma nova análise para continuar.',
        action: 'new_session',
        messageCount: session.messageCount,
        maxMessages: AGENT_CONFIG.maxMessagesPerSession,
      }), { status: 429 })
    }
  } else {
    // Creating new session - check and consume credit NOW
    const hasCredits = await checkUserQuota(appUserId)
    if (!hasCredits) {
      logWarn('agent.session.create_blocked_no_credit', {
        appUserId,
        success: false,
        latencyMs: Date.now() - requestStartedAt,
      })
      return new Response(JSON.stringify({
        error: 'Seus créditos acabaram. Faça upgrade do seu plano para continuar.',
        upgradeUrl: '/pricing',
      }), { status: 402 })
    }

    // Consume credit IMMEDIATELY on session creation
    const creditConsumed = await consumeCredit(appUserId)
    if (!creditConsumed) {
      logError('agent.credit.consume_failed', {
        appUserId,
        creditConsumed: 0,
        success: false,
        latencyMs: Date.now() - requestStartedAt,
      })
      return new Response(JSON.stringify({
        error: 'Erro ao processar crédito. Tente novamente.',
      }), { status: 500 })
    }

    session = await createSession(appUserId)
    isNewSession = true
    logInfo('agent.session.created', {
      sessionId: session.id,
      appUserId,
      phase: session.phase,
      stateVersion: session.stateVersion,
      isNewSession: true,
      creditConsumed: 1,
      success: true,
      latencyMs: Date.now() - requestStartedAt,
    })
  }

  // 4. Increment message count for this session (atomic operation)
  const messageCountIncremented = await incrementMessageCount(session.id)
  if (!messageCountIncremented) {
    logWarn('agent.session.message_cap_reached', {
      sessionId: session.id,
      appUserId,
      phase: session.phase,
      stateVersion: session.stateVersion,
      messageCount: AGENT_CONFIG.maxMessagesPerSession,
      maxMessages: AGENT_CONFIG.maxMessagesPerSession,
      success: false,
    })
    // Session hit 15 message cap during increment (race condition prevented)
    return new Response(JSON.stringify({
      error: 'Esta sessão atingiu o limite de 15 mensagens. Inicie uma nova análise para continuar.',
      action: 'new_session',
      messageCount: AGENT_CONFIG.maxMessagesPerSession,
      maxMessages: AGENT_CONFIG.maxMessagesPerSession,
    }), { status: 429 })
  }

  // 5. Persist user message
  await appendMessage(session.id, 'user', message)

  // 6. Build context
  const history  = await getMessages(session.id)
  const messages = trimMessages(
    history.map(m => ({ role: m.role, content: m.content })),
  )

  // If file was attached, inject it into the last user message content
  const lastMsg = messages[messages.length - 1]
  if (file && fileMime && lastMsg.role === 'user') {
    // The agent will call parse_file via tool use — we just note the file is available
    lastMsg.content += `\n\n[File attached: ${fileMime}]`
    session.agentState = {
      ...session.agentState,
      parseStatus: 'attached',
      parseError: undefined,
      attachedFile: {
        mimeType: fileMime,
        receivedAt: new Date().toISOString(),
      },
    }
    await updateSession(session.id, { agentState: session.agentState })
    logInfo('agent.file.attached', {
      sessionId: session.id,
      appUserId,
      phase: session.phase,
      stateVersion: session.stateVersion,
      fileMime,
      success: true,
    })
  }

  // 7. Stream response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      try {
        let continueLoop = true
        let toolIterations = 0

        while (continueLoop) {
          toolIterations++

          if (toolIterations > AGENT_CONFIG.maxToolIterations) {
            logError('agent.tool_loop.exceeded', {
              sessionId: session!.id,
              appUserId,
              phase: session!.phase,
              stateVersion: session!.stateVersion,
              toolIterations,
              maxToolIterations: AGENT_CONFIG.maxToolIterations,
              success: false,
            })
            break
          }

          // TODO: Implement true streaming
          // Current approach: stream: false, then word-chunk to client
          // Problem: Slower than true streaming, but required for tool use loop
          // Solution: Refactor to use SDK's streaming API with tool use handling
          // See: https://docs.anthropic.com/en/api/messages-streaming
          // Complexity: Need to buffer tool_use blocks, execute tools, then continue stream
          const response = await callAnthropicWithRetry({
            model:      AGENT_CONFIG.model,
            max_tokens: AGENT_CONFIG.maxTokens,
            system:     buildSystemPrompt(session!),
            tools:      TOOL_DEFINITIONS,
            messages:   messages as Anthropic.MessageParam[],
            stream:     false,
          }, 3, {
            sessionId: session!.id,
            appUserId,
            phase: session!.phase,
            stateVersion: session!.stateVersion,
          })

          // Track API usage (non-blocking)
          trackApiUsage({
            userId: appUserId,
            sessionId: session!.id,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            endpoint: 'agent',
          }).catch(() => {}) // silently ignore tracking errors

          let assistantText = ''

          for (const block of response.content) {
            if (block.type === 'text') {
              assistantText += block.text
              // Stream text char by char would be too granular — stream in word chunks
              for (const word of block.text.split(' ')) {
                send({ delta: word + ' ' })
              }
            }

            if (block.type === 'tool_use') {
              const toolResult = await dispatchTool(
                block.name,
                block.input as Record<string, unknown>,
                session!,
              )

              // Append assistant turn + tool result to messages for the next loop
              messages.push({ role: 'assistant', content: JSON.stringify(response.content) })
              messages.push({
                role: 'user',
                content: JSON.stringify([{
                  type:        'tool_result',
                  tool_use_id: block.id,
                  content:     toolResult,
                }]),
              })
            }
          }

          if (assistantText) {
            await appendMessage(session!.id, 'assistant', assistantText)
          }

          // Stop looping when the model stops using tools
          continueLoop = response.stop_reason === 'tool_use'
        }

        // Credit already consumed on session creation - no per-message consumption
        send({
          done: true,
          sessionId: session!.id,
          phase: session!.phase,
          atsScore: session!.atsScore,
          messageCount: session!.messageCount + 1,
          maxMessages: AGENT_CONFIG.maxMessagesPerSession,
          isNewSession,
        })
        logInfo('agent.request.completed', {
          sessionId: session!.id,
          appUserId,
          phase: session!.phase,
          stateVersion: session!.stateVersion,
          isNewSession,
          messageCount: session!.messageCount + 1,
          toolIterations,
          parseConfidenceScore: session!.agentState.parseConfidenceScore,
          success: true,
          latencyMs: Date.now() - requestStartedAt,
        })
      } catch (err) {
        logError('agent.request.failed', {
          sessionId: session?.id,
          appUserId,
          phase: session?.phase,
          stateVersion: session?.stateVersion,
          parseConfidenceScore: session?.agentState.parseConfidenceScore,
          success: false,
          latencyMs: Date.now() - requestStartedAt,
          ...serializeError(err),
        })

        // Provide specific error messages in Portuguese
        let errorMessage = 'Algo deu errado. Por favor, tente novamente.'

        if (err instanceof Anthropic.APIError && err.status) {
          const statusMessages: Record<number, string> = {
            400: 'Erro na requisição. Por favor, tente novamente.',
            401: 'Erro de configuração da IA. Entre em contato com o suporte.',
            403: 'Acesso negado ao serviço de IA. Entre em contato com o suporte.',
            429: 'O serviço de IA está sobrecarregado. Tente novamente em alguns segundos.',
            500: 'O serviço de IA está temporariamente indisponível. Tente novamente.',
            503: 'O serviço de IA está em manutenção. Tente novamente em alguns minutos.',
            529: 'O serviço de IA está sobrecarregado. Tente novamente em alguns minutos.',
          }
          errorMessage = statusMessages[err.status] ?? errorMessage
        } else if (err instanceof Error && err.name === 'AbortError') {
          errorMessage = 'A requisição demorou muito. Por favor, tente novamente.'
        }

        send({ error: errorMessage })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
