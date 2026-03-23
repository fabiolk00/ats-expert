import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardNavbar from "@/components/dashboard/navbar"
import SessionList from "@/components/dashboard/session-list"
import EmptyState from "@/components/dashboard/empty-state"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard - CurrIA",
  description: "Gerencie seus currículos otimizados",
}

// Mock data for demonstration
const mockSessions = [
  {
    id: "1",
    phase: "generation" as const,
    atsScore: 92,
    createdAt: "22 mar 2025, 14:30",
  },
  {
    id: "2",
    phase: "dialog" as const,
    atsScore: 78,
    createdAt: "21 mar 2025, 09:15",
  },
  {
    id: "3",
    phase: "analysis" as const,
    atsScore: 45,
    createdAt: "20 mar 2025, 16:45",
  },
  {
    id: "4",
    phase: "intake" as const,
    createdAt: "19 mar 2025, 11:00",
  },
]

export default function DashboardPage() {
  const sessions = mockSessions
  const hasSessions = sessions.length > 0
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold">Meus currículos</h1>
          <Button asChild>
            <Link href="/chat/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo currículo
            </Link>
          </Button>
        </div>
        
        {hasSessions ? (
          <SessionList sessions={sessions} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
