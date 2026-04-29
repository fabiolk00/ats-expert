import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { describe, expect, it } from "vitest"

import { TargetRecommendationsCard } from "./target-recommendations-card"
import type { TargetRecommendation } from "@/types/agent"

function recommendation(id: string, jobRequirement: string): TargetRecommendation {
  return {
    id,
    kind: "adjacent_skill",
    priority: "high",
    jobRequirement,
    currentEvidence: ["Power BI", "dashboards"],
    suggestedUserAction: `Seu currículo já mostra Power BI e dashboards. Se você usa ${jobRequirement}, deixe isso explícito em uma experiência prática.`,
    safeExample: `Se for verdadeiro: cite uma entrega real usando ${jobRequirement}.`,
    mustNotInvent: true,
    relatedResumeSection: "skills",
    relatedEvidenceLevel: "adjacent",
  }
}

describe("TargetRecommendationsCard", () => {
  it("renders the heading, top 3 recommendations, and safety badge", () => {
    render(
      <TargetRecommendationsCard
        recommendations={[
          recommendation("rec-1", "DAX"),
          recommendation("rec-2", "Comunicação com áreas de negócio"),
          recommendation("rec-3", "Power Query"),
          recommendation("rec-4", "APIs"),
        ]}
      />,
    )

    expect(screen.getByText("Sugestões para melhorar sua aderência")).toBeInTheDocument()
    expect(screen.getByText("Só se for verdadeiro")).toBeInTheDocument()
    expect(screen.getByText("Revise lacunas da vaga que ainda não aparecem claramente no currículo.")).toBeInTheDocument()
    expect(screen.getAllByTestId("target-recommendation-item")).toHaveLength(3)
    expect(screen.getByText("DAX")).toBeInTheDocument()
    expect(screen.queryByText("APIs")).not.toBeInTheDocument()
  })

  it("expands to show all recommendations", async () => {
    const user = userEvent.setup()

    render(
      <TargetRecommendationsCard
        recommendations={[
          recommendation("rec-1", "DAX"),
          recommendation("rec-2", "Comunicação com áreas de negócio"),
          recommendation("rec-3", "Power Query"),
          recommendation("rec-4", "APIs"),
        ]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Ver todas" }))

    expect(screen.getAllByTestId("target-recommendation-item")).toHaveLength(4)
    expect(screen.getByText("APIs")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mostrar menos" })).toBeInTheDocument()
  })
})
