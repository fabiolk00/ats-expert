import type { Metadata } from "next"

import PrivacyPage from "@/app/(public)/privacy/page"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Política de Privacidade - CurrIA",
  description: "Política de privacidade e proteção de dados pessoais da plataforma CurrIA.",
  canonicalPath: "/privacidade",
})

export default PrivacyPage
