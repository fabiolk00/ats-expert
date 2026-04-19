import DeveloperPage from "@/components/landing/seo-pages/routes/developer-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-desenvolvedor-ats")

export default function CurriculoDesenvolvedorAtsPage() {
  return <DeveloperPage />
}
