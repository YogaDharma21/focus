"use client"

import { useState } from "react"
import Image from "next/image"
import { Globe, Monitor, Smartphone, Shield, Check, Code, ExternalLink } from "lucide-react"

export function PlatformShowcase() {
  const [activePlatform, setActivePlatform] = useState<string>("web")

  const apps = [
    {
      id: "web",
      name: "Focus Web",
      path: "apps/website",
      url: "https://focustracks.vercel.app",
      icon: Globe,
      tech: ["Next.js 16", "React 19", "Tailwind CSS", "Zustand"],
      tagline: "Full-featured web application available at focustracks.vercel.app.",
      description:
        "The web version brings together customizable Pomodoro & Flow timers, deep focus full-screen mode, lofi music player, and task tracking directly in your browser.",
      features: [
        "Pomodoro & Flow timer modes",
        "Smart Flow break calculator (1/5th session length)",
        "Deep Focus full-screen mode with hotkeys (Esc / F)",
        "Lofi beats player & minimalist visual themes",
        "Comprehensive stats & streak tracking",
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
      tagline: "Native desktop performance with system tray controls.",
      description:
        "Keep your focus workflow on your desktop with system tray integrations, global hotkeys, offline audio playback, and quick task capture.",
      features: [
        "System tray / Menu bar quick timer menu",
        "Global keyboard shortcuts to start/pause sessions",
        "Offline audio player with pre-loaded tracks",
        "Native OS desktop notifications",
        "Zero-latency local storage sync",
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
      tagline: "On-the-go focus tracking for iOS & Android.",
      description:
        "Stay productive wherever you are. Focus Mobile delivers a smooth React Native experience with haptic timer controls and mobile task management.",
      features: [
        "Native haptic feedback on timer controls",
        "Mobile-optimized task lists & quick add",
        "Pocket stats and streak counts",
        "Dark mode & OLED themes",
        "Background timer notifications",
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
      tagline: "Built-in Focus Shield site blocker & popup timer.",
      description:
        "Block web distractions before they ruin your flow. Focus Extension embeds Focus Shield website blocking directly into Chrome, Firefox, Edge, and Brave.",
      features: [
        "Focus Shield site blocker (custom blocklists)",
        "Distraction shield screen when visiting blocked domains",
        "Instant popup menu with timer & task controls",
        "Tab limit manager",
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
    <section id="ecosystem" className="py-20 bg-muted/30 border-y border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Polyglot Monorepo</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            One Unified Experience Across 4 Platforms
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Work seamlessly across Web, Desktop, Mobile, and Browser Extension.
          </p>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-10">
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
                className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                  isActive
                    ? "bg-background border-foreground/40 text-foreground"
                    : "bg-card/50 border-border hover:bg-card text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {app.path}
                  </span>
                </div>
                <div>
                  <h3 className={`font-bold text-xs ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {app.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {app.tagline}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active App Showcase Card */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* App Info Left */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                  {currentApp.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentApp.path}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {currentApp.tagline}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {currentApp.description}
                </p>
              </div>

              {currentApp.url && (
                <div>
                  <a
                    href={currentApp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Visit Website Version ({currentApp.url})
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}

              {/* Tech Badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Code className="size-3" /> Tech Stack:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentApp.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-muted text-foreground text-xs font-medium border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-2 pt-1">
                {currentApp.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className="size-3.5 text-foreground shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshots Right */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border bg-background aspect-[16/10]">
                <Image
                  src={currentApp.screenshots[selectedShotIndex]?.src || currentApp.screenshots[0].src}
                  alt={currentApp.screenshots[selectedShotIndex]?.name || currentApp.name}
                  width={1000}
                  height={625}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {currentApp.screenshots.map((shot, idx) => (
                  <button
                    key={shot.name}
                    onClick={() => setSelectedShotIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedShotIndex === idx
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
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
