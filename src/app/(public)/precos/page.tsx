import type { Metadata } from "next"

import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"
import PricingHybridShowcase from "@/components/pricing/pricing-hybrid-showcase"
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
        <PricingHybridShowcase />
      </main>
      <Footer />
    </div>
  )
}
