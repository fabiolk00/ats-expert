import DataEngineerPage from "@/components/landing/seo-pages/routes/data-engineer-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { dataEngineerSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-engenheiro-de-dados-ats")

export default function CurriculoEngenheiroDeDadosAtsPage() {
  return (
    <>
      <FaqJsonLd items={dataEngineerSeoFaqItems} />
      <DataEngineerPage />
    </>
  )
}
