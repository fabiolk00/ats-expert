import type { Metadata } from "next"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import BrandWordmark from "@/components/brand-wordmark"
import Footer from "@/components/landing/footer"
import { FloatingDecorations } from "@/components/landing/floating-decorations"
import Header from "@/components/landing/header"
import PricingComparisonTable from "@/components/landing/pricing-comparison-table"
import PricingCards from "@/components/pricing/pricing-cards"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Preços - CurrIA",
  description: "Escolha o plano ideal para otimizar seu currículo com IA",
  canonicalPath: "/precos",
})

export default function PrecosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <section className="relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-28">
          <FloatingDecorations />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.14),transparent_60%)]" />
          <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 bg-[radial-gradient(circle,oklch(var(--chart-2)/0.1),transparent_65%)] blur-3xl" />
          <div className="container relative mx-auto px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
              <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Escolha seu plano
              </div>
              <h1 className="mt-6 text-[clamp(2rem,7vw,3.75rem)] font-black tracking-tight">
                Preços <BrandWordmark />
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Escolha o plano ideal para suas necessidades
              </p>
            </div>

            <PricingCards />

            <div className="mt-8 flex justify-center text-center sm:mt-10">
              <Link
                href="#pricing-comparison-table"
                className="group inline-flex flex-col items-center gap-3 rounded-full px-5 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Ver comparação completa
                </span>
                <span className="max-w-xs text-sm text-muted-foreground">
                  Desça para comparar todos os recursos lado a lado.
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm transition-transform group-hover:translate-y-1">
                  <ChevronDown className="h-5 w-5 text-foreground" />
                </span>
              </Link>
            </div>

            <p className="mt-12 text-center text-sm font-medium text-muted-foreground">
              Análise gratuita disponível para todos, sem cadastro.
            </p>
          </div>
        </section>

        <div id="pricing-comparison-table" className="scroll-mt-24">
          <PricingComparisonTable />
        </div>
      </main>
      <Footer />
    </div>
  )
}
