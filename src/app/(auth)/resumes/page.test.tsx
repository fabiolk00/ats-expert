import React from "react"
import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ResumesPage, { dynamic, revalidate } from "./page"

const { mockGetCurrentAppUser, mockGetJobApplicationsForUser, mockGetUserBillingInfo } = vi.hoisted(() => ({
  mockGetCurrentAppUser: vi.fn(),
  mockGetJobApplicationsForUser: vi.fn(),
  mockGetUserBillingInfo: vi.fn(),
}))

vi.mock("@/lib/auth/app-user", () => ({
  getCurrentAppUser: mockGetCurrentAppUser,
}))

vi.mock("@/lib/db/job-applications", () => ({
  getJobApplicationsForUser: mockGetJobApplicationsForUser,
}))

vi.mock("@/lib/asaas/quota", () => ({
  getUserBillingInfo: mockGetUserBillingInfo,
}))

vi.mock("./actions", () => ({
  createJobApplicationAction: vi.fn(),
  updateJobApplicationDetailsAction: vi.fn(),
  updateJobApplicationStatusAction: vi.fn(),
  deleteJobApplicationAction: vi.fn(),
}))

vi.mock("@/components/dashboard/job-applications-tracker", () => ({
  JobApplicationsTracker: ({
    applications,
    locked,
  }: {
    applications: Array<{ id: string; appliedAt: string }>
    locked?: boolean
  }) => (
    <div
      data-testid="job-applications-tracker"
      data-count={applications.length}
      data-first-id={applications[0]?.id ?? ""}
      data-first-applied-at={applications[0]?.appliedAt ?? ""}
      data-locked={locked ? "true" : "false"}
    />
  ),
}))

describe("ResumesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserBillingInfo.mockResolvedValue({ plan: "monthly" })
  })

  it("exports the route as force-dynamic with no revalidation", () => {
    expect(dynamic).toBe("force-dynamic")
    expect(revalidate).toBe(0)
  })

  it("returns null when there is no authenticated app user", async () => {
    mockGetCurrentAppUser.mockResolvedValue(null)

    const jsx = await ResumesPage()

    expect(jsx).toBeNull()
    expect(mockGetJobApplicationsForUser).not.toHaveBeenCalled()
  })

  it("loads the current user's applications and serializes dates for the tracker", async () => {
    mockGetCurrentAppUser.mockResolvedValue({ id: "usr_123" })
    mockGetJobApplicationsForUser.mockResolvedValue([
      {
        id: "app_123",
        userId: "usr_123",
        role: "Frontend Engineer",
        company: "Fintech Corp",
        status: "aguardando",
        salary: "R$ 12.000,00",
        location: "Remote",
        benefits: [],
        resumeVersionLabel: "curriculo_v1.pdf",
        jobDescription: "Build dashboards",
        notes: "Priority",
        appliedAt: new Date("2026-04-01T12:00:00.000Z"),
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        updatedAt: new Date("2026-04-02T12:00:00.000Z"),
      },
    ])

    const jsx = await ResumesPage()
    render(jsx)

    expect(mockGetJobApplicationsForUser).toHaveBeenCalledWith("usr_123")
    expect(screen.getByTestId("job-applications-tracker")).toHaveAttribute("data-count", "1")
    expect(screen.getByTestId("job-applications-tracker")).toHaveAttribute("data-first-id", "app_123")
    expect(screen.getByTestId("job-applications-tracker")).toHaveAttribute(
      "data-first-applied-at",
      "2026-04-01T12:00:00.000Z",
    )
    expect(screen.getByTestId("job-applications-tracker")).toHaveAttribute("data-locked", "false")
  })

  it("locks the tracker when the user is on free access", async () => {
    mockGetCurrentAppUser.mockResolvedValue({ id: "usr_123" })
    mockGetJobApplicationsForUser.mockResolvedValue([])
    mockGetUserBillingInfo.mockResolvedValue(null)

    const jsx = await ResumesPage()
    render(jsx)

    expect(screen.getByTestId("job-applications-tracker")).toHaveAttribute("data-locked", "true")
  })
})
