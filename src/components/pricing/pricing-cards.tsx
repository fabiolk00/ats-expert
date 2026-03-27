"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Unitário",
    price: "R$ 19",
    period: "",
    credits: "3 análises",
    popular: false,
    planType: "one_time" as const,
    features: [
      "3 análises ATS",
      "3 arquivos DOCX + PDF",
      "Download imediato",
    ],
  },
  {
    name: "Mensal",
    price: "R$ 39",
    period: "/mês",
    credits: "20 currículos",
    popular: true,
    planType: "monthly" as const,
    features: [
      "20 análises/mês",
      "Chat iterativo com a IA",
      "Histórico de currículos",
      "Match com vagas",
    ],
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    credits: "50 currículos",
    popular: false,
    planType: "pro" as const,
    features: [
      "Tudo do Mensal",
      "50 currículos/mês",
      "Suporte prioritário",
    ],
  },
]

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (plan: 'one_time' | 'monthly' | 'pro') => {
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
      {plans.map((plan) => (
        <Card 
          key={plan.name} 
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
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.credits}</CardDescription>
          </CardHeader>
          <CardContent className="text-center flex-1">
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-3 text-left">
              {plan.features.map((feature) => (
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
              onClick={() => handleCheckout(plan.planType)}
              disabled={loading !== null}
            >
              {loading === plan.planType ? (
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
      ))}
    </div>
  )
}
