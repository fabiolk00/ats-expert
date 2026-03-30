import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-border/50 bg-card py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-balance md:text-5xl">
          Pare de ser rejeitado por robos.{" "}
          <span className="mt-2 block bg-gradient-to-r from-primary via-foreground to-chart-2 bg-clip-text text-transparent">
            Comece a conseguir entrevistas.
          </span>
        </h2>
        <div className="mt-12">
          <Button asChild size="lg" className="h-14 gap-3 rounded-full px-8 text-lg font-semibold shadow-lg shadow-primary/20">
            <Link href="/signup">
              Comecar gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-sm font-medium text-muted-foreground">
          Sem cartao de credito. 1 analise gratis incluida.
        </p>
      </div>
    </section>
  )
}
