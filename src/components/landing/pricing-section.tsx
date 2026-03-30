import Link from "next/link"
import { Check, Gift, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS, formatPrice } from "@/lib/plans"
import { cn } from "@/lib/utils"

const plans = [
  { slug: "free", href: "/signup", cta: "Comecar gratis" },
  { slug: "unit", href: "/pricing", cta: "Comprar agora" },
  { slug: "monthly", href: "/pricing", cta: "Assinar mensal" },
  { slug: "pro", href: "/pricing", cta: "Assinar pro" },
] as const

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-black tracking-tight text-balance md:text-4xl">
            Precos simples e transparentes
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para suas necessidades. Cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const config = PLANS[plan.slug]
            const price = formatPrice(config.price)
            const period = config.billing === "monthly" ? "/mes" : ""

            return (
              <Card
                key={config.slug}
                className={cn(
                  "relative flex h-full flex-col rounded-[2rem] border py-0 transition-all duration-200",
                  config.highlighted
                    ? "z-10 border-primary shadow-[0_32px_100px_-60px_oklch(var(--foreground)/0.85)] lg:scale-[1.03]"
                    : "border-border/60 bg-card/60 hover:-translate-y-1 hover:border-border hover:shadow-xl",
                )}
              >
                {config.highlighted ? (
                  <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.2em]">
                    Mais popular
                  </Badge>
                ) : null}

                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">{config.description}</CardDescription>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-black tracking-tight">{price}</span>
                    {period ? (
                      <span className="pb-1 font-medium text-muted-foreground">{period}</span>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between space-y-8 pb-8">
                  <ul className="space-y-4">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="h-12 w-full rounded-full font-semibold"
                    variant={config.highlighted ? "default" : "outline"}
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
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Pagamento seguro via Asaas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gift className="h-3.5 w-3.5" />
            </span>
            <span>
              1 analise <strong className="text-foreground">totalmente gratuita</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
