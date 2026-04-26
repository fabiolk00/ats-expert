import FinancePage from "@/components/landing/seo-pages/routes/finance-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { financeSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-financeiro-ats")

export default function CurriculoFinanceiroAtsPage() {
  return (
    <>
      <FaqJsonLd items={financeSeoFaqItems} />
      <FinancePage />
    </>
  )
}
