import DeveloperPage from "@/components/landing/seo-pages/routes/developer-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { developerSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-desenvolvedor-ats")

export default function CurriculoDesenvolvedorAtsPage() {
  return (
    <>
      <FaqJsonLd items={developerSeoFaqItems} />
      <DeveloperPage />
    </>
  )
}
