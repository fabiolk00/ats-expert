import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

import { CHECKOUT_ERROR_MESSAGE } from "@/lib/asaas/checkout-errors"
import { PlanUpdateDialog } from "./plan-update-dialog"

const { mockNavigateToUrl, mockToastError, mockToastInfo, mockFetch } = vi.hoisted(() => ({
  mockNavigateToUrl: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock("@/lib/navigation/external", () => ({
  navigateToUrl: mockNavigateToUrl,
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    info: mockToastInfo,
  },
}))

describe("PlanUpdateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mockFetch)
  })

  it("renders pricing-style plan cards", () => {
    render(
      <PlanUpdateDialog
        isOpen
        onOpenChange={vi.fn()}
        activeRecurringPlan={null}
        currentCredits={4}
      />,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Atualização de plano")).toBeInTheDocument()
    expect(screen.getByText("Mais popular")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Selecionar" })).toHaveLength(3)
  })

  it("retries once after a transient checkout error before redirecting", async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: "https://sandbox.asaas.com/payment-link/retry-success" }),
      })

    render(
      <PlanUpdateDialog
        isOpen
        onOpenChange={vi.fn()}
        activeRecurringPlan={null}
        currentCredits={4}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockNavigateToUrl).toHaveBeenCalledWith("https://sandbox.asaas.com/payment-link/retry-success")
    })

    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("falls back to the shared checkout error when checkout keeps failing", async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Unexpected gateway response" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Unexpected gateway response" }),
      })

    render(
      <PlanUpdateDialog
        isOpen
        onOpenChange={vi.fn()}
        activeRecurringPlan={null}
        currentCredits={4}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[1])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockToastError).toHaveBeenCalledWith(CHECKOUT_ERROR_MESSAGE)
    })

    expect(mockNavigateToUrl).not.toHaveBeenCalled()
  })
})
