import type { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server"

import UserDataPage from "@/components/resume/user-data-page"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { isE2EAuthEnabled } from "@/lib/auth/e2e-auth"

export const metadata: Metadata = {
  title: "Perfil profissional - CurrIA",
  description: "Configure e revise o perfil base que alimenta novas sessões.",
}

export default async function ProfileSetupPage() {
  const [appUser, clerkUser] = await Promise.all([
    getCurrentAppUser(),
    isE2EAuthEnabled() ? Promise.resolve(null) : currentUser(),
  ])

  return (
    <UserDataPage
      currentCredits={appUser?.creditAccount.creditsRemaining ?? 0}
      currentAppUserId={appUser?.id ?? null}
      userImageUrl={clerkUser?.imageUrl ?? null}
    />
  )
}
