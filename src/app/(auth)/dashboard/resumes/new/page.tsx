import { redirect } from "next/navigation"

import { PROFILE_SETUP_PATH } from "@/lib/routes/app"

export default function LegacyProfileSetupPage() {
  redirect(PROFILE_SETUP_PATH)
}
