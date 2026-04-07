import type { Metadata } from "next"

import UserDataPage from "@/components/resume/user-data-page"

export const metadata: Metadata = {
  title: "Perfil profissional - CurrIA",
  description: "Configure e revise o perfil base que alimenta novas sess\u00f5es.",
}

export default function NewResumePage() {
  return <UserDataPage />
}
