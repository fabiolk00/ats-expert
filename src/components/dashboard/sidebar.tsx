"use client"

import { useClerk } from "@clerk/nextjs"
import { FileText, HelpCircle, LogOut, MessageSquare, Sparkles, Wallet, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
] as const

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside
      className={cn(
        "fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] w-72 border-r border-border/60 bg-background/85 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 lg:hidden">
          <span className="text-sm font-medium text-foreground">Menu</span>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-5">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-[0_24px_70px_-60px_oklch(var(--foreground)/0.9)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Area logada
              </p>
              <h2 className="mt-3 text-lg font-bold tracking-tight">Migre, compare e gere arquivos finais.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Todo o fluxo continua ligado ao backend atual, agora dentro da nova casca visual.
              </p>
            </div>

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
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-foreground/75 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="rounded-[1.75rem] border border-border/60 bg-muted/40 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Planos e creditos
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Veja opcoes pagas e acompanhe a evolucao do seu fluxo sem sair do dashboard.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link href="/pricing" onClick={onClose}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ver planos
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 p-4">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
