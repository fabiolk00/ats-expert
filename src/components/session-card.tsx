"use client"

import Link from "next/link"
import { ArrowUpRight, Download, FileStack } from "lucide-react"

import ATSScoreBadge from "@/components/ats-score-badge"
import PhaseBadge from "@/components/phase-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Phase = "intake" | "analysis" | "dialog" | "confirm" | "generation"

interface Session {
  id: string
  phase: Phase
  atsScore?: number
  createdAt: string
}

interface SessionCardProps {
  session: Session
}

export default function SessionCard({ session }: SessionCardProps) {
  const isGeneration = session.phase === "generation"

  return (
    <Card className="overflow-hidden rounded-[28px] border-border/70 bg-card/90 p-5 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <FileStack className="h-4 w-4 text-primary" />
            Sessao {session.id.slice(0, 8)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={session.phase} />
            {session.atsScore !== undefined && <ATSScoreBadge score={session.atsScore} showLabel={false} />}
          </div>
          <p className="text-sm text-muted-foreground">{session.createdAt}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGeneration ? (
            <>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => {}}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => {}}>
                <Download className="mr-2 h-4 w-4" />
                DOCX
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link href={`/dashboard?session=${session.id}`}>
                Continuar
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
