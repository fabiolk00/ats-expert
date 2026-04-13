import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { VisualResumeEditor, normalizeResumeData } from "./visual-resume-editor"

describe("VisualResumeEditor", () => {
  it("shows the primary manual setup fields on first render", () => {
    render(
      <VisualResumeEditor
        value={normalizeResumeData()}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Escreva um resumo curto sobre sua experiência, foco e resultados."),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Uma skill por linha/i)).toBeInTheDocument()
  })

  it("renders the editor sections in the requested order", () => {
    render(
      <VisualResumeEditor
        value={normalizeResumeData()}
        onChange={vi.fn()}
      />,
    )

    const personalHeading = screen.getByText("Dados pessoais")
    const summaryHeading = screen.getByText("Resumo profissional")
    const skillsHeading = screen.getByText("Skills")
    const experienceHeading = screen.getByText("Experiência")
    const educationHeading = screen.getByText("Educação")
    const certificationsHeading = screen.getByText("Certificações")

    expect(
      personalHeading.compareDocumentPosition(summaryHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      summaryHeading.compareDocumentPosition(skillsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      skillsHeading.compareDocumentPosition(experienceHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      experienceHeading.compareDocumentPosition(educationHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      educationHeading.compareDocumentPosition(certificationsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("lets the user type new skill lines and spaces without collapsing the textarea", async () => {
    const user = userEvent.setup()

    function TestHarness() {
      const [value, setValue] = useState(
        normalizeResumeData({
          skills: ["SQL"],
          experience: [],
          education: [],
          certifications: [],
        }),
      )

      return (
        <>
          <VisualResumeEditor value={value} onChange={setValue} />
          <output data-testid="skills-value">{JSON.stringify(value.skills)}</output>
        </>
      )
    }

    render(<TestHarness />)

    const skillsTextarea = screen.getByPlaceholderText(/Uma skill por linha/i)
    await user.click(skillsTextarea)
    await user.type(skillsTextarea, "{End}{Enter} Power BI")

    expect(skillsTextarea).toHaveValue("SQL\n Power BI")
    expect(screen.getByTestId("skills-value")).toHaveTextContent('["SQL","Power BI"]')
  })
})
