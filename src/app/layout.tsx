import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://curria.com.br"
const imageUrl = `${baseUrl}/og-image.svg`

export const metadata: Metadata = {
  title: "CurrIA - Otimizador de Currículo com IA",
  description: "Otimize seu currículo para sistemas ATS com inteligência artificial.",
  applicationName: "CurrIA",
  authors: [{ name: "CurrIA", url: baseUrl }],
  creator: "CurrIA",
  publisher: "CurrIA",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    title: "CurrIA - Otimizador de Currículo com IA",
    description: "Otimize seu currículo para sistemas ATS com inteligência artificial.",
    siteName: "CurrIA",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "CurrIA - Otimizador de Currículo com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CurrIA - Otimizador de Currículo com IA",
    description: "Otimize seu currículo para sistemas ATS com inteligência artificial.",
    images: [imageUrl],
  },
  alternates: {
    canonical: baseUrl,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
