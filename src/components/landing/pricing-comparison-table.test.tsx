import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { describe, expect, it } from "vitest"

import { PLANS, formatPrice } from "@/lib/plans"

import PricingComparisonTable from "./pricing-comparison-table"

describe("PricingComparisonTable", () => {
  it("renders Monthly and Pro using canonical plan values", () => {
    render(<PricingComparisonTable />)

    expect(screen.getByText(formatPrice(PLANS.monthly.price))).toBeInTheDocument()
    expect(screen.getByText(formatPrice(PLANS.pro.price))).toBeInTheDocument()
    expect(screen.getByText(String(PLANS.monthly.credits))).toBeInTheDocument()
    expect(screen.getByText(String(PLANS.pro.credits))).toBeInTheDocument()
    expect(screen.queryByText("R$ 69,90")).not.toBeInTheDocument()
  })

  it("supports an embedded variant without the standalone hero copy", () => {
    render(<PricingComparisonTable variant="embedded" />)

    expect(screen.getByTestId("pricing-comparison-table")).toHaveAttribute("data-variant", "embedded")
    expect(screen.queryByText("Escolha o plano ideal")).not.toBeInTheDocument()
    expect(screen.getByText(formatPrice(PLANS.monthly.price))).toBeInTheDocument()
  })
})
