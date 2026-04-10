export const embeddedClerkAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "border-0 bg-transparent shadow-none rounded-none p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "mx-auto h-12 rounded-2xl border border-black bg-black text-white hover:bg-slate-900",
    socialButtonsBlockButtonText: "font-semibold",
    dividerLine: "bg-slate-200",
    dividerText: "text-xs font-medium uppercase tracking-[0.18em] text-slate-400",
    formButtonPrimary:
      "h-12 rounded-2xl bg-black text-white hover:bg-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.2)]",
    formFieldInput:
      "h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-none",
    formFieldLabel: "text-sm font-medium text-slate-700",
    footerActionLink: "text-[#2952f3] hover:text-[#2148dd]",
    alert: "rounded-2xl border border-amber-200 bg-amber-50 text-amber-900",
    formResendCodeLink: "text-[#2952f3] hover:text-[#2148dd]",
    identityPreviewText: "text-sm text-slate-500",
    footer: "hidden",
    formFieldRow: "gap-4",
    formFieldAction: "text-[#2952f3] hover:text-[#2148dd]",
  },
} as const
