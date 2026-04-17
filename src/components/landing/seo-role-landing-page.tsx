"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { useRef, type MouseEvent, type ReactNode } from "react"
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  LineChart,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"

import { BrandText } from "@/components/brand-wordmark"
import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"
import { SeoRoleHeroVisual, type SeoHeroTheme } from "@/components/landing/seo-role-hero-visuals"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { allRoleLandingConfigs, type InternalLink, type RoleLandingConfig, type RoleLandingVisualVariant } from "@/lib/seo/role-landing-config"

const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

const themeByVariant: Record<RoleLandingVisualVariant, SeoHeroTheme> = {
  default: {
    badge: "border-slate-200/80 bg-white/85 text-slate-700",
    button: "bg-slate-950 text-white hover:bg-slate-800",
    glow: "from-sky-200/32 via-cyan-100/24 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_48%)]",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200/75",
    accentSoft: "bg-sky-50/85",
    darkAccent: "text-sky-300",
  },
  developer: {
    badge: "border-sky-200/85 bg-sky-50/90 text-sky-700",
    button: "bg-sky-600 text-white hover:bg-sky-500",
    glow: "from-sky-200/38 via-blue-100/24 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.20),transparent_46%)]",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200/75",
    accentSoft: "bg-sky-50/85",
    darkAccent: "text-sky-300",
  },
  data_analyst: {
    badge: "border-violet-200/85 bg-violet-50/90 text-violet-700",
    button: "bg-violet-600 text-white hover:bg-violet-500",
    glow: "from-violet-200/36 via-fuchsia-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_46%)]",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200/75",
    accentSoft: "bg-violet-50/85",
    darkAccent: "text-violet-300",
  },
  data_engineer: {
    badge: "border-cyan-200/85 bg-cyan-50/90 text-cyan-700",
    button: "bg-cyan-600 text-white hover:bg-cyan-500",
    glow: "from-cyan-200/38 via-sky-100/24 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_48%)]",
    accentText: "text-cyan-700",
    accentBorder: "border-cyan-200/75",
    accentSoft: "bg-cyan-50/85",
    darkAccent: "text-cyan-300",
  },
  marketing: {
    badge: "border-rose-200/85 bg-rose-50/90 text-rose-700",
    button: "bg-rose-600 text-white hover:bg-rose-500",
    glow: "from-rose-200/34 via-orange-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_46%)]",
    accentText: "text-rose-700",
    accentBorder: "border-rose-200/75",
    accentSoft: "bg-rose-50/85",
    darkAccent: "text-rose-300",
  },
  customer_success: {
    badge: "border-teal-200/85 bg-teal-50/90 text-teal-700",
    button: "bg-teal-600 text-white hover:bg-teal-500",
    glow: "from-teal-200/34 via-cyan-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_46%)]",
    accentText: "text-teal-700",
    accentBorder: "border-teal-200/75",
    accentSoft: "bg-teal-50/85",
    darkAccent: "text-teal-300",
  },
  product_manager: {
    badge: "border-amber-200/85 bg-amber-50/90 text-amber-700",
    button: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    glow: "from-amber-200/34 via-yellow-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_46%)]",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200/75",
    accentSoft: "bg-amber-50/85",
    darkAccent: "text-amber-300",
  },
  sales: {
    badge: "border-orange-200/85 bg-orange-50/90 text-orange-700",
    button: "bg-orange-600 text-white hover:bg-orange-500",
    glow: "from-orange-200/34 via-amber-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_46%)]",
    accentText: "text-orange-700",
    accentBorder: "border-orange-200/75",
    accentSoft: "bg-orange-50/85",
    darkAccent: "text-orange-300",
  },
  finance: {
    badge: "border-emerald-200/85 bg-emerald-50/90 text-emerald-700",
    button: "bg-emerald-600 text-white hover:bg-emerald-500",
    glow: "from-emerald-200/36 via-lime-100/22 to-transparent",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_46%)]",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200/75",
    accentSoft: "bg-emerald-50/85",
    darkAccent: "text-emerald-300",
  },
}

const carouselImageByVariant: Record<RoleLandingVisualVariant, string> = {
  default: "/images/seo/ats-guide.jpg",
  developer: "/images/seo/developer-career.jpg",
  data_analyst: "/images/seo/data-analyst-career.jpg",
  data_engineer: "/images/seo/ats-guide.jpg",
  marketing: "/images/seo/marketing-career.jpg",
  customer_success: "/images/seo/ats-guide.jpg",
  product_manager: "/images/seo/ats-guide.jpg",
  sales: "/images/seo/marketing-career.jpg",
  finance: "/images/seo/ats-guide.jpg",
}

