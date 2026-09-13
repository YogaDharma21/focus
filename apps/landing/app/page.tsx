import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { FeaturesSection } from "@/components/landing/features-section"
import { DownloadSection } from "@/components/landing/download-section"
import { FAQSection } from "@/components/landing/faq-section"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <Header />
      <main>
        <Hero />
        <FeaturesSection />
        <DownloadSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
