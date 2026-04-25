import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { describe, expect, it, vi } from "vitest"

import PrecosPage from "./page"

vi.mock("@/components/brand-wordmark", () => ({
  default: () => <span>CurrIA</span>,
}))

vi.mock("@/components/landing/footer", () => ({
  default: () => <footer>Footer</footer>,
}))

vi.mock("@/components/landing/header", () => ({
  default: () => <header>Header</header>,
}))

vi.mock("@/components/landing/floating-decorations", () => ({
  FloatingDecorations: () => <div>Decorations</div>,
}))

vi.mock("@/components/landing/pricing-comparison-table", () => ({
  default: () => <div data-testid="pricing-comparison-table-component">Comparison Table</div>,
}))

vi.mock("@/components/pricing/pricing-cards", () => ({
  default: () => <div data-testid="pricing-cards-component">Pricing Cards</div>,
}))

describe("PrecosPage", () => {
  it("keeps only the pricing cards visible on mobile and hides the comparison section there", () => {
    render(<PrecosPage />)

    expect(screen.getByTestId("pricing-cards-component")).toBeInTheDocument()
    expect(screen.getByTestId("pricing-comparison-table-component")).toBeInTheDocument()
    expect(screen.getByTestId("pricing-comparison-link")).toHaveClass("hidden")
    expect(screen.getByTestId("pricing-comparison-link")).toHaveClass("md:flex")
    expect(screen.getByTestId("pricing-comparison-section")).toHaveClass("hidden")
    expect(screen.getByTestId("pricing-comparison-section")).toHaveClass("md:block")
  })
})
