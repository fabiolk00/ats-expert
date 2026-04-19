import SalesPage from "@/components/landing/seo-pages/routes/sales-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-vendas-ats")

export default function CurriculoVendasAtsPage() {
  return <SalesPage />
}
