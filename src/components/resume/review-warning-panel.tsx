"use client"

import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react"

import type { CvHighlightState } from "@/lib/resume/cv-highlight-artifact"
import { cn } from "@/lib/utils"

type ReviewItem = NonNullable<CvHighlightState["reviewItems"]>[number]

type ReviewWarningPanelProps = {
  items: ReviewItem[]
  hasInlineHighlights: boolean
  onItemSelect?: (item: ReviewItem) => void
  className?: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function corruptUtf8AsLatin1(value: string): string {
  return Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join("")
}

const MOJIBAKE_REPAIRS: Array<[RegExp, string]> = [
  "currículo",
  "atenção",
  "aproximação",
  "evidência",
  "experiência",
  "geração",
  "adaptação",
  "você",
  "não",
].map((replacement) => {
  const once = corruptUtf8AsLatin1(replacement)
  const twice = corruptUtf8AsLatin1(once)
  return [new RegExp(`${escapeRegExp(twice)}|${escapeRegExp(once)}`, "gi"), replacement]
})

export function repairMojibakeForDisplay(text: string): string {
  return MOJIBAKE_REPAIRS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  )
}

function inferHumanCopy(item: ReviewItem): { sectionLabel: string } {
  const sectionLabel = item.section === "experience"
    ? "Experiência"
    : item.section === "skills"
      ? "Skills"
      : item.section === "education"
        ? "Educação"
        : item.section === "certifications"
          ? "Certificações"
          : item.section === "general"
            ? "Geral"
            : "Resumo"
  return { sectionLabel }
}

function SeverityBadge({ severity }: { severity: ReviewItem["severity"] }) {
  if (severity === "review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
        <CheckCircle2 className="h-3 w-3" />
        Revisão
      </span>
    )
  }

  if (severity === "caution") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
        <Info className="h-3 w-3" />
        Atenção
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900">
      <AlertTriangle className="h-3 w-3" />
      Revisar
    </span>
  )
}

export function ReviewWarningPanel({
  items,
  hasInlineHighlights,
  onItemSelect,
  className,
}: ReviewWarningPanelProps) {
  const displayItems = items.filter((item) => item.severity === "risk" || item.severity === "caution" || item.severity === "review")
  const lowFitItem = displayItems.find((item) => item.issueType === "low_fit_target_role" || item.issueType === "target_role_overclaim")
  const topUnsupportedSignalsForDisplay = lowFitItem?.missingEvidence ?? []

  if (displayItems.length === 0) {
    return null
  }

  return (
    <aside
      data-testid="override-review-panel"
      className={cn(
        "rounded-lg border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900/60 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Pontos para revisar
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            Esta versão foi gerada mesmo com avisos de aderência à vaga. Isso não impede o uso do currículo, mas recomendamos revisar os pontos abaixo.
          </p>
        </div>
      </div>

      {!hasInlineHighlights ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Não há trechos destacados automaticamente, mas existem pontos de revisão listados abaixo.
        </p>
      ) : null}
      {lowFitItem ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Esta vaga parece distante do seu currículo atual.</p>
          {lowFitItem.targetRole ? <p className="mt-1"><strong>Vaga alvo:</strong> {lowFitItem.targetRole}</p> : null}
          {lowFitItem.originalProfileLabel ? <p className="mt-1"><strong>Seu perfil comprovado:</strong> {lowFitItem.originalProfileLabel}</p> : null}
          {topUnsupportedSignalsForDisplay.length > 0 ? (
            <div className="mt-2">
              <p><strong>Principais requisitos da vaga sem evidência suficiente:</strong></p>
              <ul className="ml-4 mt-1 list-disc">
                {topUnsupportedSignalsForDisplay.slice(0, 6).map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {displayItems.map((item, index) => {
          const copy = inferHumanCopy(item)
          const explanation = repairMojibakeForDisplay(item.explanation || item.message)
          const whyItMatters = repairMojibakeForDisplay(item.whyItMatters || "")
          const suggestedAction = repairMojibakeForDisplay(item.suggestedAction || "")

          return (
            <button
              key={`${item.severity}-${item.issueType ?? "review"}-${index}`}
              type="button"
              onClick={() => onItemSelect?.(item)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-amber-900 dark:hover:bg-amber-950/30"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={item.severity} />
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {copy.sectionLabel}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {explanation}
              </p>
              {whyItMatters ? <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200"><strong>Por que revisar:</strong> {whyItMatters}</p> : null}
              {suggestedAction ? <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200"><strong>Ação sugerida:</strong> {suggestedAction}</p> : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
