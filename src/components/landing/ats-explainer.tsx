import Link from "next/link"
import { ArrowRightCircle, Bot, CheckCircle2, GitFork, Upload, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    icon: Upload,
    title: "Voce se candidata",
    description: "Voce envia seu curriculo atraves de um portal de vagas.",
    step: 1,
  },
  {
    icon: Bot,
    title: "O ATS escaneia",
    description: "O software automatizado analisa palavras-chave, estrutura e relevancia antes que um humano veja o documento.",
    step: 2,
  },
  {
    icon: GitFork,
    title: "Filtrado ou encaminhado",
    description: "Se o curriculo nao corresponde aos criterios da vaga, ele e rejeitado automaticamente.",
    step: 3,
    showPaths: true,
  },
]

export default function AtsExplainer() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(var(--primary)/0.08),transparent_65%)] blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">
            O que e ATS e por que voce deve se importar?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            <strong className="text-foreground">75% dos curriculos nunca sao vistos por um humano.</strong> Eles sao rejeitados por sistemas ATS antes mesmo de chegar a um recrutador.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <Card
                key={step.step}
                className="group h-full overflow-hidden rounded-[2rem] border-border/50 bg-card/85 py-0 shadow-[0_24px_90px_-60px_oklch(var(--foreground)/0.8)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20"
              >
                <CardContent className="relative flex h-full flex-col p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative mb-8 inline-flex">
                    <div className="flex size-20 items-center justify-center rounded-[1.75rem] bg-muted/60 transition-all duration-300 group-hover:bg-primary/10">
                      <step.icon className="size-10 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                    </div>
                  </div>

                  <div className="relative flex flex-1 flex-col">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Etapa {step.step}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                    <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {step.showPaths ? (
                    <div className="relative mt-8 space-y-3 border-t border-border/60 pt-6">
                      <div className="flex items-center justify-between rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2 text-destructive">
                          <XCircle className="h-5 w-5" />
                          <span>Rejeitado pelo robo</span>
                        </div>
                        <span>75%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-success/15 bg-success/5 px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Visto pelo recrutador</span>
                        </div>
                        <span>25%</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-4xl flex-col items-center">
          <div className="w-full rounded-[2rem] border border-primary/20 bg-card p-8 text-center shadow-[0_30px_100px_-70px_oklch(var(--foreground)/0.8)] md:p-12">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
              CurrIA foi feito para vencer o ATS
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Nossa IA faz a engenharia reversa desse processo, identifica lacunas e adapta seu curriculo para cair na pilha certa.
            </p>
          </div>

          <Link
            href="/what-is-ats"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Entenda a fundo como vencer o ATS
            <ArrowRightCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
