"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { BeforeAfterComparison } from "@/components/shared/before-after-comparison"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(var(--primary)/0.14),transparent_60%)]" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              IA aplicada a curriculos para o mercado brasileiro
            </span>

            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Seu curriculo merece ser{" "}
              <span className="bg-gradient-to-r from-primary to-primary/65 bg-clip-text text-transparent">
                visto.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl lg:mx-0">
              CurrIA usa IA para decodificar exatamente o que recrutadores e softwares de triagem procuram e reescreve seu curriculo para corresponder.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="gap-2 rounded-full px-6 text-base shadow-lg shadow-primary/20">
                <Link href="/signup">
                  Analisar meu curriculo gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-border/60 bg-background/70 px-6 text-base font-semibold"
              >
                <Link href="#pricing">Ver planos</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <BeforeAfterComparison />
          </div>
        </div>
      </div>
    </section>
  )
}
