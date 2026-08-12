import Link from "next/link";
import { ArrowLeft, Focus, Sparkles, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          
          {/* Animated Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-6 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>404 - Out of Focus</span>
          </div>

          {/* Glowing 404 Hero Display */}
          <div className="relative flex items-center justify-center mb-6">
            <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                <Focus className="w-10 h-10 sm:w-12 sm:h-12 text-primary opacity-80" />
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Lost Your Flow?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            The page you are looking for has drifted away or does not exist. Let's get your attention back on track.
          </p>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full sm:w-auto font-medium px-6 gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              )}
            >
              <Focus className="w-4 h-4" />
              Return to Focus App
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto font-medium px-6 gap-2 border-white/10 hover:bg-white/10"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back Home
            </Link>
          </div>

          {/* Footer Hint */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
            <Compass className="w-3.5 h-3.5" />
            <span>Need assistance? Reach back to your main workspace.</span>
          </div>

        </div>
      </div>
    </main>
  );
}
