import { Metadata } from "next"
import SignupForm from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Criar conta - CurrIA",
  description: "Crie sua conta CurrIA",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <SignupForm />
    </div>
  )
}
