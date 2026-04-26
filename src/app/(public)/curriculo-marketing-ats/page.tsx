import MarketingPage from "@/components/landing/seo-pages/routes/marketing-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { marketingSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-marketing-ats")

export default function CurriculoMarketingAtsPage() {
  return (
    <>
      <FaqJsonLd items={marketingSeoFaqItems} />
      <MarketingPage />
    </>
  )
}
