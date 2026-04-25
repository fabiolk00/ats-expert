import { Check, Sparkles, X } from "lucide-react"

import { PLANS, formatPrice, type PlanSlug } from "@/lib/plans"
import { cn } from "@/lib/utils"

function BoolCell({ value, highlight }: { value: "Sim" | "Não"; highlight?: boolean }) {
  if (value === "Sim") {
    return (
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          highlight ? "bg-green-500" : "bg-green-500",
        )}
      >
        <Check size={12} strokeWidth={3} className="text-white" />
      </div>
    )
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
      <X size={12} strokeWidth={3} className="text-white" />
    </div>
  )
}

const plans: Array<{
  slug: PlanSlug
  ats: string
  pdf: "Sim" | "Não"
  chatIA: "Sim" | "Não"
  historico: "Sim" | "Não"
  highlight: "black" | "gold" | null
}> = [
  {
    slug: "free",
    ats: "Básico",
    pdf: "Não",
    chatIA: "Não",
    historico: "Não",
    highlight: null,
  },
  {
    slug: "unit",
    ats: "Completo",
    pdf: "Sim",
    chatIA: "Não",
    historico: "Sim",
    highlight: null,
  },
  {
    slug: "monthly",
    ats: "Completo",
    pdf: "Sim",
    chatIA: "Não",
    historico: "Sim",
    highlight: "black",
  },
  {
    slug: "pro",
    ats: "Completo",
    pdf: "Sim",
    chatIA: "Sim",
    historico: "Sim",
    highlight: "gold",
  },
] as const

const columns = [
  { label: "Plano", key: "name" },
  { label: "Preço", key: "price" },
  { label: "Currículos", key: "curriculos" },
  { label: "ATS Expert", key: "ats" },
  { label: "PDF", key: "pdf" },
  { label: "Chat com IA", key: "chatIA" },
  { label: "Histórico", key: "historico" },
] as const

type PricingComparisonTableProps = {
  variant?: "standalone" | "embedded"
}

export default function PricingComparisonTable({ variant = "standalone" }: PricingComparisonTableProps) {
  const isEmbedded = variant === "embedded"

  const table = (
    <div
      data-testid="pricing-comparison-table"
      data-variant={variant}
      className={cn("w-full overflow-x-auto", isEmbedded ? "max-w-5xl" : "max-w-4xl")}
    >
      <div
        className={cn(
          "min-w-[680px] overflow-hidden border bg-white shadow-sm",
          isEmbedded
            ? "rounded-[2rem] border-border/70 shadow-[0_24px_80px_-56px_oklch(var(--foreground)/0.7)]"
            : "rounded-2xl border-neutral-200",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-7 border-b px-6 py-4",
            isEmbedded
              ? "border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))]"
              : "border-neutral-200 bg-neutral-50/80",
          )}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                isEmbedded ? "text-muted-foreground" : "text-neutral-500",
                col.key === "name" ? "col-span-1" : "col-span-1 text-center",
              )}
            >
              {col.label}
            </div>
          ))}
        </div>

        <div className={cn(isEmbedded ? "divide-y divide-border/60" : "divide-y divide-neutral-100")}>
          {plans.map((plan) => {
            const config = PLANS[plan.slug]
            const isBlack = plan.highlight === "black"
            const isGold = plan.highlight === "gold"
            const period = config.billing === "monthly" ? "/mês" : null
            const curriculos = String(config.credits)

            return (
              <div
                key={config.name}
                className={cn(
                  "group grid grid-cols-7 items-center px-6 py-5 transition-all duration-200",
                  isEmbedded ? "hover:bg-muted/30" : "hover:bg-neutral-50/50",
                  isBlack && "bg-neutral-900 hover:bg-neutral-800",
                  isGold
                    && "bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-amber-50/80 hover:from-amber-50 hover:via-yellow-50 hover:to-amber-50",
                )}
              >
                <div className="col-span-1 flex items-center gap-2.5">
                  {isBlack ? (
                    <strong className="text-sm font-semibold text-white">{config.name}</strong>
                  ) : isGold ? (
                    <span className="text-sm font-semibold" style={{ color: "#92700C" }}>
                      {config.name}
                    </span>
                  ) : (
                    <span className={cn("text-sm font-medium", isEmbedded ? "text-foreground" : "text-neutral-700")}>
                      {config.name}
                    </span>
                  )}

                  {isBlack ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-neutral-900">
                      Popular
                    </span>
                  ) : null}

                  {isGold ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide"
                      style={{ backgroundColor: "#B8860B", color: "white" }}
                    >
                      Premium
                    </span>
                  ) : null}
                </div>

                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isBlack ? "text-white" : isGold ? "text-amber-900" : isEmbedded ? "text-foreground" : "text-neutral-900",
                    )}
                  >
                    {formatPrice(config.price)}
                  </span>
                  {period ? (
                    <span className={cn("text-xs font-normal", isEmbedded ? "text-muted-foreground" : "text-neutral-400")}>
                      {period}
                    </span>
                  ) : null}
                </div>

                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold",
                      isBlack
                        ? "bg-white/10 text-white"
                        : isGold
                          ? "bg-amber-100 text-amber-800"
                          : isEmbedded
                            ? "bg-muted text-foreground"
                            : "bg-neutral-100 text-neutral-700",
                    )}
                  >
                    {curriculos}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      "text-sm",
                      isBlack ? "text-neutral-300" : isGold ? "text-amber-800" : isEmbedded ? "text-muted-foreground" : "text-neutral-600",
                      plan.ats === "Completo" && "font-medium",
                    )}
                  >
                    {plan.ats}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <BoolCell value={plan.pdf} />
                </div>

                <div className="col-span-1 flex justify-center">
                  <BoolCell value={plan.chatIA} highlight={isGold} />
                </div>

                <div className="col-span-1 flex justify-center">
                  <BoolCell value={plan.historico} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (isEmbedded) {
    return table
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 py-20">
      <div className="mb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white">
          <Sparkles size={12} />
          Planos e Preços
        </div>
        <h1 className="mb-4 text-balance text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
          Escolha o plano ideal
        </h1>
        <p className="mx-auto max-w-md text-lg text-neutral-500">
          Comece gratuitamente e evolua conforme sua necessidade
        </p>
      </div>

      {table}
    </section>
  )
}
