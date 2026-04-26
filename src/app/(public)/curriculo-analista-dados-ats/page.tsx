import DataAnalystPage from "@/components/landing/seo-pages/routes/data-analyst-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { dataAnalystSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-analista-dados-ats")

export default function CurriculoAnalistaDadosAtsPage() {
  return (
    <>
      <FaqJsonLd items={dataAnalystSeoFaqItems} />
      <DataAnalystPage />
    </>
  )
}
