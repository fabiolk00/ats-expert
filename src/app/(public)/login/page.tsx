import { Metadata } from "next"

import AuthShell from "@/components/auth/auth-shell"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - CurrIA",
  description: "Entre na sua conta CurrIA",
}

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      title="Entrar na sua conta"
      description=""
    >
        <LoginForm />
    </AuthShell>
  )
}
