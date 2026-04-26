import SalesPage from "@/components/landing/seo-pages/routes/sales-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { salesSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-vendas-ats")

export default function CurriculoVendasAtsPage() {
  return (
    <>
      <FaqJsonLd items={salesSeoFaqItems} />
      <SalesPage />
    </>
  )
}
