import "@testing-library/jest-dom"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FaqJsonLd } from "@/components/seo/faq-json-ld"

describe("FaqJsonLd", () => {
  it("renders a parseable FAQPage script", () => {
    const { container } = render(
      <FaqJsonLd
        items={[
          {
            question: "Devo incluir um link para o meu GitHub?",
            answer: "Sim, inclua GitHub e LinkedIn.",
          },
        ]}
      />,
    )

    const script = container.querySelector('script[type="application/ld+json"]')

    expect(script).toBeInTheDocument()

    const parsedSchema = JSON.parse(script?.innerHTML ?? "")

    expect(parsedSchema["@type"]).toBe("FAQPage")
    expect(parsedSchema.mainEntity[0].name).toBe(
      "Devo incluir um link para o meu GitHub?",
    )
    expect(script?.innerHTML).toContain("FAQPage")
  })

  it("does not render a script when there are no faq items", () => {
    const { container } = render(<FaqJsonLd items={[]} />)

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument()
  })
})
