import ProductManagerPage from "@/components/landing/seo-pages/routes/product-manager-page"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"
import { productManagerSeoFaqItems } from "@/lib/seo/seo-page-faqs"

export const metadata = buildRoleLandingMetadata("curriculo-product-manager-ats")

export default function CurriculoProductManagerAtsPage() {
  return (
    <>
      <FaqJsonLd items={productManagerSeoFaqItems} />
      <ProductManagerPage />
    </>
  )
}
