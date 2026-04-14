import { Fragment } from "react"

import { cn } from "@/lib/utils"

type BrandWordmarkProps = {
  className?: string
  accentClassName?: string
}

type BrandTextProps = BrandWordmarkProps & {
  text: string
}

export default function BrandWordmark({ className, accentClassName }: BrandWordmarkProps) {
  return (
    <span className={cn("inline-flex items-baseline whitespace-nowrap", className)}>
      <span>Curr</span>
      <span
        className={cn(
          "bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400",
          accentClassName,
        )}
      >
        IA
      </span>
    </span>
  )
}

export function BrandText({ text, className, accentClassName }: BrandTextProps) {
  const segments = text.split("CurrIA")

  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={`${segment}-${index}`}>
          {segment}
          {index < segments.length - 1 ? (
            <BrandWordmark className={className} accentClassName={accentClassName} />
          ) : null}
        </Fragment>
      ))}
    </>
  )
}
