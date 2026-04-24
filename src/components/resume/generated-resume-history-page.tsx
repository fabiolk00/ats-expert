"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { mockGeneratedResumeHistory } from "@/lib/generated-resume-mock"
import { PROFILE_SETUP_PATH } from "@/lib/routes/app"

import { GeneratedResumeHistory } from "./generated-resume-history"

function showMockToast(action: string) {
  toast.info(`${action} ainda está mockado nesta etapa.`)
}

export function GeneratedResumeHistoryPage() {
  const router = useRouter()

  return (
    <GeneratedResumeHistory
      resumes={mockGeneratedResumeHistory}
      onBack={() => router.push(PROFILE_SETUP_PATH)}
      onDownloadPdf={() => showMockToast("O download do PDF")}
      onOpen={() => showMockToast("A abertura do currículo")}
    />
  )
}
