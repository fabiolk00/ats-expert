import DataEngineerPage from "@/components/landing/seo-pages/routes/data-engineer-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-engenheiro-de-dados-ats")

export default function CurriculoEngenheiroDeDadosAtsPage() {
  return <DataEngineerPage />
}
