import type { Metadata } from "next"

import AuthShell from "@/components/auth/auth-shell"
import SignupForm from "@/components/auth/signup-form"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Criar conta - CurrIA",
  description: "Crie sua conta CurrIA",
  canonicalPath: "/criar-conta",
})

export default function CriarContaPage() {
  return (
    <AuthShell mode="signup" title="Criar conta" description="">
      <SignupForm />
    </AuthShell>
  )
}
