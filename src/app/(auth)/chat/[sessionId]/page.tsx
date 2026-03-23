'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import ChatTopBar from '@/components/chat/chat-top-bar'
import ChatMessages from '@/components/chat/chat-messages'
import ChatInput from '@/components/chat/chat-input'
import type { Phase } from '@/types/agent'

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [phase, setPhase] = useState<Phase>('intake')
  const [atsScore, setAtsScore] = useState<number | undefined>()
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing messages on mount
  useEffect(() => {
    fetch(`/api/session/${sessionId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m: { role: string; content: string; createdAt: string }, i: number) => ({
            id: String(i),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          })))
        } else {
          // First time — show welcome message
          setMessages([{
            id: '0',
            role: 'assistant',
            content: 'Olá! Sou a CurrIA, sua assistente de otimização de currículos. Envie seu currículo em PDF ou DOCX, ou cole o texto diretamente aqui para começarmos a análise.',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          }])
        }
      })
  }, [sessionId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (message: string, file?: File) => {
    if (isStreaming) return

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    // Convert file to base64 if present
    let fileBase64: string | undefined
    let fileMime: string | undefined
    if (file) {
      fileBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })
      fileMime = file.type
    }

    // Call /api/agent and stream the response
    const agentMsgId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: agentMsgId, role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }])

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, file: fileBase64, fileMime }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const chunk = JSON.parse(line.slice(6))
            if (chunk.delta) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: m.content + chunk.delta } : m
              ))
            }
            if (chunk.done) {
              setPhase(chunk.phase)
              if (chunk.atsScore?.total) setAtsScore(chunk.atsScore.total)
            }
            if (chunk.error) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: 'Erro: ' + chunk.error } : m
              ))
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatTopBar phase={phase} atsScore={atsScore} />
      <ChatMessages messages={messages} isTyping={isStreaming} />
      <div ref={bottomRef} />
      <ChatInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  )
}
