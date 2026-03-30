"use client"

import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1 md:flex">
            <Link
              href="/#how-it-works"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Como funciona
            </Link>
            <Link
              href="/#pricing"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Precos
            </Link>
          </nav>
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

          <SignedOut>
            <Button asChild variant="ghost" className="hidden rounded-full px-5 sm:flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="rounded-full px-5 shadow-lg shadow-primary/15">
              <Link href="/signup">Criar conta</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Button asChild variant="ghost" className="hidden rounded-full px-5 sm:flex">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
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
