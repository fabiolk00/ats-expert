import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileCheck } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileCheck className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Nenhum currículo ainda</h2>
      <p className="text-muted-foreground mb-6">
        Comece enviando seu currículo para análise
      </p>
      <Button asChild>
        <Link href="/chat/new">Analisar meu primeiro currículo</Link>
      </Button>
    </div>
  )
}
