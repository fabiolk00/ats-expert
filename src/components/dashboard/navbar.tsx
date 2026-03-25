"use client"

import { useTheme } from "next-themes"
import { SignedIn, UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import Logo from "@/components/logo"
import { Moon, Sun } from "lucide-react"

export default function DashboardNavbar() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo linkTo="/dashboard" />
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
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
                  avatarBox: 'h-9 w-9',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
