import { Metadata } from "next"

import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - CurrIA",
  description: "Entre na sua conta CurrIA",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.15),transparent_45%)]" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(var(--accent)/0.12),transparent_60%)] blur-3xl" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-border/60 bg-background/80 p-3 shadow-2xl shadow-primary/10 backdrop-blur">
        <LoginForm />
      </div>
    </div>
  )
}
