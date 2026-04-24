import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ChatPage, { dynamic, revalidate } from "./page"

const mockCurrentUser = vi.fn().mockResolvedValue({
  fullName: "Fabio Kroker",
  firstName: "Fabio",
  username: "fabiok",
})

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => mockCurrentUser(),
}))

vi.mock("@/lib/auth/app-user", () => ({
  getCurrentAppUser: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/asaas/optional-billing-info", () => ({
  loadOptionalBillingInfo: vi.fn().mockResolvedValue({ billingInfo: null }),
}))

vi.mock("@/lib/auth/e2e-auth", () => ({
  isE2EAuthEnabled: vi.fn(() => false),
}))

vi.mock("@/components/dashboard/resume-workspace", () => ({
  ResumeWorkspace: ({
    initialSessionId,
    userName,
    activeRecurringPlan,
    currentCredits,
  }: {
    initialSessionId?: string
    userName?: string
    activeRecurringPlan?: string | null
    currentCredits?: number
  }) => (
    <div
      data-testid="resume-workspace"
      data-session-id={initialSessionId ?? ""}
      data-user-name={userName ?? ""}
      data-plan={activeRecurringPlan ?? ""}
      data-credits={currentCredits ?? 0}
    />
  ),
}))

describe("ChatPage", () => {
  it("exports the chat page as force-dynamic with no revalidation", () => {
    expect(dynamic).toBe("force-dynamic")
    expect(revalidate).toBe(0)
  })

  it("renders safely without a session query param", async () => {
    const jsx = await ChatPage({})
    render(jsx)

    const workspace = screen.getByTestId("resume-workspace")
    expect(workspace).toHaveAttribute("data-session-id", "")
    expect(workspace).toHaveAttribute("data-user-name", "Fabio")
    expect(workspace).toHaveAttribute("data-credits", "0")
  })

  it("passes through a valid-looking session id without server-side resolution", async () => {
    const jsx = await ChatPage({
      searchParams: {
        session: "sess_valid_123",
      },
    })
    render(jsx)

    expect(screen.getByTestId("resume-workspace")).toHaveAttribute("data-session-id", "sess_valid_123")
  })

  it("does not crash on an invalid-looking session id", async () => {
    const jsx = await ChatPage({
      searchParams: {
        session: "not-a-real-session",
      },
    })
    render(jsx)

    expect(screen.getByTestId("resume-workspace")).toHaveAttribute("data-session-id", "not-a-real-session")
  })

  it("normalizes repeated session params to the first value", async () => {
    const jsx = await ChatPage({
      searchParams: {
        session: ["sess_first", "sess_second"],
      },
    })
    render(jsx)

    expect(screen.getByTestId("resume-workspace")).toHaveAttribute("data-session-id", "sess_first")
  })
})
