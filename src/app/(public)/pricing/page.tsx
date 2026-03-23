import { Metadata } from "next"
import Header from "@/components/landing/header"
import Footer from "@/components/landing/footer"
import PricingCards from "@/components/pricing/pricing-cards"

export const metadata: Metadata = {
  title: "Planos - CurrIA",
  description: "Escolha o plano ideal para otimizar seu currículo com IA",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4">Planos</h1>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Escolha o plano ideal para suas necessidades
          </p>
          <PricingCards />
          <p className="text-center text-muted-foreground mt-12">
            Análise gratuita disponível para todos — sem cadastro.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
