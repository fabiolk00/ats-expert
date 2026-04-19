import MarketingPage from "@/components/landing/seo-pages/routes/marketing-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-marketing-ats")

export default function CurriculoMarketingAtsPage() {
  return <MarketingPage />
}
