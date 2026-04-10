import { Metadata } from "next"

import AuthShell from "@/components/auth/auth-shell"
import SignupForm from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Criar conta - CurrIA",
  description: "Crie sua conta CurrIA",
}

export default function SignupPage() {
  return (
    <AuthShell
      mode="signup"
      title="Criar conta"
      description=""
    >
        <SignupForm />
    </AuthShell>
  )
}
