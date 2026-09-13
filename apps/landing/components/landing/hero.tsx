"use client"

import { ExternalLink, ArrowRight, Check } from "lucide-react"
import { WebTimerPreview } from "./app-previews"

export function Hero() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground text-balance">
          Master Your Attention <br className="hidden sm:block" />
          Stay in Flow
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          The minimalist productivity suite with customizable Pomodoro & Flow timers, 
          intelligent break calculations, website distraction blocking, and lofi audio.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://app.focustrackers.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Launch Web App
            <ExternalLink className="size-4" />
          </a>
          <a
            href="#ecosystem"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm border border-border transition-colors"
          >
            Explore All 4 Apps
            <ArrowRight className="size-4" />
          </a>
        </div>

        {/* Key Points */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Cross-Platform Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Focus Shield Site Blocker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Offline Support</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Open Source</span>
          </div>
        </div>

        {/* App Preview Component */}
        <div className="mt-12 max-w-2xl mx-auto">
          <WebTimerPreview />
        </div>
      </div>
    </section>
  )
}
