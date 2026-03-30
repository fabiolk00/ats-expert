"use client"

import { SignedIn, UserButton } from "@clerk/nextjs"
import { Menu, Moon, Sun } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

interface DashboardNavbarProps {
  onMenuClick?: () => void
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/resumes")) {
    return {
      eyebrow: "Biblioteca",
      title: "Meus curriculos",
    }
  }

  if (pathname.startsWith("/what-is-ats")) {
    return {
      eyebrow: "Guia",
      title: "Entenda o ATS",
    }
  }

  return {
    eyebrow: "Workspace",
    title: "CurrIA Dashboard",
  }
}

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const pageMeta = getPageMeta(pathname)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-20 items-center justify-between px-4 lg:px-8">
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {pageMeta.eyebrow}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{pageMeta.title}</p>
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
                  avatarBox: "h-10 w-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
