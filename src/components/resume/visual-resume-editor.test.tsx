import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { VisualResumeEditor } from "./visual-resume-editor"

describe("VisualResumeEditor", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("animates section loading in sequence starting from resumo profissional", () => {
    vi.useFakeTimers()

    render(
      <VisualResumeEditor
        value={{
          fullName: "",
          email: "",
          phone: "",
          linkedin: "",
          location: "",
          summary: "",
          experience: [],
          skills: [],
          education: [],
          certifications: [],
        }}
        onChange={vi.fn()}
        importProgressSource="linkedin"
      />,
    )

    expect(screen.getByText("Resumo profissional").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )
    expect(screen.getByText("Importando do LinkedIn")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("Resumo profissional").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "complete",
    )
    expect(screen.getByText("Experiência").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )
  })
})
