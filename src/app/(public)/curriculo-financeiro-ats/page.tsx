import FinancePage from "@/components/landing/seo-pages/routes/finance-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-financeiro-ats")

export default function CurriculoFinanceiroAtsPage() {
  return <FinancePage />
}
