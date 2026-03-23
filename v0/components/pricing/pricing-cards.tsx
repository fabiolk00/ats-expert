import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Unitário",
    price: "R$ 19",
    period: "",
    credits: "1 análise",
    popular: false,
    features: [
      "1 análise ATS",
      "1 arquivo DOCX + PDF",
      "Download imediato",
    ],
  },
  {
    name: "Mensal",
    price: "R$ 39",
    period: "/mês",
    credits: "5 currículos",
    popular: true,
    features: [
      "5 análises/mês",
      "Chat iterativo com a IA",
      "Histórico de currículos",
      "Match com vagas",
    ],
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    credits: "Ilimitado",
    popular: false,
    features: [
      "Tudo do Mensal",
      "Currículos ilimitados",
      "Suporte prioritário",
    ],
  },
]

export default function PricingCards() {
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
              onClick={() => {}}
            >
              Começar agora
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
