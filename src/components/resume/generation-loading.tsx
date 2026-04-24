"use client"

import { useEffect, useState } from "react"

import Logo from "@/components/logo"
import { PROFILE_SETUP_PATH } from "@/lib/routes/app"
import { cn } from "@/lib/utils"

interface GenerationLoadingProps {
  isLoading: boolean
  generationType: "ATS_ENHANCEMENT" | "JOB_TARGETING"
  onComplete?: () => void
}

type LoadingTone = "danger" | "warning" | "success"

const loadingMessages = [
  "Analisando seu currículo...",
  "Identificando pontos de melhoria...",
  "Otimizando palavras-chave...",
  "Ajustando formatação ATS...",
  "Refinando experiências...",
  "Aplicando melhores práticas...",
  "Finalizando otimização...",
]

const loadingToneStyles: Record<
  LoadingTone,
  {
    bar: string
    edge: string
    label: string
    dot: string
  }
> = {
  danger: {
    bar: "from-rose-400 via-red-500 to-red-600",
    edge: "from-rose-300/60",
    label: "text-red-600 dark:text-red-400",
    dot: "bg-red-500/30",
  },
  warning: {
    bar: "from-amber-300 via-yellow-400 to-amber-500",
    edge: "from-yellow-200/70",
    label: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-400/35",
  },
  success: {
    bar: "from-emerald-400 via-emerald-500 to-emerald-600",
    edge: "from-emerald-300/50",
    label: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500/30",
  },
}

export function getLoadingTone(progress: number): LoadingTone {
  if (progress <= 30) {
    return "danger"
  }

  if (progress <= 50) {
    return "warning"
  }

  return "success"
}

export function GenerationLoading({
  isLoading,
  generationType,
  onComplete,
}: GenerationLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setProgress(0)
      setMessageIndex(0)
      return
    }

    if (isVisible) {
      setProgress(100)
      const timer = window.setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 700)

      return () => window.clearTimeout(timer)
    }
  }, [isLoading, isVisible, onComplete])

  useEffect(() => {
    if (!isLoading || progress >= 100) {
      return
    }

    const getIncrement = () => {
      if (progress < 30) return Math.random() * 4 + 2.5
      if (progress < 50) return Math.random() * 2.5 + 1.5
      if (progress < 85) return Math.random() * 1.5 + 0.8
      return Math.random() * 0.8 + 0.35
    }

    const timer = window.setTimeout(() => {
      setProgress((previous) => {
        const next = previous + getIncrement()
        return next > 95 ? 95 : next
      })
    }, 350 + Math.random() * 450)

    return () => window.clearTimeout(timer)
  }, [isLoading, progress])

  useEffect(() => {
    const nextIndex = Math.min(
      Math.floor((progress / 100) * loadingMessages.length),
      loadingMessages.length - 1,
    )

    if (nextIndex !== messageIndex) {
      setMessageIndex(nextIndex)
    }
  }, [progress, messageIndex])

  if (!isVisible) {
    return null
  }

  const loadingTone = getLoadingTone(progress)
  const toneStyles = loadingToneStyles[loadingTone]
  const title =
    generationType === "JOB_TARGETING"
      ? "Adaptando para a vaga"
      : "Otimizando para ATS"

  return (
    <div
      data-testid="generation-loading"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300 dark:bg-zinc-950/95",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6">
        <div className="animate-pulse">
          <Logo linkTo={PROFILE_SETUP_PATH} size="default" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <p className="mt-2 h-6 text-sm text-zinc-500 transition-all duration-300 dark:text-zinc-400">
            {loadingMessages[messageIndex]}
          </p>
        </div>

        <div className="relative w-full">
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              data-testid="generation-loading-progress"
              data-tone={loadingTone}
              className="relative h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-r", toneStyles.bar)} />

              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 animate-wave opacity-30"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)",
                  }}
                />
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute -left-full h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute bottom-0 left-[20%] h-1.5 w-1.5 animate-bubble rounded-full bg-white/40" />
                <div
                  className="absolute bottom-0 left-[50%] h-1 w-1 animate-bubble rounded-full bg-white/30"
                  style={{ animationDelay: "0.3s" }}
                />
                <div
                  className="absolute bottom-0 left-[75%] h-1.5 w-1.5 animate-bubble rounded-full bg-white/40"
                  style={{ animationDelay: "0.6s" }}
                />
              </div>

              <div className={cn("absolute right-0 top-0 h-full w-4 bg-gradient-to-l to-transparent", toneStyles.edge)} />
            </div>
          </div>

          <div className="mt-3 flex justify-between text-xs">
            <span className="text-zinc-400 dark:text-zinc-500">Progresso</span>
            <span className={cn("font-medium", toneStyles.label)}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={cn("h-2 w-2 animate-pulse rounded-full", toneStyles.dot)}
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
