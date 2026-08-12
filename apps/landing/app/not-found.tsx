import Link from "next/link"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { buttonVariants } from "@/components/ui/button"
import { ArrowLeft, Timer, Sparkles, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <Header />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-8">
            <Sparkles className="size-3.5" />
            <span>404 Error</span>
          </div>

          {/* Glowing Hero Number & Icon */}
          <div className="relative mb-6 flex items-center justify-center">
            <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/70 to-foreground/20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-20 sm:size-24 rounded-full border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-md flex items-center justify-center animate-pulse">
                <Timer className="size-10 text-indigo-400 opacity-90" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Looks like you've drifted off focus.
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
            The page you are looking for doesn't exist or has been relocated. Let's get you back to productivity.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className={buttonVariants({
                size: "lg",
                className: "w-full sm:w-auto font-semibold px-6 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25",
              })}
            >
              <Home className="size-4" />
              Back to Main Page
            </Link>
            <Link
              href="/#features"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto font-semibold px-6 gap-2 border-border hover:bg-muted",
              })}
            >
              <ArrowLeft className="size-4" />
              Explore Features
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
