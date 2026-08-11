"use client"

import { Globe, Monitor, Smartphone, Shield, Download, ExternalLink } from "lucide-react"

export function DownloadSection() {
  const downloads = [
    {
      title: "Focus Web",
      category: "Web Application",
      icon: Globe,
      description: "Access your timers and tasks directly in any web browser without installation.",
      buttonText: "Launch Web App",
      buttonLink: "https://focustracks.vercel.app",
      badge: "Web App",
      isPrimary: true,
    },
    {
      title: "Focus Desktop",
      category: "macOS, Windows, Linux",
      icon: Monitor,
      description: "Native desktop performance with system tray timer, offline audio, and hotkeys.",
      buttonText: "Download Desktop App",
      buttonLink: "https://github.com/YogaDharma21/focus/tree/main/apps/desktop",
      badge: "Electron & Vite",
      isPrimary: false,
    },
    {
      title: "Focus Mobile",
      category: "iOS & Android",
      icon: Smartphone,
      description: "Tactile haptic timers, mobile task lists, and pocket stats on Expo / React Native.",
      buttonText: "Get Mobile App",
      buttonLink: "https://github.com/YogaDharma21/focus/tree/main/apps/mobile",
      badge: "Expo SDK 52",
      isPrimary: false,
    },
    {
      title: "Focus Extension",
      category: "Chrome, Edge, Firefox, Brave",
      icon: Shield,
      description: "Focus Shield website distraction blocker and quick popup timer in your browser.",
      buttonText: "Add to Browser",
      buttonLink: "https://github.com/YogaDharma21/focus/tree/main/apps/extension",
      badge: "Manifest V3",
      isPrimary: false,
    },
  ]

  return (
    <section id="download" className="py-20 bg-muted/30 border-t border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <Download className="size-3.5" />
            <span>Downloads</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Get Focus on All Devices
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Download the native apps or launch the web version immediately.
          </p>
        </div>

        {/* Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {downloads.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`rounded-2xl p-5 border transition-colors flex flex-col justify-between ${
                  item.isPrimary
                    ? "bg-card border-foreground/40"
                    : "bg-card/60 border-border hover:border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-lg ${
                        item.isPrimary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-foreground mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border">
                  <a
                    href={item.buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      item.isPrimary
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <span>{item.buttonText}</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
