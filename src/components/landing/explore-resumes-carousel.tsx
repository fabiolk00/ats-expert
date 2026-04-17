import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  Briefcase,
  Code2,
  Megaphone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

const resumeGuides = [
  {
    title: "Desenvolvedor",
    subtitle: "Front-end, Back-end, Full Stack",
    href: "/curriculo-desenvolvedor-ats",
    icon: Code2,
    featured: true,
    background: "from-slate-900 via-slate-800 to-slate-700",
  },
  {
    title: "Marketing",
    subtitle: "Performance, SEO, Growth",
    href: "/curriculo-marketing-ats",
    icon: Megaphone,
    background: "from-violet-700 via-fuchsia-700 to-pink-600",
  },
  {
    title: "Analista de Dados",
    subtitle: "SQL, Python, Power BI",
    href: "/curriculo-analista-dados-ats",
    icon: BarChart2,
    background: "from-sky-700 via-cyan-700 to-teal-600",
  },
  {
    title: "Product Manager",
    subtitle: "Discovery, Roadmap, Métricas",
    href: "/curriculo-product-manager-ats",
    icon: Briefcase,
    background: "from-amber-600 via-orange-600 to-rose-500",
  },
  {
    title: "Analista Financeiro",
    subtitle: "Indicadores, Controle, Planejamento",
    href: "/curriculo-financeiro-ats",
    icon: Wallet,
    background: "from-emerald-700 via-green-700 to-lime-600",
  },
  {
    title: "Vendas",
    subtitle: "Meta, Receita, Conversão",
    href: "/curriculo-vendas-ats",
    icon: TrendingUp,
    background: "from-blue-700 via-indigo-700 to-violet-700",
  },
  {
    title: "Customer Success",
    subtitle: "Onboarding, Retenção, Expansão",
    href: "/curriculo-customer-success-ats",
    icon: Users,
    background: "from-rose-700 via-red-700 to-orange-600",
  },
]

export default function ExploreResumesCarousel() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
            Explore currículos por área
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Guias específicos para diferentes perfis profissionais
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Descubra exemplos, palavras-chave e ajustes práticos para montar um currículo mais forte para a sua área.
          </p>
        </div>

        <div className="overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x snap-mandatory gap-4 md:gap-5">
            {resumeGuides.map((guide) => {
              const Icon = guide.icon

              return (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className={[
                    "group relative shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 text-white shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.18)]",
                    guide.featured
                      ? "h-[320px] w-[320px] md:h-[360px] md:w-[420px]"
                      : "h-[260px] w-[250px] md:h-[320px] md:w-[285px]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
                      guide.background,
                    ].join(" ")}
                  />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/65" />

                  <div className="relative flex h-full flex-col justify-between p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      {guide.featured && (
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm">
                          Em destaque
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight md:text-[30px]">
                        {guide.title}
                      </h3>
                      <p className="mt-2 max-w-[24ch] text-sm text-white/80 md:text-base">
                        {guide.subtitle}
                      </p>

                      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 group-hover:bg-white/18">
                        Ver guia
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
