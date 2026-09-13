"use client"

import { Globe, Monitor, Smartphone, Shield, Check, ExternalLink } from "lucide-react"
import {
  WebTimerPreview,
  DesktopTimerPreview,
  MobileTimerPreview,
  ExtensionTimerPreview,
} from "./app-previews"

const apps = [
  {
    id: "web",
    name: "Focus Web",
    icon: Globe,
    url: "https://app.focustrackers.my.id",
    tagline: "Full-featured web application available in your browser.",
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
    Preview: WebTimerPreview,
  },
  {
    id: "desktop",
    name: "Focus Desktop",
    icon: Monitor,
    tagline: "Native desktop performance with system tray controls.",
    description:
      "Keep your focus workflow on your desktop with system tray integrations, global hotkeys, offline audio playback, and quick task capture.",
    features: [
      "System tray / Menu bar quick timer menu",
      "Global keyboard shortcuts to start/pause sessions",
      "Offline audio player with preloaded tracks",
      "Native OS desktop notifications",
      "Zero-latency local storage sync",
    ],
    Preview: DesktopTimerPreview,
  },
  {
    id: "mobile",
    name: "Focus Mobile",
    icon: Smartphone,
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
    Preview: MobileTimerPreview,
  },
  {
    id: "extension",
    name: "Focus Browser Extension",
    icon: Shield,
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
    Preview: ExtensionTimerPreview,
  },
]

export function PlatformShowcase() {
  return (
    <section id="ecosystem" className="py-20 bg-muted/30 border-y border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Cross-Platform Ecosystem</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            One Unified Experience Across 4 Platforms
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Work seamlessly across Web, Desktop, Mobile, and Browser Extension.
          </p>
        </div>

        {/* App Cards */}
        <div className="space-y-8">
          {apps.map((app, index) => {
            const Icon = app.icon
            const isReversed = index % 2 === 1
            return (
              <div
                  key={app.id}
                  className="bg-card border border-border rounded-2xl p-6 lg:p-8"
                >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* App Info */}
                  <div
                    className={`lg:col-span-5 space-y-5 ${
                      isReversed ? "lg:order-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg bg-primary text-primary-foreground`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border">
                        {app.name}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {app.tagline}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    {app.url && (
                      <div>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          Launch Web App
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Feature List */}
                    <div className="space-y-2 pt-1">
                      {app.features.map((feat) => (
                        <div
                          key={feat}
                          className="flex items-center gap-2 text-xs text-foreground"
                        >
                          <Check className="size-3.5 text-foreground shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Component */}
                  <div
                    className={`lg:col-span-7 ${
                      isReversed ? "lg:order-1" : ""
                    }`}
                  >
                    <div className="rounded-xl border border-border bg-background overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[420px] p-4">
                      <app.Preview />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
