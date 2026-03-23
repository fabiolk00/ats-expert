import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  linkTo?: string
}

export default function Logo({ className, linkTo = "/" }: LogoProps) {
  const logoContent = (
    <span className={cn("text-xl font-bold tracking-tight", className)}>
      Curr<span className="text-primary">IA</span>
    </span>
  )
  
  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    )
  }
  
  return logoContent
}
