import Link from "next/link"
import { Check, Gift, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS, formatPrice } from "@/lib/plans"

const plans = [
  {
    slug: "free" as const,
    cta: "Ver meu score ATS",
    href: "/criar-conta",
  },
  {
    slug: "unit" as const,
    cta: "Ver detalhes do plano",
    href: "/precos",
  },
  {
    slug: "monthly" as const,
    cta: "Ver detalhes do plano",
    href: "/precos",
  },
  {
    slug: "pro" as const,
    cta: "Ver detalhes do plano",
    href: "/precos",
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance md:text-4xl">
            Preços simples para melhorar seu currículo
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para ver seu score ATS, ajustar o currículo e avançar mais nas vagas.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const config = PLANS[plan.slug]

            return (
              <Card
                key={plan.slug}
                className={`relative flex h-full flex-col transition-all duration-200 ${
                  config.highlighted
                    ? "z-10 border-primary bg-card shadow-xl shadow-primary/10 xl:scale-105"
                    : "border-border/50 bg-card/50 hover:border-border hover:shadow-md"
                }`}
              >
                {config.highlighted ? (
                  <div className="absolute left-0 right-0 -top-4 flex justify-center">
                    <Badge
                      variant="default"
                      className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    >
                      Mais popular
                    </Badge>
                  </div>
                ) : null}

                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">{config.description}</CardDescription>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formatPrice(config.price)}
                    </span>
                    {config.billing === "monthly" ? (
                      <span className="font-medium text-muted-foreground">/mês</span>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between space-y-8">
                  <ul className="space-y-4">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="w-full font-semibold"
                    variant={config.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-sm font-medium text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Pagamento 100% seguro via</span>
            <span className="ml-0.5 flex items-center text-base font-black tracking-[-0.05em] text-[#0030B9] dark:text-[#4270f5]">
              Asaas
            </span>
          </div>
          <span className="hidden text-border sm:inline">|</span>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gift className="h-3.5 w-3.5" />
            </div>
            <span>
              1 análise <strong className="text-foreground">totalmente gratuita</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
