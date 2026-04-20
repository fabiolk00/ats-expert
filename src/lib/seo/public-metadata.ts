import type { Metadata } from "next"

import { getAppOrigin } from "@/lib/config/app-url"

type PublicMetadataInput = {
  title: string
  description: string
  canonicalPath: string
}

export function buildPublicPageMetadata({
  title,
  description,
  canonicalPath,
}: PublicMetadataInput): Metadata {
  const baseUrl = getAppOrigin()
  const canonical = `${baseUrl}${canonicalPath}`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      title,
      description,
      siteName: "CurrIA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
