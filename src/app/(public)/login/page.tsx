import { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Entrar - CurrIA",
  description: "Entre na sua conta CurrIA",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <LoginForm />
    </div>
  )
}
