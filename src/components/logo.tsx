import Link from "next/link"
import { Bot } from "lucide-react"

import { cn } from "@/lib/utils"

export default function Logo({
  size = "default",
  linkTo = "/",
  className,
  iconClassName,
  textClassName,
  accentClassName,
}: {
  size?: "sm" | "default"
  linkTo?: string
  className?: string
  iconClassName?: string
  textClassName?: string
  accentClassName?: string
}) {
  return (
    <Link href={linkTo} className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md",
          size === "sm" ? "h-6 w-6" : "h-8 w-8",
          iconClassName,
        )}
      >
        <Bot className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
      </div>
      <span className={cn("font-bold tracking-tight", size === "sm" ? "text-lg" : "text-xl", textClassName)}>
        Curr
        <span
          className={cn(
            "bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400",
            accentClassName,
          )}
        >
          IA
        </span>
      </span>
    </Link>
  )
}
