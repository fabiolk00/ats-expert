"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import FileChip from "@/components/file-chip"
import { Paperclip, Send, Loader2 } from "lucide-react"

interface ChatInputProps {
  onSend?: (message: string, file?: File) => void
  isStreaming?: boolean
}

export default function ChatInput({ onSend, isStreaming = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !selectedFile) || isStreaming) return
    
    onSend?.(message, selectedFile || undefined)
    setMessage("")
    setSelectedFile(null)
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }
  
  return (
    <div className="border-t border-border bg-background">
      <form onSubmit={handleSubmit} className="container mx-auto px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {selectedFile && (
            <div className="mb-2">
              <FileChip
                filename={selectedFile.name}
                onRemove={() => setSelectedFile(null)}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              aria-label="Anexar arquivo"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={isStreaming}
              className="min-h-[44px] max-h-[132px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!message.trim() && !selectedFile) || isStreaming}
              aria-label="Enviar mensagem"
            >
              {isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
