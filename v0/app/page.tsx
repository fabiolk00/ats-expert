import Header from "@/components/landing/header"
import HeroSection from "@/components/landing/hero-section"
import HowItWorksSection from "@/components/landing/how-it-works-section"
import TrustSection from "@/components/landing/trust-section"
import Footer from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <TrustSection />
      </main>
      <Footer />
    </div>
  )
}
