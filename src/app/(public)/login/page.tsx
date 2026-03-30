import { Metadata } from "next"

import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - CurrIA",
  description: "Entre na sua conta CurrIA",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.15),transparent_45%)]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(var(--chart-2)/0.12),transparent_60%)] blur-3xl" />
      <div className="relative w-full max-w-[400px]">
        <LoginForm />
      </div>
    </div>
  )
}
