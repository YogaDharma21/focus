"use client"

import { Globe, Monitor, Smartphone, Shield, Download, ExternalLink, ArrowRight } from "lucide-react"

export function DownloadSection() {
  const downloads = [
    {
      title: "Focus Web",
      category: "Web Application",
      icon: Globe,
      description: "Access your timers and tasks directly from any web browser without installation.",
      buttonText: "Launch Web App",
      buttonLink: "#interactive-demo",
      badge: "No Install Required",
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
    <section id="download" className="py-24 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
            <Download className="size-3.5" />
            <span>Available Everywhere</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Get Focus on All Your Devices
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Download the native desktop app, mobile app, or browser extension — or start using the web app immediately.
          </p>
        </div>

        {/* Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {downloads.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  item.isPrimary
                    ? "bg-card border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30 scale-[1.02]"
                    : "bg-card/60 border-border/60 hover:border-border hover:bg-card shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        item.isPrimary
                          ? "bg-indigo-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-foreground mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                  <a
                    href={item.buttonLink}
                    target={item.buttonLink.startsWith("http") ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      item.isPrimary
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-indigo-500/20"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <span>{item.buttonText}</span>
                    {item.buttonLink.startsWith("http") ? (
                      <ExternalLink className="size-3.5" />
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )}
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
