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

vi.mock("@/components/landing/pricing-comparison-table", () => ({
  default: () => <div data-testid="pricing-comparison-table-component">Comparison Table</div>,
}))

vi.mock("@/components/pricing/pricing-cards", () => ({
  default: () => <div data-testid="pricing-cards-component">Pricing Cards</div>,
}))

describe("PrecosPage", () => {
  it("keeps the normal cards layout and exposes a scroll cue to the comparison table", () => {
    render(<PrecosPage />)

    expect(screen.getByTestId("pricing-cards-component")).toBeInTheDocument()
    expect(screen.getByTestId("pricing-comparison-table-component")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver comparação completa/i })).toHaveAttribute("href", "#pricing-comparison-table")
    expect(screen.getByText(/desça para comparar todos os recursos lado a lado/i)).toBeInTheDocument()
  })
})
