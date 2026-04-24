import { redirect } from "next/navigation"

import { DASHBOARD_RESUMES_HISTORY_PATH } from "@/lib/routes/app"

export default function LegacyResumesHistoryPage() {
  redirect(DASHBOARD_RESUMES_HISTORY_PATH)
}
