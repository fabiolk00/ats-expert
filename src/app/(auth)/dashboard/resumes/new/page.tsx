import type { Metadata } from "next"

import UserDataPage from "@/components/resume/user-data-page"

export const metadata: Metadata = {
  title: "Novo curr\u00edculo - CurrIA",
  description: "Preencha e revise os dados do seu curr\u00edculo.",
}

export default function NewResumePage() {
  return <UserDataPage />
}
