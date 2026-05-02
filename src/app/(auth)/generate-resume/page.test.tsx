import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import GenerateResumePage from "./page"

const mockGetCurrentAppUser = vi.fn()
const mockLoadOptionalBillingInfo = vi.fn()
const mockCurrentUser = vi.fn()
const mockIsE2EAuthEnabled = vi.fn()

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => mockCurrentUser(),
}))

vi.mock("@/lib/auth/app-user", () => ({
  getCurrentAppUser: () => mockGetCurrentAppUser(),
}))

vi.mock("@/lib/auth/e2e-auth", () => ({
  isE2EAuthEnabled: () => mockIsE2EAuthEnabled(),
}))

vi.mock("@/lib/asaas/optional-billing-info", () => ({
  loadOptionalBillingInfo: (...args: unknown[]) => mockLoadOptionalBillingInfo(...args),
}))

vi.mock("@/lib/billing/ai-chat-access.server", () => ({
  getAiChatAccess: () => {
    throw new Error("generate resume must not load AI chat entitlement")
  },
}))

vi.mock("@/components/resume/user-data-page", () => ({
  default: ({
    activeRecurringPlan,
    currentCredits,
    currentAppUserId,
    initialView,
    showProfileGenerationCta,
    userImageUrl,
  }: {
    activeRecurringPlan: string | null
    currentCredits: number
    currentAppUserId: string | null
    initialView?: string
    showProfileGenerationCta?: boolean
    userImageUrl: string | null
  }) => (
    <div
      data-testid="user-data-page"
      data-active-recurring-plan={activeRecurringPlan ?? ""}
      data-current-credits={String(currentCredits)}
      data-current-app-user-id={currentAppUserId ?? ""}
      data-initial-view={initialView ?? ""}
      data-show-profile-generation-cta={String(showProfileGenerationCta)}
      data-user-image-url={userImageUrl ?? ""}
    />
  ),
}))

describe("GenerateResumePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsE2EAuthEnabled.mockReturnValue(false)
    mockCurrentUser.mockResolvedValue({
      imageUrl: "https://example.com/avatar.png",
    })
  })

  it("renders the generation surface directly without AI chat entitlement", async () => {
    mockGetCurrentAppUser.mockResolvedValue({
      id: "usr_123",
      creditAccount: {
        creditsRemaining: 7,
      },
    })
    mockLoadOptionalBillingInfo.mockResolvedValue({
      billingNotice: null,
      billingInfo: {
        plan: "monthly",
        hasActiveRecurringSubscription: true,
      },
    })

    const jsx = await GenerateResumePage()
    render(jsx)

    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-current-app-user-id", "usr_123")
    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-current-credits", "7")
    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-active-recurring-plan", "monthly")
    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-initial-view", "enhancement")
    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-show-profile-generation-cta", "false")
    expect(screen.getByTestId("user-data-page")).toHaveAttribute("data-user-image-url", "https://example.com/avatar.png")
    expect(mockLoadOptionalBillingInfo).toHaveBeenCalledWith("usr_123", "generate_resume")
  })
})
