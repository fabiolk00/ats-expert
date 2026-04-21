import { describe, expect, it } from "vitest"

import type { CVState } from "@/types/cv"

import {
  buildOptimizedPreviewHighlights,
  buildRelevantHighlightLine,
  normalizePreviewSummaryText,
} from "./optimized-preview-highlights"

function buildCvState(input: Partial<CVState>): CVState {
  return {
    fullName: "Fabio Kroker",
    email: "fabio@example.com",
    phone: "555-0100",
    linkedin: "linkedin.com/in/fabiokroker",
    location: "Curitiba, Parana, Brazil",
    summary: "",
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    ...input,
  }
}

describe("optimized preview highlights", () => {
  it("does not highlight minor punctuation-only changes", () => {
    const result = buildRelevantHighlightLine(
      "Engenheiro de dados com foco em BI",
      "Engenheiro de dados com foco em BI.",
    )

    expect(result.segments.some((segment) => segment.highlighted)).toBe(false)
  })

  it("never applies semantic highlight markup to summary", () => {
    const result = buildRelevantHighlightLine(
      "Consultor de Business Intelligence com entrega de dashboards.",
      "Atuacao em Senior Business Intelligence com dashboards estrategicos.",
      "summary",
    )

    expect(result.highlightWholeLine).toBe(false)
    expect(result.segments.some((segment) => segment.highlighted)).toBe(false)
  })

  it("normalizes structured summary payloads to plain human-readable text", () => {
    expect(
      normalizePreviewSummaryText('{"section":"summary","profile":"Profissional de Business Intelligence e Engenharia de Dados."}'),
    ).toBe("Profissional de Business Intelligence e Engenharia de Dados.")
  })

  it("extracts summary text from malformed serialized payloads", () => {
    expect(
      normalizePreviewSummaryText('{"section":"summary","profile":"Profissional de BI com foco em SQL e ETL"'),
    ).toBe("Profissional de BI com foco em SQL e ETL")
  })

  it("does not highlight isolated skill-only tokens in experience", () => {
    const result = buildRelevantHighlightLine(
      "Experiencia com dashboards corporativos.",
      "Experiencia com dashboards corporativos, SQL.",
      "experience",
    )

    expect(result.segments.some((segment) => segment.highlighted && segment.text.includes("SQL"))).toBe(false)
  })

  it("highlights compact metric spans in experience bullets", () => {
    const bullet =
      "Liderei a reestruturacao da governanca analitica em escopo LATAM, reduzindo em 32% o tempo de publicacao de dashboards."
    const result = buildRelevantHighlightLine(
      "Criei dashboards e acompanhei indicadores da operacao.",
      bullet,
      "experience",
    )

    const highlightedSegments = result.segments.filter((segment) => segment.highlighted)
    const highlightedCharacters = highlightedSegments.reduce((total, segment) => total + segment.text.trim().length, 0)

    expect(result.highlightWholeLine).toBe(false)
    expect(highlightedSegments.length).toBeLessThanOrEqual(1)
    expect(highlightedSegments.length).toBeGreaterThan(0)
    expect(highlightedCharacters / bullet.length).toBeLessThan(0.3)
  })

  it("allows ATS-relevant skill clusters inside meaningful highlighted spans", () => {
    const result = buildRelevantHighlightLine(
      "Atuei com relatorios internos e rotina de acompanhamento.",
      "Estruturei ETL, SQL e Power BI para governanca analitica.",
      "experience",
    )

    const highlightedSegments = result.segments.filter((segment) => segment.highlighted)

    expect(highlightedSegments.length).toBeLessThanOrEqual(1)
    expect(highlightedSegments.some((segment) => segment.text.includes("ETL, SQL e Power BI"))).toBe(true)
  })

  it("caps highlighted bullets per experience entry", () => {
    const original = buildCvState({
      experience: [
        {
          title: "Senior Business Intelligence",
          company: "Grupo Positivo",
          location: "Curitiba",
          startDate: "01/2025",
          endDate: "04/2026",
          bullets: [
            "Criei dashboards para a operacao.",
            "Monitorei indicadores da area.",
            "Apoiei analises pontuais para o time.",
          ],
        },
      ],
    })
    const optimized = buildCvState({
      experience: [
        {
          title: "Senior Business Intelligence",
          company: "Grupo Positivo",
          location: "Curitiba",
          startDate: "01/2025",
          endDate: "04/2026",
          bullets: [
            "Liderei ETL, SQL e Power BI para governanca analitica.",
            "Contribui para aumento de 15% nos indicadores em escopo LATAM.",
            "Apoiei iniciativas de BI para o time.",
          ],
        },
      ],
    })

    const result = buildOptimizedPreviewHighlights(original, optimized)
    const highlightedBullets = result.experience[0]?.bullets.filter((bullet) =>
      bullet.segments.some((segment) => segment.highlighted),
    ) ?? []

    expect(highlightedBullets.length).toBeLessThanOrEqual(2)
  })
})
