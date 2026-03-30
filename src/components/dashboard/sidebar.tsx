"use client"

import { useClerk } from "@clerk/nextjs"
import { FileText, HelpCircle, LogOut, MessageSquare, Settings, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  {
    label: "Chat",
    href: "/dashboard",
    icon: MessageSquare,
  },
  {
    label: "Meus curriculos",
    href: "/resumes",
    icon: FileText,
  },
  {
    label: "O que e ATS?",
    href: "/what-is-ats",
    icon: HelpCircle,
  },
]

const bottomItems = [
  {
    label: "Configuracoes",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 border-r border-border/60 bg-sidebar/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="space-y-1">
            <Logo linkTo="/dashboard" size="sm" />
            <p className="text-xs text-sidebar-foreground/70">
              Layout Figma aplicado ao runtime real
            </p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-5">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-background/40",
                      isActive && "border-primary/20 bg-background",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/55 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Workspace state
            </p>
            <p className="mt-2 text-sm font-semibold text-sidebar-foreground">
              Sessao autenticada
            </p>
            <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
              Clerk, chat SSE, edicao canonica e cobranca permanecem intactos.
            </p>
          </div>

          <Separator className="my-6" />

          <nav className="space-y-2">
            {bottomItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/40">
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              )
            })}

            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </span>
              Sair
            </button>
          </nav>
        </ScrollArea>
      </div>
    </aside>
  )
}
