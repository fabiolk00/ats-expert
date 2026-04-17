"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, type Variants } from "motion/react"
import {
  ArrowRight,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Target,
  FileText,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Users,
  GraduationCap,
  Code2,
} from "lucide-react"

import { BrandText } from "@/components/brand-wordmark"
import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { RoleLandingConfig } from "@/lib/seo/role-landing-config"

// Animation variants - refined timing
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
}

// Reusable Section Wrapper
function Section({
  children,
  className = "",
  background = "default",
}: {
  children: React.ReactNode
  className?: string
  background?: "default" | "muted" | "accent"
}) {
  const bgClasses = {
    default: "bg-background",
    muted: "bg-muted/40",
    accent: "bg-gradient-to-b from-muted/30 to-background",
  }
  return (
    <section className={`relative py-20 md:py-28 ${bgClasses[background]} ${className}`}>
      {children}
    </section>
  )
}

// Reusable Section Header
function SectionHeader({
  icon: Icon,
  iconColor = "primary",
  title,
  subtitle,
}: {
  icon?: React.ElementType
  iconColor?: "primary" | "destructive" | "orange" | "green"
  title: string
  subtitle?: string
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    orange: "bg-orange-500/10 text-orange-500",
    green: "bg-green-500/10 text-green-500",
  }
  return (
    <div className="mb-14 text-center">
      {Icon && (
        <div className={`mb-6 inline-flex items-center justify-center rounded-2xl p-4 ${colorClasses[iconColor]}`}>
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h2 className="mx-auto mb-4 max-w-3xl text-pretty text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}

// Feature Card Component
function FeatureCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`
        rounded-2xl border border-border/60 bg-card p-6 shadow-sm
        ${hover ? "transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lg" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface SeoRoleLandingPageProps {
  config: RoleLandingConfig
}

export default function SeoRoleLandingPage({ config }: SeoRoleLandingPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />

      <main className="relative flex-1">
        {/* Hero Section - Clean and impactful */}
        <section className="relative overflow-hidden bg-background pb-20 pt-16 md:pb-28 md:pt-24">
          {/* Subtle gradient orb */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/8 via-primary/4 to-transparent blur-3xl" />
          
          <div className="container relative z-10 mx-auto max-w-4xl px-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                {config.hero.h1.split("ATS").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                        ATS
                      </span>
                    )}
                  </span>
                ))}
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                {config.hero.subtitle}
              </p>
              
              {/* CTA Container */}
              <div className="inline-flex flex-col items-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                >
                  {config.hero.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <span className="text-sm text-muted-foreground">{config.hero.ctaSubtext}</span>
              </div>
              
              {/* Secondary link */}
              <div className="mt-10">
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <a href="#keywords" className="flex items-center gap-2">
                    Ver palavras-chave essenciais
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section - Visual cards with icons */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={AlertTriangle}
                  iconColor="destructive"
                  title={config.problem.title}
                  subtitle={config.problem.description}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {config.problem.points.map((point, i) => (
                  <FeatureCard key={i} className="flex items-start gap-4">
                    <div className="shrink-0 rounded-xl bg-destructive/10 p-2.5">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{point}</p>
                  </FeatureCard>
                ))}
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Real Example Section (conditional) */}
        {config.realExample && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <Section>
              <div className="container mx-auto max-w-4xl px-4">
                <motion.div variants={itemVariants}>
                  <SectionHeader
                    icon={TrendingUp}
                    iconColor="green"
                    title={config.realExample.title}
                    subtitle="Veja a diferença que faz ser específico e mostrar resultados reais."
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
                  {/* Before */}
                  <div className="relative rounded-2xl border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent p-8">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-destructive">Antes</span>
                    </div>
                    <p className="text-lg italic text-muted-foreground">&quot;{config.realExample.before}&quot;</p>
                  </div>

                  {/* After */}
                  <div className="relative rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent p-8">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-full bg-green-500/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-green-500">Depois</span>
                    </div>
                    <p className="text-lg text-foreground">&quot;{config.realExample.after}&quot;</p>
                  </div>
                </motion.div>

                <motion.p variants={itemVariants} className="mt-8 text-center text-sm text-muted-foreground">
                  Resultados específicos e mensuráveis fazem toda a diferença para o ATS e recrutadores.
                </motion.p>
              </div>
            </Section>
          </motion.div>
        )}

        {/* Positioning Mistakes Section (conditional) */}
        {config.positioningMistakes && config.positioningMistakes.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <Section background="muted">
              <div className="container mx-auto max-w-3xl px-4">
                <motion.div 
                  variants={itemVariants} 
                  className="rounded-3xl border-2 border-orange-500/25 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent p-8 md:p-10"
                >
                  <div className="mb-8 flex items-center gap-4">
                    <div className="rounded-xl bg-orange-500/10 p-3">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold md:text-3xl">
                      Você pode estar se vendendo errado se...
                    </h2>
                  </div>
                  <ul className="space-y-4">
                    {config.positioningMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                        <span className="text-[15px] leading-relaxed text-muted-foreground">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl"
                    >
                      Analisar meu posicionamento
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </Section>
          </motion.div>
        )}

        {/* Common Mistakes Section - Vertical Flow: Problem → Solution */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-3xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={AlertCircle}
                  iconColor="orange"
                  title={`Erros mais comuns no currículo de ${config.roleShort}`}
                  subtitle="Evite esses erros que fazem currículos serem filtrados automaticamente."
                />
              </motion.div>

              {/* Vertical Flow of Error → Correction pairs */}
              <div className="space-y-16">
                {config.commonMistakes.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="relative"
                  >
                    {/* Error Card - Full Width */}
                    <div 
                      className="group relative rounded-2xl border-2 border-destructive/20 bg-gradient-to-br from-destructive/8 via-destructive/4 to-transparent p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-destructive/5 md:p-8"
                      style={{ marginLeft: i % 2 === 0 ? '0' : '8px' }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-destructive/10 p-2.5">
                          <XCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider text-destructive">Erro</span>
                      </div>
                      <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{item.mistake}</p>
                    </div>

                    {/* Visual Connector - Arrow/Line */}
                    <div className="relative flex h-14 items-center justify-center">
                      <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-destructive/30 via-border to-green-500/30" />
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background shadow-sm">
                        <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Correction Card - Full Width, More Prominent */}
                    <div 
                      className="group relative rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-6 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/10 md:p-8"
                      style={{ marginRight: i % 2 === 0 ? '0' : '8px' }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-green-500/15 p-2.5">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider text-green-500">Correção</span>
                      </div>
                      <p className="text-base font-medium leading-relaxed text-foreground md:text-lg">{item.fix}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Resume Sections Examples */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={Code2}
                  title="Exemplos de seções do currículo"
                  subtitle="Veja como escrever cada seção do seu currículo de forma otimizada para ATS."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                {/* Summary Example */}
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/30 px-8 py-5">
                    <h3 className="text-lg font-semibold">{config.resumeSections.summary.title}</h3>
                  </div>
                  <div className="grid gap-px bg-border/40 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-destructive/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <XCircle className="h-4 w-4" /> Ruim
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">{config.resumeSections.summary.bad}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-500">
                        <CheckCircle2 className="h-4 w-4" /> Bom
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{config.resumeSections.summary.good}</p>
                    </div>
                  </div>
                </div>

                {/* Skills Example */}
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/30 px-8 py-5">
                    <h3 className="text-lg font-semibold">{config.resumeSections.skills.title}</h3>
                  </div>
                  <div className="grid gap-px bg-border/40 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-destructive/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <XCircle className="h-4 w-4" /> Ruim
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">{config.resumeSections.skills.bad}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-500">
                        <CheckCircle2 className="h-4 w-4" /> Bom
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{config.resumeSections.skills.good}</p>
                    </div>
                  </div>
                </div>

                {/* Experience Example */}
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/30 px-8 py-5">
                    <h3 className="text-lg font-semibold">{config.resumeSections.experience.title}</h3>
                  </div>
                  <div className="grid gap-px bg-border/40 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-destructive/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <XCircle className="h-4 w-4" /> Ruim
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">{config.resumeSections.experience.bad}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/5 to-card p-6">
                      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-500">
                        <CheckCircle2 className="h-4 w-4" /> Bom
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{config.resumeSections.experience.good}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* ATS Explanation Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={Search}
                  title={config.atsExplanation.title}
                  subtitle={config.atsExplanation.description}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm md:p-10"
              >
                <h3 className="mb-6 flex items-center gap-3 text-lg font-semibold">
                  <Target className="h-5 w-5 text-primary" />
                  O que recrutadores de {config.roleShort} escaneiam
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {config.atsExplanation.whatRecruitersScan.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Keywords Section (SEO Gold) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section id="keywords" background="muted" className="scroll-mt-20">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={Sparkles}
                  title={`Palavras-chave Essenciais para ${config.roleShort}`}
                  subtitle="Inclua estas palavras-chave no seu currículo para maximizar sua pontuação no ATS."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                {config.keywords.map((keyword, i) => (
                  <FeatureCard key={i} className="flex flex-col">
                    <span className="mb-3 inline-flex w-fit rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                      {keyword.term}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground">{keyword.description}</p>
                  </FeatureCard>
                ))}
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Specializations Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={Users}
                  title="Currículo por Especialidade"
                  subtitle="Palavras-chave específicas para cada especialização da área."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
                {config.specializations.map((spec, i) => (
                  <FeatureCard key={i} className="flex flex-col">
                    <h3 className="mb-2 text-lg font-semibold">{spec.title}</h3>
                    <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">{spec.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {spec.keywords.map((kw, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </FeatureCard>
                ))}
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Seniority Levels Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={GraduationCap}
                  title="Currículo por Senioridade"
                  subtitle="Dicas específicas para cada nível de experiência."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
                {config.seniorityLevels.map((level, i) => (
                  <FeatureCard key={i} hover={false} className="flex flex-col">
                    <h3 className="mb-1 text-lg font-semibold">{level.level}</h3>
                    <p className="mb-5 text-sm font-medium text-primary">{level.focus}</p>
                    <ul className="space-y-3">
                      {level.tips.map((tip, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </FeatureCard>
                ))}
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Full Resume Example Section - Hero-style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-4xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={FileText}
                  iconColor="green"
                  title="Currículo Completo ATS-Ready"
                  subtitle="Modelo de currículo otimizado para ATS. Use como referência para estruturar o seu."
                />
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="overflow-hidden rounded-3xl border-2 border-green-500/30 bg-white shadow-xl shadow-green-500/5"
              >
                {/* Resume Header */}
                <div className="border-b border-border/30 bg-gradient-to-r from-green-500/5 to-transparent px-8 py-8 text-center md:px-12">
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{config.fullResumeExample.name}</h3>
                  <p className="mb-3 text-lg font-medium text-primary">{config.fullResumeExample.title}</p>
                  <p className="text-sm text-muted-foreground">{config.fullResumeExample.contact}</p>
                </div>

                <div className="p-8 md:p-12">
                  {/* Summary */}
                  <div className="mb-8">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                      <span className="h-px flex-1 bg-primary/20" />
                      Resumo Profissional
                      <span className="h-px flex-1 bg-primary/20" />
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{config.fullResumeExample.summary}</p>
                  </div>

                  {/* Skills */}
                  <div className="mb-8">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                      <span className="h-px flex-1 bg-primary/20" />
                      Habilidades Técnicas
                      <span className="h-px flex-1 bg-primary/20" />
                    </h4>
                    <div className="space-y-2">
                      {config.fullResumeExample.skills.map((skill, i) => (
                        <div key={i} className="flex flex-wrap gap-2 text-sm">
                          <span className="font-semibold text-foreground">{skill.category}:</span>
                          <span className="text-muted-foreground">{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="mb-8">
                    <h4 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                      <span className="h-px flex-1 bg-primary/20" />
                      Experiência Profissional
                      <span className="h-px flex-1 bg-primary/20" />
                    </h4>
                    <div className="space-y-6">
                      {config.fullResumeExample.experience.map((exp, i) => (
                        <div key={i} className="relative pl-4 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary/20">
                          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                            <h5 className="font-semibold text-foreground">{exp.role}</h5>
                            <span className="text-xs text-muted-foreground">{exp.period}</span>
                          </div>
                          <p className="mb-3 text-sm font-medium text-muted-foreground">{exp.company}</p>
                          <ul className="space-y-1.5">
                            {exp.bullets.map((bullet, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="mb-8">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                      <span className="h-px flex-1 bg-primary/20" />
                      Formação Acadêmica
                      <span className="h-px flex-1 bg-primary/20" />
                    </h4>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <div>
                        <span className="font-semibold text-foreground">{config.fullResumeExample.education.degree}</span>
                        <span className="text-muted-foreground"> - {config.fullResumeExample.education.institution}</span>
                      </div>
                      <span className="text-muted-foreground">{config.fullResumeExample.education.year}</span>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                      <span className="h-px flex-1 bg-primary/20" />
                      Certificações
                      <span className="h-px flex-1 bg-primary/20" />
                    </h4>
                    <ul className="space-y-1.5">
                      {config.fullResumeExample.certifications.map((cert, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Before/After CV Example - Hero Visual */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div variants={itemVariants} className="mb-14 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem]">
                  Antes vs Depois: Seção de Experiência
                </h2>
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Comparação rápida de como transformar uma experiência genérica em otimizada para ATS.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
                {/* Before */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-destructive/25 bg-gradient-to-br from-destructive/5 via-card to-card p-8 shadow-lg">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-destructive/5 blur-3xl" />
                  <div className="relative">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-3">
                        <XCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-destructive">Reprovado pelo ATS</span>
                        <h3 className="text-lg font-semibold">{config.cvExample.before.title}</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {config.cvExample.before.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* After */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 via-card to-card p-8 shadow-lg">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-500/5 blur-3xl" />
                  <div className="relative">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-full bg-green-500/10 p-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-green-500">Aprovado pelo ATS</span>
                        <h3 className="text-lg font-semibold">{config.cvExample.after.title}</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {config.cvExample.after.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* How to Improve Section - Timeline/Stepper */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-4xl px-4">
              <motion.div variants={itemVariants}>
                <SectionHeader
                  icon={TrendingUp}
                  title={`Como Melhorar seu Currículo de ${config.roleShort}`}
                  subtitle="Siga estes passos para otimizar seu currículo e passar pelos filtros ATS."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:block" />
                
                <div className="space-y-6">
                  {config.improvementSteps.map((step, i) => (
                    <div
                      key={i}
                      className="group relative flex gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:pl-16"
                    >
                      {/* Step number */}
                      <div className="absolute left-4 top-6 hidden h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-primary text-lg font-bold text-primary-foreground shadow-lg md:flex">
                        {i + 1}
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary md:hidden">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* CTA Section - Premium Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-4xl px-4">
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-[1px]"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-[80px]" />

                <div className="relative z-10 rounded-[calc(1.5rem-1px)] bg-card/95 px-8 py-16 text-center backdrop-blur-sm md:px-16 md:py-20">
                  <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 text-primary">
                    <Lightbulb className="h-8 w-8" />
                  </div>
                  <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl">
                    Descubra se seu currículo de {config.roleShort.toLowerCase()} passa no ATS
                  </h2>
                  <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
                    <BrandText
                      text="Receba seu score ATS e veja exatamente o que corrigir para conquistar mais entrevistas."
                      className="font-medium text-foreground"
                    />
                  </p>
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30"
                  >
                    Analisar meu currículo agora
                    <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Internal Links Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section>
            <div className="container mx-auto max-w-6xl px-4">
              <motion.div variants={itemVariants} className="mb-14 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Outros guias de currículo
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Explore mais recursos para otimizar seu currículo.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {config.internalLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="group relative overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={link.image}
                        alt={link.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="mb-1 text-lg font-semibold text-white">
                        {link.label}
                      </h3>
                      <p className="mb-3 text-sm text-white/75">{link.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-white">
                        Ver guia
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section background="muted">
            <div className="container mx-auto max-w-3xl px-4">
              <motion.div variants={itemVariants} className="mb-14 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Perguntas Frequentes sobre Currículo de {config.roleShort}
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Dúvidas comuns sobre como otimizar seu currículo para a área.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
              >
                <Accordion type="single" collapsible className="w-full">
                  {config.faqs.map((faq, index) => (
                    <AccordionItem key={faq.question} value={`item-${index}`} className="border-b border-border/40 last:border-0">
                      <AccordionTrigger className="px-6 py-5 text-left text-[15px] font-semibold transition-colors hover:text-primary hover:no-underline md:px-8 md:text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground md:px-8">
                        <BrandText text={faq.answer} className="font-medium text-foreground" />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </Section>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Section className="text-center">
            <div className="container mx-auto max-w-3xl px-4">
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                Pronto para conquistar mais entrevistas?
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                Pare de enviar currículos para o buraco negro. Deixe nossa IA otimizar seu perfil de {config.roleShort.toLowerCase()} e comece a ser chamado para as entrevistas que você merece.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30"
              >
                {config.hero.ctaText}
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Section>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
