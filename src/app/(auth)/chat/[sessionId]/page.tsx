import { redirect } from "next/navigation"

import { buildChatPath } from "@/lib/routes/app"

interface ChatPageProps {
  params: { sessionId: string }
}

export default function LegacyChatPage({ params }: ChatPageProps) {
  redirect(buildChatPath(params.sessionId))
}
