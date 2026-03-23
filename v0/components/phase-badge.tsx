import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Phase = 'intake' | 'analysis' | 'dialog' | 'confirm' | 'generation'

interface PhaseBadgeProps {
  phase: Phase
  className?: string
}

const phaseConfig: Record<Phase, { label: string; className: string }> = {
  intake: {
    label: "Início",
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  analysis: {
    label: "Análise",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
  },
  dialog: {
    label: "Refinando",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300",
  },
  confirm: {
    label: "Confirmação",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
  },
  generation: {
    label: "Pronto",
    className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300",
  },
}

export default function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  const config = phaseConfig[phase]
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
