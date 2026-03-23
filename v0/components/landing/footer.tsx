import Logo from "@/components/logo"

export default function Footer() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo linkTo="/" />
        <p className="text-sm text-muted-foreground">
          CurrIA © 2025
        </p>
      </div>
    </footer>
  )
}
