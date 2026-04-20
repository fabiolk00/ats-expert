import type { Metadata } from "next"

import TermsPage from "@/app/(public)/terms/page"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Termos de Serviço - CurrIA",
  description: "Termos de serviço e condições de uso da plataforma CurrIA.",
  canonicalPath: "/termos",
})

export default TermsPage
