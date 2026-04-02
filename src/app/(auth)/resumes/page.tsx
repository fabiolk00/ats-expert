import React from "react"
import type { Metadata } from "next"

import { JobApplicationsTracker } from "@/components/dashboard/job-applications-tracker"
import { getUserBillingInfo } from "@/lib/asaas/quota"
import { getCurrentAppUser } from "@/lib/auth/app-user"
import { getJobApplicationsForUser } from "@/lib/db/job-applications"
import type { JobApplication, SerializedJobApplication } from "@/types/dashboard"

import {
  createJobApplicationAction,
  deleteJobApplicationAction,
  updateJobApplicationDetailsAction,
  updateJobApplicationStatusAction,
} from "./actions"

export const metadata: Metadata = {
  title: "Minhas Vagas - CurrIA",
  description: "Acompanhe manualmente o status das suas candidaturas.",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

function serializeJobApplication(application: JobApplication): SerializedJobApplication {
  return {
    ...application,
    appliedAt: application.appliedAt.toISOString(),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }
}

export default async function ResumesPage() {
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    return null
  }

  const [applications, billingInfo] = await Promise.all([
    getJobApplicationsForUser(appUser.id),
    getUserBillingInfo(appUser.id).catch(() => null),
  ])
  const hasPaidAccess = billingInfo !== null && billingInfo.plan !== "free"

  return (
    <JobApplicationsTracker
      applications={applications.map(serializeJobApplication)}
      locked={!hasPaidAccess}
      createApplicationAction={createJobApplicationAction}
      updateApplicationDetailsAction={updateJobApplicationDetailsAction}
      updateApplicationStatusAction={updateJobApplicationStatusAction}
      deleteApplicationAction={deleteJobApplicationAction}
    />
  )
}
