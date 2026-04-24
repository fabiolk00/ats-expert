"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, FileText, Info } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { GeneratedResumeHistoryItem } from "@/lib/generated-resume-types"

import { GeneratedResumeCard } from "./generated-resume-card"

type GeneratedResumeHistoryProps = {
  resumes: GeneratedResumeHistoryItem[]
  isLoading?: boolean
  error?: string | null
  onBack?: () => void
  onRetry?: () => void
  onDownloadPdf?: (id: string) => void
  onOpen?: (id: string) => void
}

const ITEMS_PER_PAGE = 4

function BackButton({ onBack }: { onBack?: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-6 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar ao perfil
    </button>
  )
}

export function GeneratedResumeHistory({
  resumes,
  isLoading = false,
  error = null,
  onBack,
  onRetry,
  onDownloadPdf,
  onOpen,
}: GeneratedResumeHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(resumes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentResumes = resumes.slice(startIndex, endIndex)

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Não foi possível carregar o histórico
          </h2>
          <p className="text-sm text-neutral-600 mb-6">{error}</p>
          <Button onClick={onRetry}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <BackButton onBack={onBack} />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Currículos gerados</h1>
            <p className="text-sm text-neutral-600">
              Carregando seu histórico de currículos...
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-48 rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <BackButton onBack={onBack} />

          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="h-6 w-6 text-neutral-400" />
              </EmptyMedia>
              <EmptyTitle>Nenhum currículo ainda</EmptyTitle>
              <EmptyDescription>
                Gere sua primeira versão otimizada para ATS ou adapte seu currículo para uma vaga específica.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={onBack}>Ir para o perfil</Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <BackButton onBack={onBack} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Currículos gerados</h1>
          <p className="text-sm text-neutral-600">
            Você tem {resumes.length} currículo{resumes.length !== 1 ? "s" : ""} gerado
            {resumes.length !== 1 ? "s" : ""} pronto{resumes.length !== 1 ? "s" : ""} para baixar ou comparar.
          </p>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Mantemos seus últimos 6 PDFs gerados. Versões mais antigas podem ser arquivadas automaticamente para liberar armazenamento.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          {currentResumes.map((resume) => (
            <GeneratedResumeCard
              key={resume.id}
              resume={resume}
              onDownloadPdf={onDownloadPdf}
              onOpen={onOpen}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage > 1) setCurrentPage((page) => page - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                      className={`cursor-pointer ${
                        currentPage === page
                          ? "bg-black text-white"
                          : ""
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage < totalPages) setCurrentPage((page) => page + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
