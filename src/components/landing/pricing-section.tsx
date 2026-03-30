import { Check, Gift, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
  {
    name: "Gratis",
    price: "R$ 0",
    description: "Experimente sem compromisso",
    features: [
      "1 analise de curriculo gratis",
      "Score ATS basico",
      "Lista de palavras-chave",
      "Sugestoes de melhoria",
    ],
    cta: "Comecar gratis",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Unitario",
    price: "R$ 19",
    period: "",
    description: "Para analises pontuais",
    features: [
      "3 analises ATS completas",
      "3 arquivos DOCX + PDF",
      "Download imediato",
      "Chat com IA",
    ],
    cta: "Comprar agora",
    href: "/pricing",
    highlighted: false,
  },
  {
    name: "Mensal",
    price: "R$ 39",
    period: "/mes",
    description: "Ideal para busca ativa de emprego",
    features: [
      "20 curriculos por mes",
      "Chat iterativo com IA",
      "Historico de curriculos",
      "Match com vagas",
    ],
    cta: "Assinar Mensal",
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mes",
    description: "Para profissionais e recrutadores",
    features: [
      "50 curriculos por mes",
      "Tudo do plano Mensal",
      "Suporte prioritario",
      "Acesso antecipado a recursos",
    ],
    cta: "Assinar Pro",
    href: "/pricing",
    highlighted: false,
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">
            Precos simples e transparentes
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para suas necessidades. Cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative flex h-full flex-col border-primary/70 bg-card shadow-xl shadow-primary/10"
                  : "relative flex h-full flex-col border-border/60 bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              }
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4">
                  Mais popular
                </Badge>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full rounded-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-sm font-medium text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Pagamento seguro via Asaas</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2">
            <Gift className="h-4 w-4 text-primary" />
            <span>1 analise gratuita para todos</span>
          </div>
        </div>
      </div>
    </section>
  )
}
