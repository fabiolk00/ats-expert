import type { MetadataRoute } from "next"

import { PUBLIC_ROUTES } from "@/lib/routes/public"
import { allRoleLandingConfigs } from "@/lib/seo/role-landing-config"
import { buildSiteUrl, SEO_LAST_MODIFIED } from "@/lib/seo/site-config"

type SitemapRouteEntry = {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>
  priority: number
}

const staticRouteEntries: SitemapRouteEntry[] = [
  {
    path: PUBLIC_ROUTES.home,
    changeFrequency: "weekly" as const,
    priority: 1,
  },
  {
    path: PUBLIC_ROUTES.atsGuide,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  },
  {
    path: PUBLIC_ROUTES.privacy,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  },
  {
    path: PUBLIC_ROUTES.terms,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  },
]

const roleLandingRouteEntries: SitemapRouteEntry[] = allRoleLandingConfigs.map((config) => ({
  path: config.meta.canonical,
  changeFrequency: "monthly",
  priority: 0.85,
}))

export const sitemapRoutes: SitemapRouteEntry[] = [
  ...staticRouteEntries,
  ...roleLandingRouteEntries,
]

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapRoutes.map((route) => ({
    url: buildSiteUrl(route.path),
    lastModified: SEO_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
