import CustomerSuccessPage from "@/components/landing/seo-pages/routes/customer-success-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { customerSuccessSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-customer-success-ats")

export default function CurriculoCustomerSuccessAtsPage() {
  return (
    <>
      <FaqJsonLd items={customerSuccessSeoFaqItems} />
      <CustomerSuccessPage />
    </>
  )
}
