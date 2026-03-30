import Link from "next/link"

import Logo from "@/components/logo"

const links = [
  { label: "Precos", href: "/#pricing" },
  { label: "Entrar", href: "/login" },
  { label: "Criar conta", href: "/signup" },
] as const

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo size="sm" />

          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-sm text-muted-foreground">CurrIA © {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
