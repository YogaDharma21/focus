"use client"

import { useRef } from "react"
import { Timer, Shield, CheckSquare, Music, BarChart3, Heart } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap"

export function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null)

  const features = [
    {
      icon: Timer,
      title: "Smart Flow & Pomodoro Timers",
      subtitle: "Tailored to your focus style",
      description:
        "Switch between traditional 25-minute Pomodoro sprints or continuous Flow mode. Flow mode automatically calculates your break length as 1/5th of your session (e.g. 50 mins flow = 10 mins break).",
      badge: "Smart Break",
    },
    {
      icon: Shield,
      title: "Focus Shield Site Blocker",
      subtitle: "Eliminate web distractions",
      description:
        "Browser extension shield that blocks distracting websites during active sessions. Supports custom domain blocklists with soft warnings or hard block modes.",
      badge: "Browser Extension",
    },
    {
      icon: CheckSquare,
      title: "Session-Linked Tasks",
      subtitle: "Connect your to-dos to your timers",
      description:
        "Group tasks into custom categories, set estimates, and track subtasks. Finishing a timer session auto-marks your active task as completed.",
      badge: "Task Sync",
    },
    {
      icon: Music,
      title: "Lofi Music Player",
      subtitle: "Relaxing focus background beats",
      description:
        "Listen to curated lofi beats while working to create an uninterrupted focus environment across all your devices.",
      badge: "Music",
    },
    {
      icon: BarChart3,
      title: "Analytics & Streaks",
      subtitle: "Track your progress over time",
      description:
        "Visualize your daily focus minutes, task completion rates, current streak metrics, and peak focus hours.",
      badge: "Analytics",
    },
    {
      icon: Heart,
      title: "Mood & Daily Reflections",
      subtitle: "Journal your state of mind",
      description:
        "Log your energy level and mood after every focus session to discover your peak productivity windows.",
      badge: "Reflections",
    },
  ]

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
            gsap.set([".features-header", ".feature-card"], { autoAlpha: 1, y: 0 })
            return
          }

          gsap.from(".features-header", {
            y: 30,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".features-header",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          })

          gsap.from(".feature-card", {
            y: 35,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".features-grid",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          })
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="features-header text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Features</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything You Need to Focus
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Minimalist tools designed to eliminate friction and keep you in flow state.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="feature-card group bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-foreground/30 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-muted text-foreground transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 mb-2">
                    {feature.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
