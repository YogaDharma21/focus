import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground p-6 selection:bg-primary selection:text-primary-foreground">
      <div className="relative z-10 max-w-xl w-full text-center">
        {/* Solid Matte Card Container */}
        <div className="relative p-8 sm:p-12 rounded-[24px] border border-border bg-card shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)]">
          
          {/* 404 Display */}
          <h1 className="text-8xl sm:text-9xl font-bold tracking-tighter tabular-nums text-foreground select-none mb-4">
            404
          </h1>

          {/* Heading & Subtitle */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Lost Your Flow?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            The page you are looking for has drifted away or does not exist. Let&apos;s get your attention back on track.
          </p>

          {/* Single Action Button */}
          <div className="flex items-center justify-center">
            <Button asChild size="lg" className="font-medium px-6 gap-2">
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
