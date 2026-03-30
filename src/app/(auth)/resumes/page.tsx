import { Metadata } from "next"
import { Plus } from "lucide-react"

import SessionList from "@/components/dashboard/session-list"
import { Button } from "@/components/ui/button"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { db } from "@/lib/db/sessions"

import { createSession } from "../dashboard/actions"

export const metadata: Metadata = {
  title: "Meus Curriculos - CurrIA",
  description: "Historico de curriculos analisados",
}

export default async function ResumesPage() {
  const appUser = await getCurrentAppUser()
  if (!appUser) return null

  const sessions = await db.getUserSessions(appUser.id)

  const formattedSessions = sessions.map((session) => ({
    id: session.id,
    phase: session.phase,
    atsScore: session.atsScore?.total,
    createdAt: session.createdAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[2rem] border border-border/60 bg-card/85 p-6 shadow-[0_28px_90px_-70px_oklch(var(--foreground)/0.9)]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Biblioteca pessoal
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Meus curriculos</h1>
            <p className="mt-3 text-muted-foreground">
              Historico de todas as suas analises e geracoes para retomar qualquer sessao.
            </p>
          </div>

          <form action={createSession}>
            <Button type="submit" className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Novo curriculo
            </Button>
          </form>
        </div>

        {formattedSessions.length > 0 ? (
          <SessionList sessions={formattedSessions} />
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border/60 px-6 py-12 text-center text-muted-foreground">
            Voce ainda nao tem nenhum curriculo analisado.
          </div>
        )}
      </div>
    </div>
  )
}
