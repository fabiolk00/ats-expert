import { auth }          from '@clerk/nextjs/server'
import { NextRequest }   from 'next/server'
import Anthropic         from '@anthropic-ai/sdk'
import { z }             from 'zod'

import { buildSystemPrompt, trimMessages } from '@/lib/agent/context-builder'
import { TOOL_DEFINITIONS, dispatchTool }  from '@/lib/agent/tools'
import {
  getSession, createSession,
  getMessages, appendMessage,
  checkUserQuota,
} from '@/lib/db/sessions'
import { agentLimiter } from '@/lib/rate-limit'

const client = new Anthropic()

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

export async function POST(req: NextRequest) {
  // 1. Auth
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 1.5. Rate limit
  const { success } = await agentLimiter.limit(userId)
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), { status: 429 })
  }

  // 2. Parse body
  const raw = BodySchema.safeParse(await req.json())
  if (!raw.success) {
    return new Response(JSON.stringify({ error: raw.error.flatten() }), { status: 400 })
  }
  const { sessionId, message, file, fileMime } = raw.data

  // 3. Quota check
  const allowed = await checkUserQuota(userId)
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Quota exceeded. Please upgrade your plan.' }), { status: 402 })
  }

  // 4. Load or create session
  let session = sessionId
    ? await getSession(sessionId, userId)
    : null

  if (!session) {
    session = await createSession(userId)
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
    // Pass base64 via a hidden system note so the tool can retrieve it
    session.cvState.rawText = `__FILE__:${file}:${fileMime}`
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

        while (continueLoop) {
          const response = await client.messages.create({
            model:      'claude-sonnet-4-5',
            max_tokens: 1500,
            system:     buildSystemPrompt(session!),
            tools:      TOOL_DEFINITIONS,
            messages:   messages as Anthropic.MessageParam[],
            stream:     false,
          })

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

        send({ done: true, sessionId: session!.id, phase: session!.phase, atsScore: session!.atsScore })
      } catch (err) {
        console.error('[api/agent]', err)
        send({ error: 'Something went wrong. Please try again.' })
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
