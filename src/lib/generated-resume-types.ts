export type GeneratedResumeMode = "ats_enhancement" | "job_targeting"
export type GeneratedResumeStatus = "completed" | "processing" | "failed"

export interface GeneratedResumeHistoryItem {
  id: string
  sessionId: string
  title: string
  mode: GeneratedResumeMode
  status: GeneratedResumeStatus
  createdAt: string
  updatedAt?: string
  targetRole?: string
  targetJobSnippet?: string
  pdfAvailable: boolean
}
