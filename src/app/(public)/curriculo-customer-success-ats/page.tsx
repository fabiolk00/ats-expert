import CustomerSuccessPage from "@/components/landing/seo-pages/routes/customer-success-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-customer-success-ats")

export default function CurriculoCustomerSuccessAtsPage() {
  return <CustomerSuccessPage />
}
