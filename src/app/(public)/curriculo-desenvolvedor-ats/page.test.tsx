import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import CurriculoDesenvolvedorAtsPage from "./page"

vi.mock("@/components/landing/header", () => ({
  default: () => <div data-testid="landing-header" />,
}))

vi.mock("@/components/landing/footer", () => ({
  default: () => <div data-testid="landing-footer" />,
}))

describe("/curriculo-desenvolvedor-ats page", () => {
  it("renders the visible FAQ once and includes matching FAQPage JSON-LD", () => {
    const { container } = render(<CurriculoDesenvolvedorAtsPage />)

    expect(
      screen.getAllByRole("heading", { name: "Perguntas Frequentes" }),
    ).toHaveLength(1)

    expect(
      screen.getByRole("button", {
        name: "Devo incluir um link para o meu GitHub?",
      }),
    ).toBeInTheDocument()

    const scripts = container.querySelectorAll('script[type="application/ld+json"]')

    expect(scripts).toHaveLength(1)

    const parsedSchema = JSON.parse(scripts[0]?.innerHTML ?? "")

    expect(parsedSchema["@type"]).toBe("FAQPage")
    expect(parsedSchema.mainEntity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Devo incluir um link para o meu GitHub?",
        }),
      ]),
    )
  })
})
