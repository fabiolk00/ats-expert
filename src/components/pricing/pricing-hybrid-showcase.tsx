import Link from "next/link"
import { ChevronDown, Sparkles } from "lucide-react"

import BrandWordmark from "@/components/brand-wordmark"
import PricingComparisonTable from "@/components/landing/pricing-comparison-table"
import { Badge } from "@/components/ui/badge"

import PricingCards from "./pricing-cards"

export default function PricingHybridShowcase() {
  return (
    <section className="relative py-20 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 bg-[radial-gradient(circle,oklch(var(--chart-2)/0.12),transparent_65%)] blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Escolha seu plano
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
            Preços <BrandWordmark />
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Veja os preços primeiro, depois desça para comparar todos os recursos sem perder o contexto de cada plano.
          </p>
        </div>

        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/95 shadow-[0_40px_120px_-60px_oklch(var(--foreground)/0.75)]">
          <div className="px-4 pb-0 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            <PricingCards variant="overview" />
          </div>

          <div className="relative flex justify-center px-6 pb-8 pt-8 text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-primary/5 to-background/90" />
            <Link
              href="#pricing-comparison-details"
              className="group relative z-10 inline-flex flex-col items-center gap-3 rounded-full px-5 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Continue para os detalhes
              </span>
              <span className="max-w-xs text-sm text-muted-foreground">
                Os preços acima continuam abaixo em formato de comparação completa.
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm transition-transform group-hover:translate-y-1">
                <ChevronDown className="h-5 w-5 text-foreground" />
              </span>
            </Link>
          </div>

          <div
            id="pricing-comparison-details"
            className="scroll-mt-24 border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.98)_22%,rgba(255,255,255,1)_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
          >
            <div className="mx-auto mb-8 max-w-3xl text-center">
              <Badge variant="outline" className="gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Comparação detalhada
              </Badge>
              <h2 className="mt-6 text-balance text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Veja onde cada plano se diferencia
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                A mesma seleção acima continua aqui em modo tabular para comparar créditos, ATS, exportação, histórico e acesso ao chat com IA sem quebra visual abrupta.
              </p>
            </div>

            <PricingComparisonTable variant="embedded" />
          </div>
        </div>

        <p className="mt-12 text-center text-sm font-medium text-muted-foreground">
          Análise gratuita disponível para todos, sem cadastro.
        </p>
      </div>
    </section>
  )
}
