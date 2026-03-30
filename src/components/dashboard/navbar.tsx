"use client"

import { SignedIn, UserButton } from "@clerk/nextjs"
import { Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

interface DashboardNavbarProps {
  pageTitle?: string
  onMenuClick?: () => void
}

export function DashboardNavbar({ pageTitle, onMenuClick }: DashboardNavbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/60 bg-background/70 lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="lg:hidden">
            <Logo linkTo="/dashboard" />
          </div>

          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Workspace
            </p>
            <p className="text-sm font-semibold text-foreground">
              {pageTitle ?? "CurrIA Dashboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/60 bg-background/70"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
