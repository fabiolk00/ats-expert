"use client"

import { ResumeResultPage } from "@/components/resume/resume-result-page"
import {
  mockOptimizedResume,
  mockOriginalResume,
  mockJobDescription,
} from "@/lib/mock-data/resume-result-mocks"

export default function DemoResumeResultPage() {
  return (
    <ResumeResultPage
      optimizedCvState={mockOptimizedResume}
      originalCvState={mockOriginalResume}
      jobDescription={mockJobDescription}
      onDownloadPdf={() => console.log("Downloading PDF...")}
      onGenerateNewVersion={() => console.log("Generating new version...")}
      onComparisonChange={(isComparing) => console.log("Comparison mode:", isComparing)}
    />
  )
}
