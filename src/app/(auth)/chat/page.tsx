import React from "react"
import { currentUser } from "@clerk/nextjs/server"

import { ResumeWorkspace } from "@/components/dashboard/resume-workspace"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { getAiChatAccess } from "@/lib/billing/ai-chat-access.server"
import { isE2EAuthEnabled } from "@/lib/auth/e2e-auth"
import type { PlanSlug } from "@/lib/plans"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface ChatPageProps {
  searchParams?: {
    session?: string | string[]
  }
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const rawSessionParam = searchParams?.session
  const initialSessionId = Array.isArray(rawSessionParam)
    ? rawSessionParam[0]
    : rawSessionParam

  const [appUser, clerkUser] = await Promise.all([
    getCurrentAppUser(),
    isE2EAuthEnabled() ? Promise.resolve(null) : currentUser(),
  ])
  const aiChatAccess = appUser
    ? await getAiChatAccess(appUser.id)
    : null

  const currentCredits = appUser?.creditAccount.creditsRemaining ?? 0
  const activeRecurringPlan: PlanSlug | null =
    aiChatAccess?.plan === "monthly" || aiChatAccess?.plan === "pro"
      ? aiChatAccess.status === "active" && Boolean(aiChatAccess.asaasSubscriptionId)
        ? aiChatAccess.plan
        : null
      : null
  const missingContactInfo = {
    missingEmail: !clerkUser?.primaryEmailAddress?.emailAddress?.trim(),
    missingPhone: !clerkUser?.primaryPhoneNumber?.phoneNumber?.trim(),
  }
  const displayName =
    clerkUser?.firstName?.trim()
    || clerkUser?.fullName?.trim()
    || clerkUser?.username
    || "Você"

  return (
    <ResumeWorkspace
      canAccessAiChat={aiChatAccess?.allowed ?? false}
      aiChatAccessTitle={aiChatAccess && !aiChatAccess.allowed ? aiChatAccess.title : undefined}
      aiChatAccessMessage={aiChatAccess && !aiChatAccess.allowed ? aiChatAccess.message : undefined}
      aiChatUpgradeUrl={aiChatAccess && !aiChatAccess.allowed ? aiChatAccess.upgradeUrl : undefined}
      initialSessionId={initialSessionId || undefined}
      userName={displayName}
      missingContactInfo={missingContactInfo}
      activeRecurringPlan={activeRecurringPlan}
      currentCredits={currentCredits}
    />
  )
}
