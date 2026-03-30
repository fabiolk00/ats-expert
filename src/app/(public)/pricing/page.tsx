import { Metadata } from "next"

import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"
import PricingCards from "@/components/pricing/pricing-cards"

export const metadata: Metadata = {
  title: "Planos - CurrIA",
  description: "Escolha o plano ideal para otimizar seu curriculo com IA",
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="relative flex-1 overflow-hidden py-20 md:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 bg-[radial-gradient(circle,oklch(var(--chart-2)/0.1),transparent_65%)] blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Escolha seu plano
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">Planos CurrIA</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>

          <PricingCards />

          <p className="mt-12 text-center text-sm font-medium text-muted-foreground">
            Analise gratuita disponivel para todos, sem cadastro.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
