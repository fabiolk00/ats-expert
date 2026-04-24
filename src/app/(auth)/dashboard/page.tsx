import { redirect } from "next/navigation"

import { buildChatPath } from "@/lib/routes/app"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface DashboardPageProps {
  searchParams?: {
    session?: string | string[]
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawSessionParam = searchParams?.session
  const initialSessionId = Array.isArray(rawSessionParam)
    ? rawSessionParam[0]
    : rawSessionParam

  redirect(buildChatPath(initialSessionId))
}