function getRelatedSeoPages(currentSlug: string): InternalLink[] {
  return allRoleLandingConfigs
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      label: entry.roleShort,
      href: `/${entry.slug}`,
      description: entry.hero.subtitle,
      image: carouselImageByVariant[entry.visualVariant ?? "default"],
    }))
}

function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={reveal}
      className={cn("px-4", className)}
    >
      <div className="mx-auto w-full max-w-[1440px]">{children}</div>
    </motion.section>
  )
}

function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[40px] border border-white/70 bg-white/90 shadow-[0_28px_90px_rgba(15,23,42,0.07)] backdrop-blur-xl", className)}>
      {children}
    </div>
  )
}

function Label({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500", className)}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

export default function SeoRoleLandingPage({ config }: { config: RoleLandingConfig }) {
  const theme = themeByVariant[config.visualVariant ?? "default"]
  const resumeSections = [config.resumeSections.summary, config.resumeSections.skills, config.resumeSections.experience]
  const relatedSeoPages = getRelatedSeoPages(config.slug)
  const relatedScrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRelatedRef = useRef(false)
  const relatedStartXRef = useRef(0)
  const relatedScrollLeftRef = useRef(0)
  const relatedMovedRef = useRef(false)

  const onRelatedMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!relatedScrollRef.current) return
    isDraggingRelatedRef.current = true
    relatedMovedRef.current = false
    relatedStartXRef.current = e.pageX - relatedScrollRef.current.offsetLeft
    relatedScrollLeftRef.current = relatedScrollRef.current.scrollLeft
  }

  const onRelatedMouseLeave = () => {
    isDraggingRelatedRef.current = false
  }

  const onRelatedMouseUp = () => {
    isDraggingRelatedRef.current = false
  }

  const onRelatedMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRelatedRef.current || !relatedScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - relatedScrollRef.current.offsetLeft
    const walk = (x - relatedStartXRef.current) * 1.15

    if (Math.abs(walk) > 4) {
      relatedMovedRef.current = true
    }

    relatedScrollRef.current.scrollLeft = relatedScrollLeftRef.current - walk
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_28%,#f8fafc_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-24 h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-cyan-200/16 blur-3xl" />
        <div className="absolute left-1/3 top-[72rem] h-96 w-96 rounded-full bg-slate-200/26 blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 pb-24 pt-24 md:pt-28">
        <Section>
          <Surface className="border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-6 py-8 md:px-10 md:py-10">
            <div className={cn("absolute inset-0 bg-gradient-to-br", theme.glow)} />
            <div className={cn("absolute inset-0", theme.spotlight)} />
            <div className="relative grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
              <div className="max-w-3xl pt-2">
                <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]", theme.badge)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Guia ATS para {config.roleShort}
                </div>
                <h1 className="mt-7 max-w-[15ch] text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl md:leading-[0.98]">
                  {config.hero.h1}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">{config.hero.subtitle}</p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link href="/signup" className={cn("inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5", theme.button)}>
                    {config.hero.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-sm text-slate-500">{config.hero.ctaSubtext}</p>
                </div>
                <div className="mt-10 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/80 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                  <div className="grid divide-y divide-slate-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Função</p><p className="mt-2 text-base font-semibold text-slate-950">{config.role}</p></div>
                    <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Keywords</p><p className="mt-2 text-base font-semibold text-slate-950">{config.keywords.length} termos</p></div>
                    <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Melhorias</p><p className="mt-2 text-base font-semibold text-slate-950">{config.improvementSteps.length} passos</p></div>
                  </div>
                </div>
              </div>
              <div className="xl:pl-4">
                <SeoRoleHeroVisual config={config} theme={theme} />
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-10 md:pt-14">
          <Surface>
            <div className="grid xl:grid-cols-[1.02fr_0.98fr]">
              <div className="border-b border-slate-200/80 p-8 md:p-10 xl:border-b-0 xl:border-r">
                <div className="max-w-2xl">
                  <Label icon={<CircleAlert className="h-4 w-4 text-rose-500" />}>Diagnóstico do currículo</Label>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{config.problem.title}</h2>
                  <p className="mt-4 text-base leading-8 text-slate-600">{config.problem.description}</p>
                </div>
                <div className="mt-8 divide-y divide-slate-200/80">
                  {config.problem.points.map((point, index) => (
                    <div key={point} className="grid gap-4 py-5 md:grid-cols-[auto_1fr] md:items-start">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-600">{String(index + 1).padStart(2, "0")}</div>
                      <p className="max-w-2xl text-sm leading-7 text-slate-600">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-950 p-8 text-white md:p-10">
                <div className="max-w-2xl">
                  <Label icon={<LineChart className="h-4 w-4 text-emerald-300" />} className="text-white/55">Leitura ATS</Label>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{config.atsExplanation.title}</h2>
                  <p className="mt-4 text-base leading-8 text-white/72">{config.atsExplanation.description}</p>
                </div>
                <div className="mt-8 divide-y divide-white/10">
                  {config.atsExplanation.whatRecruitersScan.map((item, index) => (
                    <div key={item} className="grid gap-4 py-5 md:grid-cols-[auto_1fr]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-sm font-semibold text-emerald-300">{index + 1}</div>
                      <p className="text-sm leading-7 text-white/78">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-10">
          <Surface>
            <div className="p-8 md:p-10">
              <div className="max-w-2xl">
                <Label icon={<ShieldCheck className={cn("h-4 w-4", theme.accentText)} />}>Palavras-chave e sinais da vaga</Label>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Palavras-chave importantes para {config.roleShort}</h2>
              </div>
              <div className="mt-8 divide-y divide-slate-200/80">
                {config.keywords.map((keyword) => (
                  <div key={keyword.term} className="grid gap-3 py-4 md:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] md:gap-6">
                    <p className="text-base font-semibold text-slate-950">{keyword.term}</p>
                    <p className="text-sm leading-7 text-slate-600">{keyword.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-6 md:pt-8">
          <Surface>
            <div className="p-8 md:p-10">
              <Label icon={<CircleAlert className="h-4 w-4 text-amber-500" />}>Erros que travam a leitura</Label>
              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {config.commonMistakes.map((item, index) => (
                  <div key={item.mistake} className="rounded-[24px] border border-amber-200/80 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{item.mistake}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-10">
          <Surface>
            <div className="p-8 md:p-10">
              <div className="max-w-2xl">
                <Label icon={<BarChart3 className={cn("h-4 w-4", theme.accentText)} />}>Recortes da área</Label>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Adapte o currículo ao recorte certo da área</h2>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {config.specializations.map((specialization) => (
                  <div key={specialization.title} className="border-t border-slate-200/80 pt-4">
                    <h3 className="text-lg font-semibold text-slate-950">{specialization.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{specialization.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {specialization.keywords.map((keyword) => (
                        <span key={keyword} className="rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-700">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-6 md:pt-8">
          <Surface>
            <div className="p-8 md:p-10">
              <Label icon={<BriefcaseBusiness className={cn("h-4 w-4", theme.accentText)} />}>Senioridade e posicionamento</Label>
              <div className="mt-7 grid gap-5 xl:grid-cols-3">
                {config.seniorityLevels.map((level) => (
                  <div key={level.level} className="rounded-[28px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                    <h3 className="text-lg font-semibold text-slate-950">{level.level}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{level.focus}</p>
                    <ul className="mt-5 space-y-3">
                      {level.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                          <CheckCircle2 className={cn("mt-1 h-4 w-4 shrink-0", theme.accentText)} />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {config.positioningMistakes?.length ? (
                <div className="mt-8 border-t border-slate-200/80 pt-8">
                  <Label icon={<CircleAlert className="h-4 w-4 text-amber-500" />}>Erros de posicionamento</Label>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {config.positioningMistakes.map((mistake) => (
                      <div key={mistake} className="rounded-[20px] border border-amber-200/80 bg-amber-50/50 p-4">
                        <p className="text-sm leading-7 text-slate-600">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Surface>
        </Section>

        {config.realExample ? (
          <Section className="pt-10">
            <Surface>
              <div className="grid xl:grid-cols-[0.76fr_1.24fr]">
                <div className="border-b border-slate-200/80 p-8 md:p-10 xl:border-b-0 xl:border-r">
                  <Label icon={<Sparkles className={cn("h-4 w-4", theme.accentText)} />}>Exemplo real</Label>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{config.realExample.title}</h2>
                </div>
                <div className="grid gap-8 p-8 md:p-10 md:grid-cols-2">
                  <div className="border-l-2 border-rose-200 pl-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">Antes</p>
                    <p className="mt-4 text-sm leading-8 text-slate-600">{config.realExample.before}</p>
                  </div>
                  <div className="border-l-2 border-emerald-300 pl-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Depois</p>
                    <p className="mt-4 text-sm leading-8 text-slate-600">{config.realExample.after}</p>
                  </div>
                </div>
              </div>
            </Surface>
          </Section>
        ) : null}

        <Section className="pt-10">
          <Surface>
            <div className="grid xl:grid-cols-[0.72fr_1.28fr]">
              <div className="border-b border-slate-200/80 p-8 md:p-10 xl:border-b-0 xl:border-r">
                <Label icon={<Sparkles className={cn("h-4 w-4", theme.accentText)} />}>Plano de melhoria</Label>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Como melhorar seu currículo</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Mantivemos toda a orientação da página, mas organizamos os próximos passos como sequência editorial e não como pilha de cartões repetidos.</p>
              </div>
              <div className="p-8 md:p-10">
                <div className="divide-y divide-slate-200/80">
                  {config.improvementSteps.map((step, index) => (
                    <div key={step.title} className="grid gap-4 py-5 md:grid-cols-[auto_1fr]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700">{String(index + 1).padStart(2, "0")}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-10">
          <Surface>
            <div className="grid xl:grid-cols-[0.72fr_1.28fr]">
              <div className="bg-slate-950 p-8 text-white md:p-10">
                <Label icon={<ShieldCheck className={cn("h-4 w-4", theme.darkAccent)} />} className="text-white/55">FAQ</Label>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">Perguntas frequentes</h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/70">Todas as respostas continuam aqui, mas em uma leitura mais limpa, mais calma e mais consistente com o restante da experiência.</p>
              </div>
              <div className="p-8 md:p-10">
                <Accordion type="single" collapsible className="w-full">
                  {config.faqs.map((faq, index) => (
                    <AccordionItem key={faq.question} value={`faq-${index}`} className="border-b border-slate-200 last:border-b-0">
                      <AccordionTrigger className="py-6 text-left text-base font-semibold text-slate-950">{faq.question}</AccordionTrigger>
                      <AccordionContent className="pb-6 text-sm leading-8 text-slate-600">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </Surface>
        </Section>

        <Section className="pt-10">
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] md:p-10">
            <div className="mb-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Páginas relacionadas</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Explore outros guias de currículo ATS</h2>
              </div>
            </div>
            <div className="relative -mx-8 md:-mx-10">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent md:w-16" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent md:w-16" />
              <div ref={relatedScrollRef} onMouseDown={onRelatedMouseDown} onMouseLeave={onRelatedMouseLeave} onMouseUp={onRelatedMouseUp} onMouseMove={onRelatedMouseMove} className="cursor-grab overflow-x-auto px-8 pb-2 select-none touch-pan-y active:cursor-grabbing md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-5 pr-8 md:gap-6 md:pr-10">
                  {relatedSeoPages.map((link, index) => (
                    <Link key={link.href} href={link.href} onClick={(e) => { if (relatedMovedRef.current) e.preventDefault() }} className={[ "group relative shrink-0 overflow-hidden rounded-[30px] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]", index === 0 ? "w-[332px] md:w-[400px]" : "w-[300px] md:w-[340px]"].join(" ")}>
                      <div className="relative min-h-[430px] md:min-h-[520px]">
                        <Image src={link.image} alt={link.label} fill className="object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                          <p className="text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.02]">{link.label}</p>
                          <p className="mt-3 line-clamp-3 max-w-[28ch] text-base leading-7 text-white/80">{link.description}</p>
                          <div className="mt-5 inline-flex items-center gap-2 text-base font-medium text-white">Ver página<ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section className="pt-10">
          <div className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] md:px-12 md:py-14">
            <div className={cn("absolute inset-0 bg-gradient-to-br", theme.glow)} />
            <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">CurrIA</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl"><BrandText text="Reestruture seu currículo com a CurrIA" /></h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">Receba uma leitura orientada para ATS e ajuste seu currículo para a vaga certa sem perder clareza nem honestidade.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Ação imediata</p><p className="mt-3 text-lg font-semibold text-white">{config.hero.ctaText}</p></div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Função</p><p className="mt-3 text-lg font-semibold text-white">{config.roleShort}</p></div>
              </div>
            </div>
            <Link href="/signup" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Analisar meu currículo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
