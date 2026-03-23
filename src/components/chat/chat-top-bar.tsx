import Link from "next/link"
import { Button } from "@/components/ui/button"
import PhaseBadge from "@/components/phase-badge"
import ATSScoreBadge from "@/components/ats-score-badge"
import { ArrowLeft } from "lucide-react"

type Phase = 'intake' | 'analysis' | 'dialog' | 'confirm' | 'generation'

interface ChatTopBarProps {
  phase: Phase
  atsScore?: number
}

export default function ChatTopBar({ phase, atsScore }: ChatTopBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar para dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PhaseBadge phase={phase} />
        <div className="w-9">
          {atsScore !== undefined && <ATSScoreBadge score={atsScore} />}
        </div>
      </div>
    </header>
  )
}
