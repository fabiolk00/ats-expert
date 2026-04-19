import DataAnalystPage from "@/components/landing/seo-pages/routes/data-analyst-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-analista-dados-ats")

export default function CurriculoAnalistaDadosAtsPage() {
  return <DataAnalystPage />
}
