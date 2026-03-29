import { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server"

import { ResumeWorkspace } from "@/components/dashboard/resume-workspace"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { db } from "@/lib/db/sessions"

export const metadata: Metadata = {
  title: "Dashboard - CurrIA",
  description: "Otimize seu curriculo com IA",
}

export const dynamic = "force-dynamic"

interface DashboardPageProps {
  searchParams?: {
    session?: string | string[]
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return <ResumeWorkspace userName="Voce" />
  }

  const user = await currentUser()
  const userName = user?.firstName || "Voce"
  const rawSessionParam = searchParams?.session
  const requestedSessionId = Array.isArray(rawSessionParam)
    ? rawSessionParam[0]
    : rawSessionParam

  const sessions = await db.getUserSessions(appUser.id)
  let activeSessionId = requestedSessionId || sessions[0]?.id

  if (requestedSessionId) {
    const sessionExists = sessions.some((session) => session.id === requestedSessionId)
    if (!sessionExists) {
      activeSessionId = sessions[0]?.id
    }
  }

  return <ResumeWorkspace initialSessionId={activeSessionId} userName={userName} />
}
