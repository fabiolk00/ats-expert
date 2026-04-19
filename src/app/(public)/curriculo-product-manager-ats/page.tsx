import ProductManagerPage from "@/components/landing/seo-pages/routes/product-manager-page"
import { buildRoleLandingMetadata } from "@/lib/seo/metadata"

export const metadata = buildRoleLandingMetadata("curriculo-product-manager-ats")

export default function CurriculoProductManagerAtsPage() {
  return <ProductManagerPage />
}
