import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import SignupForm from "./signup-form"
import { buildDefaultCheckoutOnboardingPath } from "@/lib/billing/checkout-navigation"

const {
  mockSearchParamsGet,
  mockNavigateToUrl,
  mockIsLoaded,
  mockIsSignedIn,
  mockSignUpCreate,
  mockSignUpAuthenticateWithRedirect,
  mockPrepareEmailAddressVerification,
  mockAttemptEmailAddressVerification,
  mockValidatePassword,
  mockSetActive,
} = vi.hoisted(() => ({
  mockSearchParamsGet: vi.fn(),
  mockNavigateToUrl: vi.fn(),
  mockIsLoaded: vi.fn(),
  mockIsSignedIn: vi.fn(),
  mockSignUpCreate: vi.fn(),
  mockSignUpAuthenticateWithRedirect: vi.fn(),
  mockPrepareEmailAddressVerification: vi.fn(),
  mockAttemptEmailAddressVerification: vi.fn(),
  mockValidatePassword: vi.fn(),
  mockSetActive: vi.fn(),
}))

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: mockIsLoaded(),
    isSignedIn: mockIsSignedIn(),
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: mockSignUpCreate,
      authenticateWithRedirect: mockSignUpAuthenticateWithRedirect,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
      attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
      validatePassword: mockValidatePassword,
    },
    setActive: mockSetActive,
  }),
  useClerk: () => ({
    client: {
      passwordSettings: {
        min_length: 8,
        require_special_char: true,
      },
    },
  }),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}))

vi.mock("@/lib/navigation/external", () => ({
  navigateToUrl: mockNavigateToUrl,
}))

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
    mockIsLoaded.mockReturnValue(true)
    mockIsSignedIn.mockReturnValue(false)
    mockSignUpCreate.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_signup",
    })
    mockSignUpAuthenticateWithRedirect.mockResolvedValue(undefined)
    mockPrepareEmailAddressVerification.mockResolvedValue(undefined)
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_verified",
    })
    mockValidatePassword.mockImplementation(
      (password: string, callbacks?: { onValidation?: (value: { complexity?: Record<string, boolean> }) => void }) => {
        callbacks?.onValidation?.({
          complexity: {
            min_length: password.length < 8,
            require_special_char: !/[^A-Za-z0-9]/.test(password),
          },
        })
      },
    )
    mockSetActive.mockResolvedValue(undefined)
  })

  it("renders the custom signup fields", () => {
    render(<SignupForm />)

    expect(screen.getByLabelText("Primeiro nome")).toBeInTheDocument()
    expect(screen.getByLabelText("Sobrenome")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    expect(screen.getByLabelText("Senha")).toBeInTheDocument()
    expect(screen.getByText("Minimo de 8 caracteres")).toBeInTheDocument()
    expect(screen.getByText("Pelo menos 1 caractere especial")).toBeInTheDocument()
  })

  it("submits signup data and redirects to onboarding by default", async () => {
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText("Primeiro nome"), "Ana")
    await user.type(screen.getByLabelText("Sobrenome"), "Teste")
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "super-secret")
    await user.click(screen.getByRole("button", { name: /^Continuar$/i }))

    await waitFor(() => {
      expect(mockSignUpCreate).toHaveBeenCalledWith({
        firstName: "Ana",
        lastName: "Teste",
        emailAddress: "ana@example.com",
        password: "super-secret",
      })
    })

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_signup" })
      expect(mockNavigateToUrl).toHaveBeenCalledWith(buildDefaultCheckoutOnboardingPath())
    })
  })

  it("redirects authenticated visitors away from signup using the requested path", async () => {
    mockIsSignedIn.mockReturnValue(true)
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "redirect_to" ? "/pricing?checkoutPlan=pro" : null,
    )

    render(<SignupForm />)

    await waitFor(() => {
      expect(mockNavigateToUrl).toHaveBeenCalledWith("/pricing?checkoutPlan=pro")
    })
  })

  it("shows the email verification step when Clerk requires verification", async () => {
    const user = userEvent.setup()
    mockSignUpCreate.mockResolvedValue({
      status: "missing_requirements",
      createdSessionId: null,
    })

    render(<SignupForm />)

    await user.type(screen.getByLabelText("Primeiro nome"), "Ana")
    await user.type(screen.getByLabelText("Sobrenome"), "Teste")
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "super-secret")
    await user.click(screen.getByRole("button", { name: /^Continuar$/i }))

    await waitFor(() => {
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: "email_code",
      })
    })

    expect(screen.getByLabelText("Codigo")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Verificar" })).toBeInTheDocument()
  })
})
