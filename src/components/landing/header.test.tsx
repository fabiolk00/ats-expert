import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Header from "./header"

const {
  mockIsLoaded,
  mockIsSignedIn,
} = vi.hoisted(() => ({
  mockIsLoaded: vi.fn(),
  mockIsSignedIn: vi.fn(),
}))

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: mockIsLoaded(),
    isSignedIn: mockIsSignedIn(),
  }),
  UserButton: () => <div>Perfil</div>,
}))

vi.mock("@/components/logo", () => ({
  default: () => <div>Logo</div>,
}))

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoaded.mockReturnValue(true)
    mockIsSignedIn.mockReturnValue(false)
  })

  it("shows login and signup actions while Clerk is still loading", () => {
    mockIsLoaded.mockReturnValue(false)

    render(<Header />)

    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Criar conta" })).toHaveLength(2)
    expect(screen.getByTestId("mobile-signup-link")).toBeInTheDocument()
  })

  it("shows the user menu once Clerk is loaded and the user is signed in", () => {
    mockIsSignedIn.mockReturnValue(true)

    render(<Header />)

    expect(screen.getByText("Perfil")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument()
  })

  it("renders the main navigation in the expected sequence", () => {
    render(<Header />)

    const atsLink = screen.getByRole("link", { name: "O que é ATS?" })
    const areasTrigger = screen.getByText("Currículos por área")
    const pricingLink = screen.getByRole("link", { name: "Preços" })

    expect(atsLink.compareDocumentPosition(areasTrigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(areasTrigger.compareDocumentPosition(pricingLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
