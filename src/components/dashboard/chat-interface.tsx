"use client"

import { useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Activity, FileText, Send, Sparkles, Upload, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AgentStreamChunk, Phase } from "@/types/agent"

import { ChatMessage } from "./chat-message"

type AgentDoneChunk = Extract<AgentStreamChunk, { done: true }>

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  analysisResult?: {
    scoreBefore: number
    scoreAfter: number
    matchedKeywords: string[]
    missingKeywords: string[]
    suggestions: string[]
  }
}

function createWelcomeMessage(firstName?: string): Message {
  const greeting = firstName ? `Ola, ${firstName}!` : "Ola!"

  return {
    id: "welcome",
    role: "assistant",
    content: `${greeting} Sou seu consultor especialista em ATS e RH.

Envie seu curriculo em PDF ou DOCX e cole a descricao da vaga para eu iniciar a analise.

Depois disso, vamos melhorar o curriculo, criar variacoes por vaga e gerar os arquivos finais.`,
    timestamp: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

interface ChatInterfaceProps {
  sessionId?: string
  userName?: string
  disabled?: boolean
  onSessionChange?: (sessionId: string) => void
  onStreamingChange?: (isStreaming: boolean) => void
  onAgentTurnCompleted?: (payload: AgentDoneChunk) => void
}

export function ChatInterface({
  sessionId: initialSessionId,
  userName = "Voce",
  disabled = false,
  onSessionChange,
  onStreamingChange,
  onAgentTurnCompleted,
}: ChatInterfaceProps) {
  const { user } = useUser()
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [messages, setMessages] = useState<Message[]>([
    createWelcomeMessage(user?.firstName ?? undefined),
  ])
  const [input, setInput] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [phase, setPhase] = useState<Phase>("intake")
  const [atsScore, setAtsScore] = useState<number | undefined>()
  const [messageCount, setMessageCount] = useState(0)
  const [maxMessages] = useState(15)
  const [sessionLimitReached, setSessionLimitReached] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isInputDisabled = disabled || isStreaming || sessionLimitReached

  useEffect(() => {
    setSessionId(initialSessionId)
  }, [initialSessionId])

  useEffect(() => {
    onStreamingChange?.(isStreaming)
  }, [isStreaming, onStreamingChange])

  useEffect(() => {
    const welcomeMessage = createWelcomeMessage(user?.firstName ?? undefined)

    if (!sessionId) {
      setMessages([welcomeMessage])
      return
    }

    let cancelled = false

    fetch(`/api/session/${sessionId}/messages`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) {
          return
        }

        if (data.messages?.length) {
          setMessages(
            data.messages.map(
              (
                message: { role: string; content: string; createdAt: string },
                index: number,
              ) => ({
                id: String(index),
                role: message.role as "user" | "assistant",
                content: message.content,
                timestamp: new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }),
            ),
          )
          return
        }

        setMessages([welcomeMessage])
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([welcomeMessage])
        }
      })

    return () => {
      cancelled = true
    }
  }, [sessionId, user?.firstName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (): Promise<void> => {
    if ((!input.trim() && !uploadedFile) || isInputDisabled) {
      return
    }

    const messageToSend = input
    const fileToSend = uploadedFile

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: fileToSend ? `${messageToSend}\n\nAnexo: ${fileToSend.name}` : messageToSend,
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages((previous) => [...previous, userMessage])
    setInput("")
    setUploadedFile(null)
    setIsStreaming(true)

    let fileBase64: string | undefined
    let fileMime: string | undefined

    if (fileToSend) {
      fileBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : ""
          resolve(result.split(",")[1] ?? "")
        }
        reader.readAsDataURL(fileToSend)
      })
      fileMime = fileToSend.type
    }

    const assistantMessageId = `${Date.now() + 1}`
    setMessages((previous) => [
      ...previous,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ])

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: messageToSend,
          file: fileBase64,
          fileMime,
        }),
      })

      if (!response.ok || !response.body) {
        const errorPayload = await response.json().catch(() => null) as
          | { error?: string }
          | null
        throw new Error(errorPayload?.error ?? "Nao foi possivel continuar a conversa.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue
          }

          try {
            const chunk = JSON.parse(line.slice(6)) as AgentStreamChunk

            if ("delta" in chunk) {
              setMessages((previous) =>
                previous.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: message.content + chunk.delta }
                    : message,
                ),
              )
              continue
            }

            if ("done" in chunk && chunk.done) {
              setPhase(chunk.phase)
              if (chunk.atsScore?.total !== undefined) {
                setAtsScore(chunk.atsScore.total)
              }
              if (chunk.messageCount !== undefined) {
                setMessageCount(chunk.messageCount)
              }
              if (chunk.sessionId) {
                setSessionId(chunk.sessionId)
                onSessionChange?.(chunk.sessionId)
              }
              onAgentTurnCompleted?.(chunk)
              continue
            }

            if ("error" in chunk) {
              if (chunk.action === "new_session") {
                setSessionLimitReached(true)
              }

              setMessages((previous) =>
                previous.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: `Aviso: ${chunk.error}` }
                    : message,
                ),
              )
            }
          } catch {
            continue
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado."
      setMessages((previous) =>
        previous.map((item) =>
          item.id === assistantMessageId
            ? { ...item, content: `Aviso: ${message}` }
            : item,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(false)

    if (disabled) {
      return
    }

    const file = event.dataTransfer.files[0]
    if (file && (file.type === "application/pdf" || file.name.endsWith(".docx"))) {
      setUploadedFile(file)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,oklch(var(--primary)/0.06),transparent_32%),linear-gradient(180deg,oklch(var(--background))_0%,oklch(var(--muted)/0.25)_100%)]">
      <div className="border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            >
              Workspace AI
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Ola, {userName}!
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                Cole a descricao da vaga, envie seu curriculo e acompanhe a analise em tempo real sem sair do workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[22rem]">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Mensagens
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {messageCount > 0 ? `${messageCount}/${maxMessages}` : `0/${maxMessages}`}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Fase</p>
              <p className="mt-1 text-lg font-semibold capitalize text-foreground">{phase}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">ATS</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{atsScore ?? "--"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 pt-4 md:px-6">
        <div
          className={cn(
            "mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-border/70 bg-background/90 shadow-[0_28px_120px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-colors",
            isDragging && "border-primary/50 bg-primary/5",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {messages.length === 1 && (
            <div className="border-b border-border/60 bg-muted/20 px-6 py-6">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Analise ATS orientada por vaga</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O chat usa a descricao da vaga para apontar lacunas, prioridades e proximos passos.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                  <Upload className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Upload direto no fluxo</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    PDF e DOCX entram no mesmo workspace para parsing, revisao e geracao final.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Streaming visivel</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Cada resposta aparece em tempo real para manter a conversa transparente e rapida.
                  </p>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-4 md:px-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} {...message} />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/60 bg-background/88 p-4 backdrop-blur-xl md:p-5">
            <div className="mx-auto max-w-3xl space-y-3">
              {uploadedFile && (
                <div className="flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-2 shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="max-w-[220px] truncate text-sm text-foreground">{uploadedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    disabled={isInputDisabled}
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="rounded-[28px] border border-border/70 bg-card/85 p-3 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.45)]">
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="mt-1 h-11 w-11 shrink-0 rounded-2xl"
                    disabled={isInputDisabled}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Cole a descricao da vaga aqui..."
                    className="min-h-[88px] flex-1 resize-none rounded-2xl border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
                    rows={3}
                    disabled={isInputDisabled}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        void handleSend()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="mt-1 h-11 w-11 shrink-0 rounded-2xl"
                    disabled={(!input.trim() && !uploadedFile) || isInputDisabled}
                    onClick={() => void handleSend()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  {sessionLimitReached ? (
                    <p className="text-amber-600">
                      Esta sessao atingiu o limite de mensagens. Inicie uma nova analise para continuar.
                    </p>
                  ) : (
                    <p>Arraste um arquivo PDF ou DOCX, ou clique no botao de upload.</p>
                  )}
                  <p>Enter envia. Shift + Enter quebra a linha.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
