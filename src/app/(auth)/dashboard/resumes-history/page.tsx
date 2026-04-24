import type { Metadata } from "next"

import { GeneratedResumeHistoryPage } from "@/components/resume/generated-resume-history-page"

export const metadata: Metadata = {
  title: "Histórico de currículos - CurrIA",
  description: "Visualize o histórico mockado das versões de currículo geradas no dashboard.",
}

export default function ResumesHistoryPage() {
  return <GeneratedResumeHistoryPage />
}
