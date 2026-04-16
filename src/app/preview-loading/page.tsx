"use client"

import { useState } from "react"

import { GenerationLoading } from "@/components/resume/generation-loading"
import { Button } from "@/components/ui/button"

export default function PreviewLoadingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [generationType, setGenerationType] = useState<"ATS_ENHANCEMENT" | "JOB_TARGETING">("ATS_ENHANCEMENT")

  const startLoading = (type: "ATS_ENHANCEMENT" | "JOB_TARGETING") => {
    setGenerationType(type)
    setIsLoading(true)
    
    // Simular tempo de geracao
    setTimeout(() => {
      setIsLoading(false)
    }, 8000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-6">
      <h1 className="text-2xl font-bold text-zinc-900">Preview - Animacao de Loading</h1>
      
      <div className="flex gap-4">
        <Button
          onClick={() => startLoading("ATS_ENHANCEMENT")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Testar ATS Enhancement
        </Button>
        
        <Button
          onClick={() => startLoading("JOB_TARGETING")}
          variant="outline"
        >
          Testar Job Targeting
        </Button>
      </div>

      <p className="text-sm text-zinc-500">
        Clique em um botao para ver a animacao de loading
      </p>

      <GenerationLoading
        isLoading={isLoading}
        generationType={generationType}
        onComplete={() => console.log("Loading complete!")}
      />
    </div>
  )
}
