import type { MetadataRoute } from "next"

import { getAppOrigin } from "@/lib/config/app-url"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppOrigin()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
