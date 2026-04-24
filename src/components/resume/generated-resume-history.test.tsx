import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { mockGeneratedResumeHistory } from "@/lib/generated-resume-mock"

import { GeneratedResumeHistory } from "./generated-resume-history"

describe("GeneratedResumeHistory", () => {
  it("renders the mocked history grid and paginates through the second page", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(
      <GeneratedResumeHistory
        resumes={mockGeneratedResumeHistory}
        onBack={onBack}
        onDownloadPdf={vi.fn()}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Currículos gerados" })).toBeInTheDocument()
    expect(screen.getByText("Currículo ATS - Designer de Produto")).toBeInTheDocument()
    expect(screen.queryByText("Currículo alvo - Engenharia de Analytics")).not.toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "2" }))

    expect(screen.getByText("Currículo alvo - Engenharia de Analytics")).toBeInTheDocument()
    expect(screen.queryByText("Currículo ATS - Designer de Produto")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Voltar ao perfil" })).toBeInTheDocument()
  })

  it("shows the empty state when there are no generated resumes", () => {
    const onBack = vi.fn()

    render(<GeneratedResumeHistory resumes={[]} onBack={onBack} />)

    expect(screen.getByText("Nenhum currículo ainda")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ir para o perfil" })).toBeInTheDocument()
  })

  it("surfaces the error state and allows retry", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <GeneratedResumeHistory
        resumes={mockGeneratedResumeHistory}
        error="Falha mockada ao carregar o histórico."
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText("Não foi possível carregar o histórico")).toBeInTheDocument()
    expect(screen.getByText("Falha mockada ao carregar o histórico.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
