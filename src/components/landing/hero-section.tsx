"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BeforeAfterComparison } from "@/components/shared/before-after-comparison"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(var(--primary)/0.13),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(var(--chart-2)/0.12),transparent_68%)] blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-sm">
              Curriculo otimizado para ATS
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-balance md:text-5xl lg:text-6xl lg:leading-[1.02]">
              Seu curriculo merece ser{" "}
              <span className="bg-gradient-to-r from-primary via-foreground to-chart-2 bg-clip-text text-transparent">
                visto.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl lg:mx-0">
              CurrIA usa IA para decodificar exatamente o que recrutadores e softwares de triagem procuram e reescreve seu curriculo para corresponder.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base font-semibold shadow-lg shadow-primary/15">
                <Link href="/signup">
                  Analisar meu curriculo gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-7 text-base font-semibold">
                <Link href="#pricing">Ver planos</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-x-10 bottom-[-2rem] h-32 rounded-full bg-[radial-gradient(circle,oklch(var(--foreground)/0.1),transparent_70%)] blur-3xl" />
            <div className="relative w-full max-w-xl rounded-[2rem] border border-border/60 bg-card/75 p-4 shadow-[0_40px_120px_-65px_oklch(var(--foreground)/0.7)] backdrop-blur">
              <BeforeAfterComparison />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
