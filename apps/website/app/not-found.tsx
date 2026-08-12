import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground p-6 selection:bg-primary selection:text-primary-foreground">
      {/* Background ambient glowing orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-10 left-10 w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center">
        {/* Glassmorphic Card Container */}
        <div className="relative p-8 sm:p-12 rounded-3xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-2xl shadow-2xl transition-all duration-300">
          
          {/* Glowing 404 Display */}
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30 select-none mb-4">
            404
          </h1>

          {/* Heading & Subtitle */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Lost Your Flow?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            The page you are looking for has drifted away or does not exist. Let's get your attention back on track.
          </p>

          {/* Single Action Button */}
          <div className="flex items-center justify-center">
            <Button asChild size="lg" className="font-medium px-6 gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                Go Back Home
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </main>
  );
}
