import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Sparkles, Download } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Envie seu currículo",
    description: "Upload PDF/DOCX ou cole o texto diretamente",
  },
  {
    icon: Sparkles,
    title: "A IA analisa e sugere",
    description: "Score ATS + melhorias conversacionais",
  },
  {
    icon: Download,
    title: "Baixe o arquivo pronto",
    description: "DOCX e PDF otimizados prontos para enviar",
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="text-center border-border/50">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
