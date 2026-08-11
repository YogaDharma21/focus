"use client"

import { useState } from "react"
import Image from "next/image"
import { Globe, Monitor, Smartphone, Shield, ExternalLink, ArrowRight, Check } from "lucide-react"

export function Hero() {
  const [activeTab, setActiveTab] = useState<"website" | "desktop" | "mobile" | "extension">("website")

  const platforms = [
    {
      id: "website",
      name: "Web App",
      icon: Globe,
      badge: "focustracks.vercel.app",
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
      badge: "Focus Shield",
      imgSrc: "/screenshots/extension/Screenshot-timer.png",
      alt: "Focus Browser Extension",
    },
  ]

  const currentPlatform = platforms.find((p) => p.id === activeTab)!

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium mb-6">
          <span>Focus Ecosystem v1.0 • Monorepo</span>
        </div>

        {/* Hero Title - No Gradient */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground">
          Master Your Attention. Stay in Flow.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          The minimalist productivity suite with customizable Pomodoro & Flow timers, 
          intelligent break calculations, website distraction blocking, and lofi audio.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://focustracks.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Open Web App (focustracks.vercel.app)
            <ExternalLink className="size-4" />
          </a>
          <a
            href="#ecosystem"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted hover:bg-muted/80 text-foreground font-medium text-sm border border-border transition-colors"
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

        {/* Platform Preview Mockup */}
        <div className="mt-12 max-w-5xl mx-auto">
          {/* Tab Selector */}
          <div className="flex items-center justify-center gap-1.5 mb-5 p-1 bg-muted rounded-xl border border-border max-w-fit mx-auto">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const isActive = activeTab === platform.id
              return (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{platform.name}</span>
                </button>
              )
            })}
          </div>

          {/* Screenshot Container - Minimal */}
          <div className="rounded-2xl border border-border bg-card p-2 sm:p-3 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-muted/50 rounded-lg border border-border/50 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-border" />
                <div className="size-2.5 rounded-full bg-border" />
                <div className="size-2.5 rounded-full bg-border" />
              </div>
              <span>focus-app / {currentPlatform.id}</span>
              <span className="text-[10px] text-muted-foreground font-sans">
                {currentPlatform.badge}
              </span>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-border aspect-[16/10] sm:aspect-[16/9] bg-background">
              <Image
                src={currentPlatform.imgSrc}
                alt={currentPlatform.alt}
                width={1200}
                height={750}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
