import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { describe, expect, it, vi } from "vitest"

import PricingHybridShowcase from "./pricing-hybrid-showcase"

vi.mock("./pricing-cards", () => ({
  default: ({ variant }: { variant?: string }) => (
    <div data-testid="pricing-cards-mock" data-variant={variant} />
  ),
}))

vi.mock("@/components/landing/pricing-comparison-table", () => ({
  default: ({ variant }: { variant?: string }) => (
    <div data-testid="pricing-comparison-table-mock" data-variant={variant} />
  ),
}))

vi.mock("@/components/brand-wordmark", () => ({
  default: () => <span>CurrIA</span>,
}))

describe("PricingHybridShowcase", () => {
  it("renders compact cards first and points the user to the detailed comparison below", () => {
    render(<PricingHybridShowcase />)

    expect(screen.getByTestId("pricing-cards-mock")).toHaveAttribute("data-variant", "overview")
    expect(screen.getByTestId("pricing-comparison-table-mock")).toHaveAttribute("data-variant", "embedded")
    expect(screen.getByRole("link", { name: /continue para os detalhes/i })).toHaveAttribute("href", "#pricing-comparison-details")
    expect(screen.getByText(/sem perder o contexto de cada plano/i)).toBeInTheDocument()
  })
})
