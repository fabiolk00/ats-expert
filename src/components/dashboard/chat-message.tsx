import ATSScoreBadge from "@/components/ats-score-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { renderSimpleMarkdown } from "@/lib/utils/simple-markdown"
import { cn } from "@/lib/utils"
import { ArrowRight, Bot, Check, Download, User, X } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  analysisResult?: {
    scoreBefore: number
    scoreAfter: number
    matchedKeywords: string[]
    missingKeywords: string[]
    suggestions: string[]
  }
}

export function ChatMessage({ role, content, timestamp, analysisResult }: ChatMessageProps) {
  const isAssistant = role === "assistant"

  return (
    <div className={cn("flex gap-4", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <Avatar className="mt-1 h-10 w-10 shrink-0 border border-border/60 bg-background shadow-sm">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[88%] space-y-3", !isAssistant && "order-first")}>
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.24em]",
            isAssistant ? "text-muted-foreground" : "justify-end text-primary/70",
          )}
        >
          <span>{isAssistant ? "CurrIA AI" : "Voce"}</span>
          {timestamp && <span className="tracking-normal normal-case">{timestamp}</span>}
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-[26px] border px-5 py-4 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-sm",
            isAssistant
              ? "rounded-tl-md border-border/70 bg-card/92 text-card-foreground"
              : "rounded-tr-md border-primary/15 bg-primary text-primary-foreground",
          )}
        >
          <div className="text-sm leading-7">
            {isAssistant ? renderSimpleMarkdown(content) : <p className="whitespace-pre-wrap">{content}</p>}
          </div>
        </div>

        {analysisResult && (
          <Card className="overflow-hidden border-border/70 bg-card/85 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Analise aplicada
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    Comparativo entre o curriculo original e a versao otimizada.
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                >
                  Resultado ATS
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-2xl border border-border/70 bg-muted/45 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Antes</p>
                  <ATSScoreBadge score={analysisResult.scoreBefore} showLabel={false} />
                </div>
                <div className="flex justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Depois</p>
                  <ATSScoreBadge score={analysisResult.scoreAfter} showLabel={false} />
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Palavras-chave presentes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.matchedKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 rounded-full border border-success/15 bg-success/10 px-3 py-1 text-xs text-foreground"
                    >
                      <Check className="h-3 w-3 text-success" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {analysisResult.missingKeywords.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Palavras-chave adicionadas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 rounded-full border-warning/40 px-3 py-1 text-xs text-warning"
                      >
                        <X className="h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Melhorias aplicadas
                </p>
                <ul className="space-y-1.5">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground/80"
                    >
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full gap-2 rounded-full" size="sm">
                <Download className="h-4 w-4" />
                Baixar curriculo otimizado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {!isAssistant && (
        <Avatar className="mt-1 h-10 w-10 shrink-0 border border-border/60 bg-background shadow-sm">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
