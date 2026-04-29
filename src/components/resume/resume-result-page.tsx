"use client"

import { useState } from "react"
import { ChevronDown, Download, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResumePreviewCard } from "@/components/resume/resume-preview-card"
import { ResumeSplitComparison } from "@/components/resume/resume-split-comparison"
import { AiReviewDrawer } from "@/components/resume/ai-review-drawer"
import type { CVState } from "@/types/cv"

type ResumeResultPageProps = {
  optimizedCvState: CVState
  originalCvState: CVState
  jobDescription?: string
  onDownloadPdf?: () => void
  onGenerateNewVersion?: () => void
  onComparisonChange?: (isComparing: boolean) => void
}

export function ResumeResultPage({
  optimizedCvState,
  originalCvState,
  jobDescription,
  onDownloadPdf,
  onGenerateNewVersion,
  onComparisonChange,
}: ResumeResultPageProps) {
  const [isComparing, setIsComparing] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)

  const handleToggleComparison = (comparing: boolean) => {
    setIsComparing(comparing)
    setIsDrawerOpen(!comparing)
    onComparisonChange?.(comparing)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-neutral-900">
              Currículo adaptado para a vaga
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Versão otimizada com base na descrição da vaga
            </p>
          </div>

          {/* Metadata Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
              Job Targeting
            </Badge>
            <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
              PDF gerado
            </Badge>
            <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
              1 crédito usado
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onDownloadPdf}
              className="gap-2 bg-black text-white hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button
              onClick={onGenerateNewVersion}
              variant="outline"
              className="gap-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50"
            >
              <RotateCcw className="h-4 w-4" />
              Gerar nova versão
            </Button>
            <Button
              onClick={() => handleToggleComparison(!isComparing)}
              variant="outline"
              className="gap-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50"
            >
              <ChevronDown className="h-4 w-4" />
              {isComparing ? "Voltar para versão otimizada" : "Comparar com original"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isComparing ? (
          <ResumeSplitComparison
            originalCvState={originalCvState}
            optimizedCvState={optimizedCvState}
          />
        ) : (
          <div className="flex gap-6 lg:gap-8">
            {/* Resume Preview Card */}
            <div className="flex-1 min-w-0">
              <ResumePreviewCard cvState={optimizedCvState} variant="optimized" />
            </div>

            {/* AI Review Drawer - Desktop */}
            {isDrawerOpen && (
              <div className="hidden lg:block w-full max-w-sm flex-shrink-0">
                <AiReviewDrawer
                  originalCvState={originalCvState}
                  optimizedCvState={optimizedCvState}
                  jobDescription={jobDescription}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile AI Review Drawer - Toggle Button */}
        {!isComparing && !isDrawerOpen && (
          <div className="mt-8 flex justify-center lg:hidden">
            <Button
              onClick={() => setIsDrawerOpen(true)}
              variant="outline"
              className="gap-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
              Abrir Revisão da IA
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
