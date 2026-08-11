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
      badge: "Next.js 16",
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
          <span>Focus Ecosystem v0.0.1 • Monorepo</span>
        </div>

        {/* Hero Title */}
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
            Launch Web App
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

        {/* Platform Preview Mockup Container */}
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

          {/* Screenshot Device Showcase Frame */}
          <div className="rounded-2xl border border-border bg-card p-2 sm:p-4 overflow-hidden">
            {/* Window Top Controls Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-3 bg-muted/50 rounded-lg border border-border/50 text-[11px] font-mono text-muted-foreground">
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

            {/* Adaptive Screen Display Container */}
            <div className="relative rounded-lg border border-border bg-background p-2 sm:p-4 flex items-center justify-center min-h-[350px] sm:min-h-[480px]">
              {activeTab === "mobile" ? (
                /* Mobile Phone Frame */
                <div className="w-full max-w-[280px] sm:max-w-[320px] rounded-[36px] border-4 border-muted bg-card p-2 shadow-md overflow-hidden">
                  <div className="relative rounded-[28px] overflow-hidden aspect-[9/19] bg-background">
                    <Image
                      src={currentPlatform.imgSrc}
                      alt={currentPlatform.alt}
                      width={600}
                      height={1200}
                      className="object-contain w-full h-full"
                      priority
                    />
                  </div>
                </div>
              ) : activeTab === "extension" ? (
                /* Extension Popup Frame */
                <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-2 shadow-md overflow-hidden">
                  <div className="relative rounded-lg overflow-hidden aspect-[4/3] sm:aspect-[16/11] bg-background flex items-center justify-center">
                    <Image
                      src={currentPlatform.imgSrc}
                      alt={currentPlatform.alt}
                      width={800}
                      height={600}
                      className="object-contain w-full h-full"
                      priority
                    />
                  </div>
                </div>
              ) : (
                /* Desktop & Web App Frame - Full Uncropped View */
                <div className="w-full relative rounded-lg overflow-hidden max-h-[520px] flex items-center justify-center">
                  <Image
                    src={currentPlatform.imgSrc}
                    alt={currentPlatform.alt}
                    width={1200}
                    height={750}
                    className="object-contain max-h-[500px] w-auto mx-auto rounded-md"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
