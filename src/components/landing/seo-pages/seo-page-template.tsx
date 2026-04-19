"use client"

import type { ReactNode } from "react"

import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"
import AtsFilterSection from "@/components/landing/seo-pages/sections/ats-filter-section"
import FaqSection from "@/components/landing/seo-pages/sections/faq-section"
import FinalCta from "@/components/landing/seo-pages/sections/final-cta"
import GoodVsBadSection from "@/components/landing/seo-pages/sections/good-vs-bad-section"
import HeroSection from "@/components/landing/seo-pages/sections/hero-section"
import KeywordsSection from "@/components/landing/seo-pages/sections/keywords-section"
import ProblemSection from "@/components/landing/seo-pages/sections/problem-section"
import RelatedSeoPagesCarousel from "@/components/landing/seo-pages/sections/related-seo-pages-carousel"
import SenioritySection from "@/components/landing/seo-pages/sections/seniority-section"
import SpecializationsSection from "@/components/landing/seo-pages/sections/specializations-section"

export interface SEOPageProps {
  slug: string
  role: string
  theme: {
    accent: string
    bgAccent: string
    textAccent: string
    badgeLabel: string
    heroVisual: ReactNode
    icon: ReactNode
  }
  content: {
    heroTitle: string
    heroSubtitle: string
    problemCards: Array<{ title: string; desc: string }>
    filterChecklist: Array<{ item: string; checked: boolean }>
    keywords: Array<{ term: string; category: string }>
    goodVsBad: { bad: string; good: string }
    specializations: Array<{ title: string; desc: string; tags: string[] }>
    seniority: Array<{ level: string; tips: string[] }>
    roadmap?: Array<{ step: string; detail: string }>
    faq: Array<{ q: string; a: string }>
  }
}

export default function SEOPageTemplate({ slug, role, theme, content }: SEOPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0a0a0a]">
      <Header />
      <main className="flex-1">
        <div className="relative w-full bg-white text-[#0a0a0a]">
          <HeroSection theme={theme} content={content} />
          <GoodVsBadSection theme={theme} {...content.goodVsBad} />
          <ProblemSection theme={theme} cards={content.problemCards} />
          <AtsFilterSection theme={theme} checklist={content.filterChecklist} />
          <KeywordsSection theme={theme} keywords={content.keywords} />
          <SpecializationsSection theme={theme} specializations={content.specializations} />
          <SenioritySection theme={theme} levels={content.seniority} />
          <FaqSection faq={content.faq} />
          <FinalCta theme={theme} role={role} />
          <RelatedSeoPagesCarousel currentSlug={slug} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

