import type OpenAI from 'openai'

import { AGENT_CONFIG, resolveAgentModelForPhase } from '@/lib/agent/config'
import { createChatCompletionStreamWithRetry } from '@/lib/openai/chat'
import { openai } from '@/lib/openai/client'
import { logInfo } from '@/lib/observability/structured-log'
import type { StreamTurnResult } from '@/lib/agent/agent-recovery'
import type { AgentTextChunk, Session } from '@/types/agent'

type AccumulatedToolCall = {
  id: string
  name: string
  argumentsRaw: string
}

export type StreamAssistantTurnParams = {
  session: Session
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  cachedSystemPrompt: string
  requestId: string
  appUserId: string
  requestStartedAt: number
  signal?: AbortSignal
  maxCompletionTokens: number
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
  toolChoice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption
}

function toUsage(
  usage: OpenAI.CompletionUsage | null | undefined,
): StreamTurnResult['usage'] | undefined {
  if (!usage) {
    return undefined
  }

  return {
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
  }
}

export async function* streamAssistantTurn(
  params: StreamAssistantTurnParams,
): AsyncGenerator<AgentTextChunk, StreamTurnResult> {
  const streamStartedAt = Date.now()
  const selectedModel = resolveAgentModelForPhase(params.session.phase)

  const requestParams: Parameters<typeof createChatCompletionStreamWithRetry>[1] = {
    model: selectedModel,
    max_completion_tokens: params.maxCompletionTokens,
    messages: [
      { role: 'system', content: params.cachedSystemPrompt },
      ...params.messages,
    ],
    stream: true,
    stream_options: { include_usage: true },
  }

  if (params.tools && params.tools.length > 0) {
    requestParams.tools = params.tools
    if (params.toolChoice) {
      requestParams.tool_choice = params.toolChoice
    }
  }

  const stream = await createChatCompletionStreamWithRetry(
    openai,
    requestParams,
    3,
    AGENT_CONFIG.timeout,
    params.signal,
    {
      operation: 'agent_stream',
      stage: params.session.phase,
      model: selectedModel,
      sessionId: params.session.id,
      userId: params.appUserId,
      workflowMode: params.session.agentState.workflowMode,
    },
  )

  const toolCalls: AccumulatedToolCall[] = []
  let assistantText = ''
  let finishReason: StreamTurnResult['finishReason'] = null
  let usage: StreamTurnResult['usage']
  let loggedFirstToken = false

  for await (const chunk of stream) {
    if (params.signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    if (chunk.usage) {
      usage = toUsage(chunk.usage)
    }

    const choice = chunk.choices[0]
    if (!choice) {
      continue
    }

    const { delta } = choice
    if (choice.finish_reason) {
      finishReason = choice.finish_reason
    }

    if (delta.content) {
      assistantText += delta.content

      if (!loggedFirstToken) {
        loggedFirstToken = true
        logInfo('agent.stream.first_token', {
          requestId: params.requestId,
          sessionId: params.session.id,
          appUserId: params.appUserId,
          phase: params.session.phase,
          stateVersion: params.session.stateVersion,
          setupMs: streamStartedAt - params.requestStartedAt,
          firstTokenMs: Date.now() - streamStartedAt,
          totalLatencyMs: Date.now() - params.requestStartedAt,
          success: true,
        })
      }

      yield {
        type: 'text',
        content: delta.content,
      }
    }

    if (!delta.tool_calls) {
      continue
    }

    for (const toolCallDelta of delta.tool_calls) {
      const index = toolCallDelta.index ?? 0

      if (!toolCalls[index]) {
        toolCalls[index] = {
          id: toolCallDelta.id ?? '',
          name: toolCallDelta.function?.name ?? '',
          argumentsRaw: '',
        }
      }

      if (toolCallDelta.id) {
        toolCalls[index].id = toolCallDelta.id
      }

      if (toolCallDelta.function?.name) {
        toolCalls[index].name = toolCallDelta.function.name
      }

      if (toolCallDelta.function?.arguments) {
        toolCalls[index].argumentsRaw += toolCallDelta.function.arguments
      }
    }
  }

  return {
    assistantText,
    toolCalls: toolCalls.filter(Boolean),
    finishReason,
    model: selectedModel,
    usage,
  }
}
