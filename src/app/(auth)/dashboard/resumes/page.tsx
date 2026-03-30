import { Metadata } from "next"

import { ResumesOverview } from "@/components/dashboard/resumes-overview"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { db } from "@/lib/db/sessions"

import { createSession } from "../actions"

export const metadata: Metadata = {
  title: "Meus Curriculos - CurrIA",
  description: "Historico de curriculos analisados",
}

export default async function DashboardResumesPage() {
  const appUser = await getCurrentAppUser()
  if (!appUser) return null

  const sessions = await db.getUserSessions(appUser.id)

  const formattedSessions = sessions.map((session) => ({
    id: session.id,
    phase: session.phase,
    atsScore: session.atsScore?.total,
    createdAt: session.updatedAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  return <ResumesOverview sessions={formattedSessions} createSessionAction={createSession} />
}
