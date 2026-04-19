"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useRef, type MouseEvent } from "react"

import { allRoleLandingConfigs, type RoleLandingVisualVariant } from "@/lib/seo/role-landing-config"

const carouselImageByVariant: Record<RoleLandingVisualVariant, string> = {
  default: "/images/seo/ats-guide.jpg",
  developer: "/images/seo/developer-career.jpg",
  data_analyst: "/images/seo/data-analyst-career.jpg",
  data_engineer: "/images/seo/developer-career.jpg",
  marketing: "/images/seo/marketing-career.jpg",
  customer_success: "/images/seo/marketing-career.jpg",
  product_manager: "/images/seo/data-analyst-career.jpg",
  sales: "/images/seo/marketing-career.jpg",
  finance: "/images/seo/data-analyst-career.jpg",
}

function getRelatedSeoPages(currentSlug: string) {
  return allRoleLandingConfigs
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      label: entry.roleShort,
      href: `/${entry.slug}`,
      description: entry.hero.subtitle,
      image: carouselImageByVariant[entry.visualVariant ?? "default"],
    }))
}

export default function RelatedSeoPagesCarousel({ currentSlug }: { currentSlug: string }) {
  const relatedSeoPages = getRelatedSeoPages(currentSlug)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const movedRef = useRef(false)

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    isDraggingRef.current = true
    movedRef.current = false
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }

  const onMouseLeave = () => {
    isDraggingRef.current = false
  }

  const onMouseUp = () => {
    isDraggingRef.current = false
  }

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.15

    if (Math.abs(walk) > 4) {
      movedRef.current = true
    }

    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  return (
    <section className="pt-10">
      <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] md:p-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Páginas relacionadas
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Explore outros guias de currículo ATS
          </h2>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent md:w-12" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent md:w-12" />

          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            className="cursor-grab overflow-x-auto pb-2 select-none touch-pan-y active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-5 pr-6 md:gap-6 md:pr-8">
              {relatedSeoPages.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (movedRef.current) {
                      e.preventDefault()
                    }
                  }}
                  className="group relative w-[286px] shrink-0 overflow-hidden rounded-[30px] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:w-[320px] lg:w-[360px]"
                >
                  <div className="relative min-h-[360px] sm:min-h-[400px] lg:min-h-[440px]">
                    <Image
                      src={link.image}
                      alt={link.label}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <p className="text-[1.75rem] font-semibold leading-[1.02] text-white sm:text-[2rem]">
                        {link.label}
                      </p>
                      <p className="mt-3 line-clamp-3 max-w-[28ch] text-sm leading-7 text-white/80 sm:text-base">
                        {link.description}
                      </p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white sm:text-base">
                        Ver página
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
