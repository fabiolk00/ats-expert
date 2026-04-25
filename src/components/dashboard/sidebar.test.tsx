import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DashboardSidebar } from "./sidebar"
import { NEW_CONVERSATION_EVENT } from "./events"
import { AI_CHAT_UPGRADE_URL } from "@/lib/billing/ai-chat-access"

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockCloseMobile = vi.fn()
const mockSignOut = vi.fn()
const mockUseIsMobile = vi.fn(() => false)
const mockUsePathname = vi.fn(() => "/profile-setup")

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    signOut: mockSignOut,
  }),
  useUser: () => ({
    user: null,
  }),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock("@/context/sidebar-context", () => ({
  useSidebarContext: () => ({
    isMounted: true,
    isMobileOpen: false,
    closeMobile: mockCloseMobile,
  }),
}))

vi.mock("@/components/dashboard/session-documents-panel", () => ({
  SessionDocumentsPanel: ({ isSidebarOpen }: { isSidebarOpen: boolean }) => (
    <div data-testid="session-documents-panel" data-open={String(isSidebarOpen)} />
  ),
}))

vi.mock("@/components/dashboard/plan-update-dialog", () => ({
  PlanUpdateDialog: () => null,
}))

vi.mock("@/components/logo", () => ({
  default: () => <div>Logo</div>,
}))

describe("DashboardSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
    mockUsePathname.mockReturnValue("/profile-setup")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ profile: null }), {
          status: 200,
        })) as unknown as typeof fetch,
    )
  })

  it("keeps the desktop sidebar collapsed with Curriculos before Nova conversa", async () => {
    render(<DashboardSidebar canAccessAiChat />)

    const profileLink = screen.getByRole("link", { name: "Perfil" })
    const sessionsLink = screen.getByRole("link", { name: "Sessões" })
    const resumesLink = screen.getByRole("link", { name: "Currículos" })
    const newConversationButton = screen.getByRole("button", { name: "Nova conversa" })
    const accountButton = screen.getByRole("button", { name: "Abrir menu da conta" })

    expect(profileLink).toHaveAttribute("href", "/profile-setup")
    expect(sessionsLink).toHaveAttribute("href", "/dashboard/sessions")
    expect(resumesLink).toHaveAttribute("href", "/dashboard/resumes-history")
    expect(newConversationButton).toHaveClass(
      "h-10",
      "w-10",
      "justify-center",
      "hover:bg-sidebar-accent/50",
      "hover:text-sidebar-foreground",
    )
    expect(accountButton).toHaveClass(
      "h-10",
      "w-10",
      "justify-center",
      "rounded-lg",
    )
    expect(
      resumesLink.compareDocumentPosition(newConversationButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(screen.queryByLabelText("Expandir sidebar")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Recolher sidebar")).not.toBeInTheDocument()
    expect(screen.getByTestId("session-documents-panel")).toHaveAttribute("data-open", "false")
  })

  it("opens the existing account dropdown on avatar click in collapsed desktop mode", async () => {
    const user = userEvent.setup()

    render(<DashboardSidebar canAccessAiChat />)

    await user.click(screen.getByRole("button", { name: "Abrir menu da conta" }))

    expect(await screen.findByText("Sair")).toBeInTheDocument()
    expect(screen.getByText("Ver planos")).toBeInTheDocument()
  })

  it("dispatches the real new conversation event and routes back to chat", async () => {
    const user = userEvent.setup()
    const onNewConversation = vi.fn()
    window.addEventListener(NEW_CONVERSATION_EVENT, onNewConversation)

    render(<DashboardSidebar canAccessAiChat />)

    await user.click(screen.getByRole("button", { name: "Nova conversa" }))

    expect(mockReplace).toHaveBeenCalledWith("/chat")
    expect(onNewConversation).toHaveBeenCalledTimes(1)

    window.removeEventListener(NEW_CONVERSATION_EVENT, onNewConversation)
  })

  it("hides the sessions nav item and routes non-Pro users to upgrade when they click Nova conversa", async () => {
    const user = userEvent.setup()
    const onNewConversation = vi.fn()
    window.addEventListener(NEW_CONVERSATION_EVENT, onNewConversation)

    render(<DashboardSidebar canAccessAiChat={false} />)

    expect(screen.queryByRole("link", { name: "SessÃµes" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Nova conversa" }))

    expect(mockPush).toHaveBeenCalledWith(AI_CHAT_UPGRADE_URL)
    expect(mockReplace).not.toHaveBeenCalled()
    expect(onNewConversation).not.toHaveBeenCalled()

    window.removeEventListener(NEW_CONVERSATION_EVENT, onNewConversation)
  })
})
