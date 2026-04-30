import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getBillingSummary, getResumeComparison } from "@/lib/dashboard/workspace-client"

import { ResumeComparisonPage } from "./resume-comparison-page"

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("@/lib/dashboard/workspace-client", () => ({
  getBillingSummary: vi.fn(),
  getResumeComparison: vi.fn(),
}))

vi.mock("@/components/resume/resume-comparison-view", () => ({
  ResumeComparisonView: ({
    sessionId,
    creditsRemaining,
    maxCredits,
  }: {
    sessionId: string
    creditsRemaining?: number
    maxCredits?: number
  }) => (
    <div
      data-testid="mock-comparison-view"
      data-session-id={sessionId}
      data-credits={creditsRemaining ?? ""}
      data-max-credits={maxCredits ?? ""}
    />
  ),
}))

const mockGetBillingSummary = vi.mocked(getBillingSummary)
const mockGetResumeComparison = vi.mocked(getResumeComparison)

function buildComparisonResponse() {
  return {
    sessionId: "sess_compare",
    generationType: "JOB_TARGETING" as const,
    targetJobDescription: "Analista de Dados",
    originalCvState: {
      fullName: "Ana Silva",
      email: "ana@example.com",
      phone: "",
      linkedin: "",
      location: "Curitiba",
      summary: "Resumo original",
      experience: [],
      skills: [],
      education: [],
      certifications: [],
    },
    optimizedCvState: {
      fullName: "Ana Silva",
      email: "ana@example.com",
      phone: "",
      linkedin: "",
      location: "Curitiba",
      summary: "Resumo otimizado",
      experience: [],
      skills: [],
      education: [],
      certifications: [],
    },
  }
}

describe("ResumeComparisonPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetResumeComparison.mockResolvedValue(buildComparisonResponse())
    mockGetBillingSummary.mockResolvedValue({
      currentCredits: 5,
      maxCredits: 12,
      currentPlan: "monthly",
      activeRecurringPlan: "monthly",
      billingNotice: null,
    })
  })

  it("passes available credits to the comparison header", async () => {
    render(<ResumeComparisonPage sessionId="sess_compare" />)

    await waitFor(() => {
      expect(screen.getByTestId("mock-comparison-view")).toBeInTheDocument()
    })

    expect(mockGetResumeComparison).toHaveBeenCalledWith("sess_compare")
    expect(mockGetBillingSummary).toHaveBeenCalled()
    expect(screen.getByTestId("mock-comparison-view")).toHaveAttribute("data-credits", "5")
    expect(screen.getByTestId("mock-comparison-view")).toHaveAttribute("data-max-credits", "12")
  })

  it("keeps the comparison usable when the billing summary is unavailable", async () => {
    mockGetBillingSummary.mockRejectedValue(new Error("billing unavailable"))

    render(<ResumeComparisonPage sessionId="sess_compare" />)

    await waitFor(() => {
      expect(screen.getByTestId("mock-comparison-view")).toBeInTheDocument()
    })

    expect(screen.getByTestId("mock-comparison-view")).toHaveAttribute("data-credits", "")
    expect(screen.getByTestId("mock-comparison-view")).toHaveAttribute("data-max-credits", "")
  })
})
