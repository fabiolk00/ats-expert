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
      <main className="relative flex-1 overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.12),transparent_60%)]" />
        <div className="container relative mx-auto px-4">
          <h1 className="mb-4 text-center text-4xl font-bold">Planos</h1>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Escolha o plano ideal para suas necessidades
          </p>
          <PricingCards />
          <p className="mt-12 text-center text-muted-foreground">
            Analise gratuita disponivel para todos, sem cadastro.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
