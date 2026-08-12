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

        {/* Platform Preview Showcase */}
        <div className="mt-12 max-w-5xl mx-auto">
          {/* Tab Selector */}
          <div className="flex items-center justify-center gap-1.5 mb-6 p-1 bg-muted rounded-xl border border-border max-w-fit mx-auto">
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

          {/* Screenshot Display Frame */}
          {activeTab === "mobile" ? (
            /* Authentic Mobile Phone Frame */
            <div className="max-w-[310px] sm:max-w-[340px] mx-auto rounded-[48px] border-[8px] border-neutral-800 bg-neutral-950 p-2 shadow-2xl overflow-hidden relative">
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4 bg-neutral-800 rounded-full mx-auto mb-2" />
              <div className="rounded-[36px] overflow-hidden border border-neutral-800 bg-background aspect-[720/1607]">
                <Image
                  src={currentPlatform.imgSrc}
                  alt={currentPlatform.alt}
                  width={720}
                  height={1607}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          ) : activeTab === "extension" ? (
            /* Browser Extension Popup Box Frame */
            <div className="max-w-[380px] sm:max-w-[420px] mx-auto rounded-2xl border border-border bg-card p-3 shadow-xl text-left">
              <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-muted/60 rounded-lg border border-border/50 text-[11px] font-mono text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-foreground/20" />
                  <div className="size-2 rounded-full bg-foreground/20" />
                  <div className="size-2 rounded-full bg-foreground/20" />
                </div>
                <span>Focus Extension Popup</span>
                <span className="text-[10px] text-muted-foreground">{currentPlatform.badge}</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-border bg-background aspect-[525/720]">
                <Image
                  src={currentPlatform.imgSrc}
                  alt={currentPlatform.alt}
                  width={525}
                  height={720}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          ) : (
            /* Desktop / Web App Full Window Frame */
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl text-left">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border text-[11px] font-mono text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-foreground/20" />
                    <div className="size-2.5 rounded-full bg-foreground/20" />
                    <div className="size-2.5 rounded-full bg-foreground/20" />
                  </div>
                  <span className="ml-2 font-medium text-foreground">focus-app / {currentPlatform.id}</span>
                </div>
                <span className="text-[11px] font-sans text-muted-foreground font-medium">
                  {currentPlatform.badge}
                </span>
              </div>

              {/* Full Image Container - Edge to Edge */}
              <div className="bg-background overflow-hidden flex items-center justify-center">
                <Image
                  src={currentPlatform.imgSrc}
                  alt={currentPlatform.alt}
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[580px] object-cover object-top"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
