import { Badge } from "@/components/ui/badge"

export default function ATSScoreBadge({
  score,
  formattedScore,
  showLabel = true,
}: {
  score: number
  formattedScore?: string
  showLabel?: boolean
}) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
  const label = formattedScore ?? String(score)
  return <Badge className={color}>{showLabel ? `ATS Readiness Score: ${label}` : label}</Badge>
}
