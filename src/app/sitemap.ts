import type { MetadataRoute } from "next"

import { getAppOrigin } from "@/lib/config/app-url"
import { allRoleLandingConfigs } from "@/lib/seo/role-landing-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppOrigin()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/o-que-e-ats`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/precos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/entrar`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/criar-conta`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  const seoRoutes: MetadataRoute.Sitemap = allRoleLandingConfigs.map((config) => ({
    url: `${baseUrl}${config.meta.canonical}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }))

  return [...staticRoutes, ...seoRoutes]
}
