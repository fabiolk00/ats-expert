import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-4xl mx-auto">
          Seu currículo passa pelo filtro ATS?
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          75% dos currículos são descartados antes de um humano ver. Nossa IA analisa,
          reescreve e entrega um currículo otimizado em minutos.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base">
            <Link href="/signup">Analisar meu currículo grátis</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/pricing">Ver planos</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm font-medium text-primary">
          1 análise gratuita incluída
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mais de 1.200 currículos otimizados
        </p>
      </div>
    </section>
  )
}
