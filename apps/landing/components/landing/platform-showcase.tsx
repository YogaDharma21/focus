"use client"

import { useState } from "react"
import Image from "next/image"
import { Globe, Monitor, Smartphone, Shield, Check, Layers, Code, Zap, Sparkles } from "lucide-react"

export function PlatformShowcase() {
  const [activePlatform, setActivePlatform] = useState<string>("web")

  const apps = [
    {
      id: "web",
      name: "Focus Web",
      path: "apps/website",
      icon: Globe,
      tech: ["Next.js 16", "React 19", "Tailwind CSS", "Zustand"],
      tagline: "Full-featured web application with customizable ambient environments.",
      description:
        "The flagship web app brings together customizable Pomodoro & Flow timers, deep focus mode with full-screen distraction-free backgrounds, sound players, and task tracking.",
      features: [
        "Pomodoro & Flow (Stopwatch) timer modes",
        "Smart Flow break calculator (1/5th session length)",
        "Deep Focus full-screen mode with hotkeys (Esc / F)",
        "Ambient sound player & aesthetic visual themes",
        "Comprehensive stats, streak counters & daily charts",
        "Mood logs and post-session reflections",
      ],
      screenshots: [
        { name: "Timer Session", src: "/screenshots/website/screenshot-main.png" },
        { name: "Task Management", src: "/screenshots/website/screenshot-tasks.png" },
        { name: "Stats & Analytics", src: "/screenshots/website/screenshot-stats.png" },
        { name: "Mood & Reflections", src: "/screenshots/website/screenshot-mood.png" },
      ],
    },
    {
      id: "desktop",
      name: "Focus Desktop",
      path: "apps/desktop",
      icon: Monitor,
      tech: ["Electron", "Vite", "React", "TypeScript"],
      tagline: "Native desktop performance with system tray controls and offline-first storage.",
      description:
        "Keep your focus workflow right on your desktop with system tray integrations, global hotkeys, offline audio playback, and instant task capture.",
      features: [
        "System tray / Menu bar quick timer menu",
        "Global keyboard shortcuts to start/pause sessions",
        "Offline audio player with pre-loaded ambient tracks",
        "Native OS desktop notifications",
        "Zero-latency local storage with sync support",
      ],
      screenshots: [
        { name: "Timer View", src: "/screenshots/desktop/Screenshot-timer.png" },
        { name: "Task List", src: "/screenshots/desktop/Screenshot-tasks.png" },
        { name: "Analytics", src: "/screenshots/desktop/Screenshot-stats.png" },
        { name: "Notes & Reflections", src: "/screenshots/desktop/Screenshot-notes.png" },
      ],
    },
    {
      id: "mobile",
      name: "Focus Mobile",
      path: "apps/mobile",
      icon: Smartphone,
      tech: ["Expo SDK 52", "React Native", "TypeScript", "Zustand"],
      tagline: "On-the-go focus tracking for iOS & Android with tactile haptic feedback.",
      description:
        "Stay productive wherever you are. Focus Mobile delivers a smooth React Native experience with haptic timer controls, mobile task management, and pocket analytics.",
      features: [
        "Native haptic feedback on timer start, pause, & complete",
        "Mobile-optimized task lists & quick add drawer",
        "Pocket stats, streak counts & focus goal progress",
        "Dark mode & energy-saving OLED themes",
        "Seamless background timer notifications",
      ],
      screenshots: [
        { name: "Mobile Timer", src: "/screenshots/mobile/screenshot-focus.jpeg" },
        { name: "Mobile Tasks", src: "/screenshots/mobile/screenshot-tasks.jpeg" },
        { name: "Mobile Stats", src: "/screenshots/mobile/screenshot-stats.jpeg" },
        { name: "Mobile Reflections", src: "/screenshots/mobile/screenshot-mood.jpeg" },
      ],
    },
    {
      id: "extension",
      name: "Focus Browser Extension",
      path: "apps/extension",
      icon: Shield,
      tech: ["Manifest V3", "Vite", "React", "Tailwind CSS"],
      tagline: "Built-in Focus Shield site blocker & quick popup timer for your browser.",
      description:
        "Block web distractions before they ruin your flow. Focus Extension embeds Focus Shield website blocking, tab limits, and popup timer directly into Chrome, Firefox, Edge, and Brave.",
      features: [
        "Focus Shield site blocker (custom blocklists & soft/hard block modes)",
        "Distraction shield screen when attempting to visit blocked domains",
        "Instant popup menu with timer & task controls",
        "Tab limit manager to stop tab clutter overload",
        "Chrome MV3 background service worker integration",
      ],
      screenshots: [
        { name: "Extension Timer", src: "/screenshots/extension/Screenshot-timer.png" },
        { name: "Focus Shield Blocker", src: "/screenshots/extension/Screenshot-block.png" },
        { name: "Extension Tasks", src: "/screenshots/extension/Screenshot-tasks.png" },
        { name: "Extension Stats", src: "/screenshots/extension/Screenshot-stats.png" },
      ],
    },
  ]

  const currentApp = apps.find((a) => a.id === activePlatform)!
  const [selectedShotIndex, setSelectedShotIndex] = useState(0)

  return (
    <section id="ecosystem" className="py-24 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-4">
            <Layers className="size-3.5" />
            <span>Polyglot Monorepo Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            One Unified Experience Across{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
              4 Platforms
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Whether you work on Web, Desktop, Mobile, or Browser Extension, Focus keeps your session timers, 
            task lists, and analytics in perfect harmony.
          </p>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {apps.map((app) => {
            const Icon = app.icon
            const isActive = activePlatform === app.id
            return (
              <button
                key={app.id}
                onClick={() => {
                  setActivePlatform(app.id)
                  setSelectedShotIndex(0)
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-card border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                    : "bg-card/40 border-border/40 hover:bg-card hover:border-border/80 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {app.path}
                  </span>
                </div>
                <div>
                  <h3
                    className={`font-bold text-sm ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {app.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {app.tagline}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active App Detailed Showcase Card */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 lg:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* App Info Left Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  {currentApp.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentApp.path}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {currentApp.tagline}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {currentApp.description}
                </p>
              </div>

              {/* Tech Stack Badges */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code className="size-3.5" /> Tech Stack:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentApp.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium border border-border/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                {currentApp.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs font-medium text-foreground">
                    <div className="size-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-3" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* App Screenshot Right Column */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Screenshot Container */}
              <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-background/50 aspect-[16/10] shadow-lg group">
                <Image
                  src={currentApp.screenshots[selectedShotIndex]?.src || currentApp.screenshots[0].src}
                  alt={currentApp.screenshots[selectedShotIndex]?.name || currentApp.name}
                  width={1000}
                  height={625}
                  className="object-cover w-full h-full transition-all duration-300"
                />
                <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-border/50 shadow-sm flex items-center gap-1.5">
                  <Sparkles className="size-3 text-amber-500" />
                  <span>{currentApp.screenshots[selectedShotIndex]?.name}</span>
                </div>
              </div>

              {/* Screenshot Selector Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentApp.screenshots.map((shot, idx) => (
                  <button
                    key={shot.name}
                    onClick={() => setSelectedShotIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      selectedShotIndex === idx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {shot.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
