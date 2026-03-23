import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import DashboardNavbar from "@/components/dashboard/navbar"
import SessionList from "@/components/dashboard/session-list"
import EmptyState from "@/components/dashboard/empty-state"
import { Plus } from "lucide-react"
import { db } from "@/lib/db/sessions"
import { createSession } from "./actions"

export const metadata: Metadata = {
  title: "Dashboard - CurrIA",
  description: "Gerencie seus currículos otimizados",
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const sessions = await db.getUserSessions(userId)
  const hasSessions = sessions.length > 0

  const formattedSessions = sessions.map(session => ({
    id: session.id,
    phase: session.phase,
    atsScore: session.atsScore?.total,
    createdAt: session.createdAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  }))

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold">Meus currículos</h1>
          <form action={createSession}>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Novo currículo
            </Button>
          </form>
        </div>

        {hasSessions ? (
          <SessionList sessions={formattedSessions} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
