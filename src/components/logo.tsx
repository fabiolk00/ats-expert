import Link from "next/link"
import { Bot } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  linkTo?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: {
    wrap: "gap-2",
    icon: "size-7 rounded-xl",
    bot: "size-3.5",
    text: "text-lg",
  },
  md: {
    wrap: "gap-2.5",
    icon: "size-9 rounded-2xl",
    bot: "size-4.5",
    text: "text-xl",
  },
  lg: {
    wrap: "gap-3",
    icon: "size-11 rounded-[1.35rem]",
    bot: "size-5",
    text: "text-2xl",
  },
} as const

export default function Logo({ linkTo = "/", className, size = "md" }: LogoProps) {
  const config = sizeMap[size]

  const content = (
    <>
      <span
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary via-foreground to-chart-2 text-primary-foreground shadow-[0_20px_45px_-28px_oklch(var(--foreground)/0.8)]",
          config.icon,
        )}
      >
        <Bot className={config.bot} />
      </span>
      <span className={cn("font-black tracking-tight", config.text, className)}>
        <span className="text-foreground">Curr</span>
        <span className="bg-gradient-to-r from-primary via-foreground to-chart-2 bg-clip-text text-transparent">
          IA
        </span>
      </span>
    </>
  )

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        className={cn(
          "flex items-center transition-transform duration-200 hover:-translate-y-0.5",
          config.wrap,
        )}
      >
        {content}
      </Link>
    )
  }

  return <span className={cn("flex items-center", config.wrap)}>{content}</span>
}
