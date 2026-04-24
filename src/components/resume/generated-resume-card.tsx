import { ChevronRight, Download, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GeneratedResumeHistoryItem } from "@/lib/generated-resume-types"

type GeneratedResumeCardProps = {
  resume: GeneratedResumeHistoryItem
  onDownloadPdf?: (id: string) => void
  onOpen?: (id: string) => void
}

function formatRelativeTime(dateInput: string): string {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const differenceInMs = Date.now() - date.getTime()
  const differenceInMinutes = Math.floor(differenceInMs / 60_000)
  const differenceInHours = Math.floor(differenceInMs / 3_600_000)
  const differenceInDays = Math.floor(differenceInMs / 86_400_000)
  const differenceInWeeks = Math.floor(differenceInDays / 7)
  const differenceInMonths = Math.floor(differenceInDays / 30)
  const differenceInYears = Math.floor(differenceInDays / 365)

  if (differenceInMinutes < 1) {
    return "agora mesmo"
  }

  if (differenceInMinutes < 60) {
    return `há ${differenceInMinutes} min`
  }

  if (differenceInHours < 24) {
    return `há ${differenceInHours} h`
  }

  if (differenceInDays < 7) {
    return `há ${differenceInDays} dia${differenceInDays === 1 ? "" : "s"}`
  }

  if (differenceInWeeks < 5) {
    return `há ${differenceInWeeks} semana${differenceInWeeks === 1 ? "" : "s"}`
  }

  if (differenceInMonths < 12) {
    return differenceInMonths === 1 ? "há 1 mês" : `há ${differenceInMonths} meses`
  }

  return `há ${differenceInYears} ano${differenceInYears === 1 ? "" : "s"}`
}

export function GeneratedResumeCard({
  resume,
  onDownloadPdf,
  onOpen,
}: GeneratedResumeCardProps) {
  const modeLabel = resume.mode === "ats_enhancement" ? "ATS otimizado" : "Vaga-alvo"
  const statusLabel = {
    completed: "Concluído",
    processing: "Processando",
    failed: "Falhou",
  }[resume.status]

  const statusColor = {
    completed: "bg-green-50 text-green-700",
    processing: "bg-yellow-50 text-yellow-700",
    failed: "bg-red-50 text-red-700",
  }[resume.status]

  const modeColor =
    resume.mode === "ats_enhancement" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-1 shrink-0">
          <FileText className="h-5 w-5 text-neutral-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">{resume.title}</h3>
          {resume.targetRole ? (
            <p className="line-clamp-1 text-xs text-neutral-500">{resume.targetRole}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex shrink-0 flex-wrap gap-2">
        <Badge variant="secondary" className={modeColor}>
          {modeLabel}
        </Badge>
        <Badge variant="secondary" className={statusColor}>
          {statusLabel}
        </Badge>
      </div>

      {resume.targetJobSnippet ? (
        <p className="mb-3 flex-1 line-clamp-2 text-xs text-neutral-600">{resume.targetJobSnippet}</p>
      ) : (
        <div className="flex-1" />
      )}

      <p className="mb-4 shrink-0 text-xs text-neutral-400">{formatRelativeTime(resume.createdAt)}</p>

      <div className="flex shrink-0 gap-2">
        {resume.pdfAvailable ? (
          <Button
            type="button"
            onClick={() => onDownloadPdf?.(resume.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => onOpen?.(resume.id)}
          variant="outline"
          size="sm"
          className="flex-none"
          aria-label={`Abrir ${resume.title}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
