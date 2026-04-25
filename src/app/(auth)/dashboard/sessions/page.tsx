import { Metadata } from "next"
import { AiChatAccessCard } from "@/components/dashboard/ai-chat-access-card"
import { SessionsList } from "@/components/dashboard/sessions-list"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { getAiChatAccess } from "@/lib/billing/ai-chat-access.server"

export const metadata: Metadata = {
  title: "Sessões - CurrIA",
  description: "Visualize suas sessões anteriores",
}

export default async function SessionsPage() {
  const appUser = await getCurrentAppUser()
  const aiChatAccess = appUser ? await getAiChatAccess(appUser.id) : null

  if (aiChatAccess && !aiChatAccess.allowed) {
    return (
      <div className="h-full bg-[#faf9f5] p-6">
        <AiChatAccessCard
          title={aiChatAccess.title}
          message={aiChatAccess.message}
          ctaHref={aiChatAccess.upgradeUrl}
          className="min-h-[70svh]"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f5]">
      <div className="flex-1 flex flex-col min-h-0 p-6">
        <h1 className="text-3xl font-bold mb-6">Minhas Sessões</h1>
        <SessionsList />
      </div>
    </div>
  )
}
