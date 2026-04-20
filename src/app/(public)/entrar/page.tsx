import type { Metadata } from "next"

import AuthShell from "@/components/auth/auth-shell"
import LoginForm from "@/components/auth/login-form"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Entrar - CurrIA",
  description: "Entre na sua conta CurrIA",
  canonicalPath: "/entrar",
})

export default function EntrarPage() {
  return (
    <AuthShell mode="login" title="Entrar na sua conta" description="">
      <LoginForm />
    </AuthShell>
  )
}
