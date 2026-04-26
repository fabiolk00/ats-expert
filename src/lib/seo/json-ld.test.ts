import { describe, expect, it } from "vitest"

import { buildFaqPageJsonLd } from "@/lib/seo/json-ld"

describe("buildFaqPageJsonLd", () => {
  it("builds FAQPage schema from faq items", () => {
    const schema = buildFaqPageJsonLd([
      {
        question: "Devo incluir um link para o meu GitHub?",
        answer: "Sim, inclua GitHub e LinkedIn.",
      },
      {
        question: "O ATS lê trechos de código?",
        answer: "Não, prefira descrever impacto e arquitetura.",
      },
    ])

    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("FAQPage")
    expect(schema.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Devo incluir um link para o meu GitHub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim, inclua GitHub e LinkedIn.",
        },
      },
      {
        "@type": "Question",
        name: "O ATS lê trechos de código?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Não, prefira descrever impacto e arquitetura.",
        },
      },
    ])
  })
})
