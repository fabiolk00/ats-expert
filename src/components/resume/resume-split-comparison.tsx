"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumePreviewCard } from "@/components/resume/resume-preview-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import type { CVState } from "@/types/cv"

type ResumeSplitComparisonProps = {
  originalCvState: CVState
  optimizedCvState: CVState
  onBack?: () => void
}

export function ResumeSplitComparison({
  originalCvState,
  optimizedCvState,
  onBack,
}: ResumeSplitComparisonProps) {
  const [isMobileView, setIsMobileView] = useState(false)

  return (
    <div>
      {/* Mobile: Tabs View */}
      <div className="block lg:hidden">
        <Tabs defaultValue="optimized" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimized">Currículo Otimizado</TabsTrigger>
            <TabsTrigger value="original">Currículo Original</TabsTrigger>
          </TabsList>

          <TabsContent value="optimized" className="mt-6">
            <ResumePreviewCard cvState={optimizedCvState} variant="optimized" />
          </TabsContent>

          <TabsContent value="original" className="mt-6">
            <ResumePreviewCard cvState={originalCvState} variant="original" />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para versão otimizada
          </Button>
        </div>
      </div>

      {/* Desktop: Split View */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
        <div>
          <h3 className="mb-4 text-sm font-semibold text-neutral-700">
            Currículo Original
          </h3>
          <ResumePreviewCard cvState={originalCvState} variant="original" />
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-neutral-700">
            Currículo Otimizado
          </h3>
          <ResumePreviewCard cvState={optimizedCvState} variant="optimized" />
        </div>
      </div>

      <div className="mt-8 flex justify-center lg:justify-start">
        <Button
          onClick={onBack}
          variant="outline"
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para versão otimizada
        </Button>
      </div>
    </div>
  )
}
