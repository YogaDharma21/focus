"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Globe, Monitor, Smartphone, Shield, ExternalLink, ArrowRight, Check } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap"

export function Hero() {
  const [activeTab, setActiveTab] = useState<"website" | "desktop" | "mobile" | "extension">("website")
  const heroRef = useRef<HTMLElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

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

  // Entrance animations for Hero elements
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as { reduceMotion: boolean }

          if (reduceMotion) {
            gsap.set([".hero-title", ".hero-sub", ".hero-cta", ".hero-badge-item", ".hero-preview-frame"], {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              clearProps: "all",
            })
            return
          }

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              gsap.set([".hero-title", ".hero-sub", ".hero-cta-btn", ".hero-badge-item"], {
                clearProps: "opacity,visibility",
              })
            },
          })

          tl.from(".hero-title", {
            y: 28,
            autoAlpha: 0,
            duration: 0.8,
            delay: 0.05,
          })
            .from(
              ".hero-sub",
              {
                y: 20,
                autoAlpha: 0,
                duration: 0.7,
              },
              "-=0.5"
            )
            .from(
              ".hero-cta-btn",
              {
                y: 16,
                autoAlpha: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.4)",
              },
              "-=0.4"
            )
            .from(
              ".hero-badge-item",
              {
                y: 12,
                autoAlpha: 0,
                duration: 0.5,
                stagger: 0.08,
              },
              "-=0.3"
            )
            .from(
              ".hero-preview-frame",
              {
                y: 35,
                autoAlpha: 0,
                scale: 0.97,
                duration: 0.85,
                ease: "power2.out",
              },
              "-=0.4"
            )

          // Subtle scroll parallax on hero preview
          gsap.to(".hero-preview-frame", {
            yPercent: 3,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          })
        }
      )
    },
    { scope: heroRef }
  )

  // Fluid transition when switching preview tabs
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (previewContainerRef.current) {
          gsap.fromTo(
            previewContainerRef.current,
            { opacity: 0.6, scale: 0.99 },
            { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out", clearProps: "transform,opacity" }
          )
        }
      })
    },
    { scope: heroRef, dependencies: [activeTab] }
  )

  return (
    <section ref={heroRef} className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

        {/* Hero Title */}
        <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground text-balance">
          Master Your Attention <br className="hidden sm:block" />
          Stay in Flow
        </h1>

        {/* Subtitle */}
        <p className="hero-sub mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          The minimalist productivity suite with customizable Pomodoro & Flow timers, 
          intelligent break calculations, website distraction blocking, and lofi audio.
        </p>

        {/* CTAs */}
        <div className="hero-cta mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://focustracks.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all hover:scale-[1.02] hover:shadow-lg shadow-primary/10 active:scale-[0.98]"
          >
            Launch Web App
            <ExternalLink className="size-4" />
          </a>
          <a
            href="#ecosystem"
            className="hero-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm border border-border transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore All 4 Apps
            <ArrowRight className="size-4" />
          </a>
        </div>

        {/* Key Points */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground font-medium">
          <div className="hero-badge-item flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Cross-Platform Sync</span>
          </div>
          <div className="hero-badge-item flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Focus Shield Site Blocker</span>
          </div>
          <div className="hero-badge-item flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Offline Support</span>
          </div>
          <div className="hero-badge-item flex items-center gap-1.5">
            <Check className="size-3.5 text-foreground" />
            <span>Open Source</span>
          </div>
        </div>

        {/* Platform Preview Showcase */}
        <div className="hero-preview-frame mt-12 max-w-5xl mx-auto">
          {/* Tab Selector */}
          <div className="flex items-center justify-center gap-1.5 mb-6 p-1 bg-muted rounded-xl border border-border max-w-fit mx-auto shadow-sm">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const isActive = activeTab === platform.id
              return (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id as "website" | "desktop" | "mobile" | "extension")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-background text-foreground border border-border shadow-sm scale-100"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{platform.name}</span>
                </button>
              )
            })}
          </div>

          {/* Screenshot Display Frame */}
          <div ref={previewContainerRef}>
            {activeTab === "mobile" ? (
              /* Authentic Mobile Phone Frame */
              <div className="max-w-[310px] sm:max-w-[340px] mx-auto rounded-[48px] border-[8px] border-neutral-800 bg-neutral-950 p-2 shadow-2xl overflow-hidden relative transition-all">
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
              <div className="max-w-[380px] sm:max-w-[420px] mx-auto rounded-2xl border border-border bg-card p-3 shadow-xl text-left transition-all">
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
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl text-left transition-all">
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
      </div>
    </section>
  )
}
