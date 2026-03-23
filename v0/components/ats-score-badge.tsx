import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ATSScoreBadgeProps {
  score: number
  showLabel?: boolean
  className?: string
}

function getScoreColor(score: number) {
  if (score >= 70) {
    return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
  }
  if (score >= 50) {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
  }
  return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
}

export default function ATSScoreBadge({ score, showLabel = true, className }: ATSScoreBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(getScoreColor(score), "font-medium", className)}
    >
      {showLabel ? `ATS: ${score}` : score}
    </Badge>
  )
}
