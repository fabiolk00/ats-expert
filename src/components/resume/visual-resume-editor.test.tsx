import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { VisualResumeEditor } from "./visual-resume-editor"

describe("VisualResumeEditor", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("animates section loading in visual order without looping back to the first section", () => {
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

    expect(screen.getByText("Dados pessoais").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )
    expect(screen.getByText("Importando do LinkedIn")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("Dados pessoais").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "complete",
    )
    expect(screen.getByText("Resumo profissional").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("Skills").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )
    expect(screen.getByText("Experiência").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "idle",
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText("Certificações").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "loading",
    )
    expect(screen.getByText("Dados pessoais").closest("[data-loading-state]")).toHaveAttribute(
      "data-loading-state",
      "complete",
    )
  })

  it("closes all sections after the import flow finishes", () => {
    const { rerender } = render(
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
        importProgressSource="pdf"
      />,
    )

    rerender(
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
        importProgressSource={null}
      />,
    )

    expect(screen.getByText("Dados pessoais").closest("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Resumo profissional").closest("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Skills").closest("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Experiência").closest("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Educação").closest("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Certificações").closest("button")).toHaveAttribute("aria-expanded", "false")
  })
})
