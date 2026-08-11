"use client"

import { useState } from "react"
import Image from "next/image"
import { Globe, Monitor, Smartphone, Shield, Sparkles, Play, ArrowRight, CheckCircle2 } from "lucide-react"

export function Hero() {
  const [activeTab, setActiveTab] = useState<"website" | "desktop" | "mobile" | "extension">("website")

  const platforms = [
    {
      id: "website",
      name: "Web App",
      icon: Globe,
      badge: "Next.js & React 19",
      imgSrc: "/screenshots/website/screenshot-main.png",
      alt: "Focus Web Application",
    },
    {
      id: "desktop",
      name: "Desktop App",
      icon: Monitor,
      badge: "Electron & Vite",
      imgSrc: "/screenshots/desktop/Screenshot-timer.png",
      alt: "Focus Desktop Application",
    },
    {
      id: "mobile",
      name: "Mobile App",
      icon: Smartphone,
      badge: "Expo & React Native",
      imgSrc: "/screenshots/mobile/screenshot-focus.jpeg",
      alt: "Focus Mobile Application",
    },
    {
      id: "extension",
      name: "Browser Extension",
      icon: Shield,
      badge: "Manifest V3 & Focus Shield",
      imgSrc: "/screenshots/extension/Screenshot-timer.png",
      alt: "Focus Browser Extension",
    },
  ]

  const currentPlatform = platforms.find((p) => p.id === activeTab)!

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="size-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Focus Ecosystem v1.0 • Built for Deep Work</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Master Your Attention.{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Stay in Flow.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          The minimalist, all-in-one productivity suite with customizable Pomodoro & Flow timers, 
          intelligent 1/5th break calculations, website distraction blocking, and ambient soundscapes.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#interactive-demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="size-4 fill-current" />
            Try Live Demo
          </a>
          <a
            href="#ecosystem"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-muted/60 hover:bg-muted text-foreground font-semibold text-sm border border-border/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore 4 Platforms
            <ArrowRight className="size-4" />
          </a>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Cross-Platform Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Focus Shield Site Blocker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Offline Support</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Open Source & Privacy First</span>
          </div>
        </div>

        {/* Interactive Platform Mockup Preview */}
        <div className="mt-14 max-w-5xl mx-auto">
          {/* Platform Selector Bar */}
          <div className="flex items-center justify-center gap-2 mb-6 p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/50 max-w-fit mx-auto">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const isActive = activeTab === platform.id
              return (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-md shadow-black/5 border border-border/50 scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-indigo-500" : ""}`} />
                  <span>{platform.name}</span>
                </button>
              )
            })}
          </div>

          {/* Screenshot Device Showcase Frame */}
          <div className="relative rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-indigo-500/10 overflow-hidden group">
            {/* Window Top Controls Bar */}
            <div className="flex items-center justify-between px-3 py-2 mb-3 bg-muted/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-background/50 border border-border/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>focus-app/{currentPlatform.id}</span>
              </div>
              <span className="text-[10px] font-semibold text-indigo-500 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                {currentPlatform.badge}
              </span>
            </div>

            {/* Platform Screenshot Container */}
            <div className="relative rounded-2xl overflow-hidden border border-border/40 aspect-[16/10] sm:aspect-[16/9] bg-background/50 flex items-center justify-center">
              <Image
                src={currentPlatform.imgSrc}
                alt={currentPlatform.alt}
                width={1200}
                height={750}
                className="object-cover w-full h-full rounded-xl transition-all duration-500"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
