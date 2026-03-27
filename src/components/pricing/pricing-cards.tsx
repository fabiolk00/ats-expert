"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLANS, formatPrice } from "@/lib/plans"

const plans = [
  {
    slug: "unit" as const,
    popular: false,
  },
  {
    slug: "monthly" as const,
    popular: true,
  },
  {
    slug: "pro" as const,
    popular: false,
  },
]

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (plan: 'unit' | 'monthly' | 'pro') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const config = PLANS[plan.slug]
        const period = config.billing === 'monthly' ? '/mês' : ''

        return (
          <Card
            key={config.name}
            className={cn(
              "relative flex flex-col",
              plan.popular && "border-primary shadow-lg"
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Mais popular
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{config.name}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center flex-1">
              <div className="mb-6">
                <span className="text-4xl font-bold">{formatPrice(config.price)}</span>
                <span className="text-muted-foreground">{period}</span>
              </div>
              <ul className="space-y-3 text-left">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleCheckout(plan.slug)}
                disabled={loading !== null}
              >
                {loading === plan.slug ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Começar agora'
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
