import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    value: "75%",
    label: "reprovados pelo ATS",
  },
  {
    value: "40%",
    label: "mais entrevistas",
  },
  {
    value: "< 5 min",
    label: "por currículo",
  },
]

export default function TrustSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-border/50">
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
